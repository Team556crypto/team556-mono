package security

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/pquerna/otp"
	"github.com/pquerna/otp/totp"
	"github.com/skip2/go-qrcode"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/team556-mono/server/internal/config"
	appcrypto "github.com/team556-mono/server/internal/crypto"
	"github.com/team556-mono/server/internal/models"
)

// TotpProvisioning bundles details required to set up an authenticator app.
type TotpProvisioning struct {
	Secret    string
	OtpauthURL string
	QRImageDataURI string // data:image/png;base64,...
}

// BeginTOTPSetup generates a new TOTP secret, stores it encrypted on the user (not yet enabled),
// and returns provisioning data for the client to display.
func BeginTOTPSetup(db *gorm.DB, cfg *config.Config, user *models.User, issuer string) (TotpProvisioning, error) {
	if user == nil || user.Email == "" {
		return TotpProvisioning{}, errors.New("invalid user")
	}

	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      issuer,
		AccountName: strings.ToLower(user.Email),
		Period:      30,
		Digits:      otp.DigitsSix,
	})
	if err != nil {
		return TotpProvisioning{}, fmt.Errorf("generate totp secret: %w", err)
	}

	secret := key.Secret()
	otpauthURL := key.URL()

	// Encrypt and save secret on user so we can verify on enable.
	if cfg.MFAEncryptSecret == "" {
		return TotpProvisioning{}, errors.New("MFA encryption secret not configured")
	}
	enc, err := appcrypto.EncryptAESGCM(secret, cfg.MFAEncryptSecret)
	if err != nil {
		return TotpProvisioning{}, fmt.Errorf("encrypt secret: %w", err)
	}

	if err := db.Model(user).Updates(map[string]any{
		"mfa_secret_encrypted": enc,
		"mfa_enabled":          false,
	}).Error; err != nil {
		return TotpProvisioning{}, fmt.Errorf("persist secret: %w", err)
	}

	// Generate a small PNG QR and return as data URI for convenience.
	png, err := qrcode.Encode(otpauthURL, qrcode.Medium, 200)
	if err != nil {
		// Non-fatal: return with empty QR; client can render otpauth URL itself.
		png = nil
	}
	dataURI := ""
	if len(png) > 0 {
		dataURI = "data:image/png;base64," + base64.StdEncoding.EncodeToString(png)
	}

	return TotpProvisioning{Secret: secret, OtpauthURL: otpauthURL, QRImageDataURI: dataURI}, nil
}

// EnableTOTP verifies a TOTP code and enables MFA on success. Returns new recovery codes to show once.
func EnableTOTP(db *gorm.DB, cfg *config.Config, userID uint, code string) ([]string, error) {
	var user models.User
	if err := db.First(&user, userID).Error; err != nil {
		return nil, err
	}
	if user.MFASecretEncrypted == nil {
		return nil, errors.New("no TOTP secret present; run setup first")
	}
	secret, err := appcrypto.DecryptAESGCM(*user.MFASecretEncrypted, cfg.MFAEncryptSecret)
	if err != nil {
		return nil, fmt.Errorf("decrypt secret: %w", err)
	}
	if ok := totp.Validate(code, secret); !ok {
		return nil, errors.New("invalid TOTP code")
	}
	// Mark as enabled
	if err := db.Model(&user).Update("mfa_enabled", true).Error; err != nil {
		return nil, err
	}
	// Generate and store recovery codes
	codes, hashes, err := generateRecoveryCodes(10)
	if err != nil {
		return nil, err
	}
	for _, h := range hashes {
		rec := models.MfaRecoveryCode{UserID: user.ID, CodeHash: h}
		if err := db.Create(&rec).Error; err != nil {
			return nil, err
		}
	}
	return codes, nil
}

// VerifyMFA validates a TOTP or recovery code. If a recovery code matches, it is consumed.
func VerifyMFA(db *gorm.DB, cfg *config.Config, userID uint, code string) (bool, error) {
	var user models.User
	if err := db.First(&user, userID).Error; err != nil {
		return false, err
	}
	if user.MFAEnabled && user.MFASecretEncrypted != nil {
		secret, err := appcrypto.DecryptAESGCM(*user.MFASecretEncrypted, cfg.MFAEncryptSecret)
		if err != nil {
			return false, err
		}
		if totp.Validate(code, secret) {
			return true, nil
		}
	}
	// Check recovery codes
	var recs []models.MfaRecoveryCode
	if err := db.Where("user_id = ? AND used_at IS NULL", userID).Find(&recs).Error; err != nil {
		return false, err
	}
	for i := range recs {
		if bcrypt.CompareHashAndPassword([]byte(recs[i].CodeHash), []byte(code)) == nil {
			now := time.Now()
			if err := db.Model(&recs[i]).Update("used_at", &now).Error; err != nil {
				return false, err
			}
			return true, nil
		}
	}
	return false, nil
}

// DisableMFA disables MFA after successful verification with TOTP or recovery code.
func DisableMFA(db *gorm.DB, cfg *config.Config, userID uint, code string) error {
	ok, err := VerifyMFA(db, cfg, userID, code)
	if err != nil {
		return err
	}
	if !ok {
		return errors.New("verification failed")
	}
	// Wipe secret and disable
	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]any{
			"mfa_enabled":          false,
			"mfa_secret_encrypted": gorm.Expr("NULL"),
		}).Error; err != nil {
			return err
		}
		if err := tx.Where("user_id = ?", userID).Delete(&models.MfaRecoveryCode{}).Error; err != nil {
			return err
		}
		return nil
	})
}

// RotateRecoveryCodes replaces existing codes with new ones and returns plaintext codes.
func RotateRecoveryCodes(db *gorm.DB, userID uint) ([]string, error) {
	codes, hashes, err := generateRecoveryCodes(10)
	if err != nil {
		return nil, err
	}
	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("user_id = ?", userID).Delete(&models.MfaRecoveryCode{}).Error; err != nil {
			return err
		}
		for _, h := range hashes {
			if err := tx.Create(&models.MfaRecoveryCode{UserID: userID, CodeHash: h}).Error; err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		return nil, err
	}
	return codes, nil
}

func generateRecoveryCodes(n int) ([]string, []string, error) {
	codes := make([]string, n)
	hashes := make([]string, n)
	for i := 0; i < n; i++ {
		code, err := randomRecoveryCode()
		if err != nil { return nil, nil, err }
		codes[i] = code
		hash, err := bcrypt.GenerateFromPassword([]byte(code), bcrypt.DefaultCost)
		if err != nil { return nil, nil, err }
		hashes[i] = string(hash)
	}
	return codes, hashes, nil
}

func randomRecoveryCode() (string, error) {
	// 10 bytes -> 16 base32 chars; format as xxxx-xxxx-xxxx
	buf := make([]byte, 10)
	if _, err := rand.Read(buf); err != nil { return "", err }
	b32 := strings.ToUpper(base32NoPadding(buf))
	if len(b32) < 12 { b32 = b32 + strings.Repeat("X", 12-len(b32)) }
	return fmt.Sprintf("%s-%s-%s", b32[0:4], b32[4:8], b32[8:12]), nil
}

// base32NoPadding encodes to base32 without padding using a custom alphabet (RFC 4648).
func base32NoPadding(b []byte) string {
	const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
	// Simple manual base32 to avoid adding another dependency; coarse but fine for codes.
	var out []rune
	var bits uint
	var val uint
	for _, by := range b {
		val = (val << 8) | uint(by)
		bits += 8
		for bits >= 5 {
			bits -= 5
			out = append(out, rune(alphabet[(val>>bits)&31]))
		}
	}
	if bits > 0 {
		out = append(out, rune(alphabet[(val<<(5-bits))&31]))
	}
	return string(out)
}
