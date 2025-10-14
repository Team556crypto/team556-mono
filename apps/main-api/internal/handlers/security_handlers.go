package handlers

import (
	"errors"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/team556-mono/server/internal/config"
	"github.com/team556-mono/server/internal/email"
	"github.com/team556-mono/server/internal/models"
	"github.com/team556-mono/server/internal/security"
)

// SecurityHandler wires security endpoints (MFA, sessions, password, overview).
type SecurityHandler struct {
	DB          *gorm.DB
	Cfg         *config.Config
	EmailClient *email.Client
}

func NewSecurityHandler(db *gorm.DB, cfg *config.Config, emailClient *email.Client) *SecurityHandler {
	return &SecurityHandler{DB: db, Cfg: cfg, EmailClient: emailClient}
}

// --- Payloads ---
type changePasswordReq struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
	TotpCode        string `json:"totpCode"`
}

type verifyMfaReq struct {
	Code    string `json:"code"`
	Purpose string `json:"purpose"`
}

type enableTotpReq struct { Code string `json:"code"` }

type disableMfaReq struct { Code string `json:"code"` }

// --- Handlers ---

// GetSecurityOverview implements GET /me/security
func (h *SecurityHandler) GetSecurityOverview(c *fiber.Ctx) error {
	userIDVal := c.Locals("userID")
	if userIDVal == nil { return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"}) }
	userID := userIDVal.(uint)

	var user models.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "user not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	// Password strength unknown without plaintext; return neutral baseline 0 and generic hints.
	pwStrength := security.PasswordStrength{Score: 0, Hints: []string{"Use at least 12 characters", "Add upper/lowercase, numbers, and special characters"}}

	// Count recent failed logins (last 24h)
	var failedCount int64
	h.DB.Model(&models.LoginActivity{}).
		Where("user_id = ? AND status = ? AND created_at >= ?", user.ID, "failed_login", time.Now().Add(-24*time.Hour)).
		Count(&failedCount)

	score := security.ComputeAccountProtectionScore(user, pwStrength.Score, user.PasswordChangedAt, int(failedCount))

	// Recent activity preview (last 3)
	var recent []models.LoginActivity
	h.DB.Where("user_id = ?", user.ID).Order("created_at DESC").Limit(3).Find(&recent)

	// Map to lightweight session-like objects for the UI
	preview := make([]fiber.Map, 0, len(recent))
	for _, r := range recent {
		preview = append(preview, fiber.Map{
			"id":        r.ID,
			"createdAt": r.CreatedAt,
			"lastSeenAt": nil,
			"ip":        r.IP,
			"userAgent": r.UserAgent,
			"location":  r.Location,
			"isCurrent": false, // Determining current session requires token context; omit
			"status":    r.Status,
		})
	}

	resp := fiber.Map{
		"accountProtectionScore": score.Score,
		"status":                 score.Status,
		"lastPasswordChangeAt":   user.PasswordChangedAt,
		"recommendations":        []string{"We recommend changing your password every 90 days."},
		"passwordStrength": fiber.Map{
			"score": pwStrength.Score,
			"hints": pwStrength.Hints,
		},
		"mfaEnabled":    user.MFAEnabled,
		"recentActivity": preview,
	}
	return c.JSON(resp)
}

// ChangePassword implements POST /me/password
func (h *SecurityHandler) ChangePassword(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	var req changePasswordReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": fiber.Map{"code": "bad_request", "message": "invalid JSON"}})
	}
	if len(req.NewPassword) < 12 {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": fiber.Map{"code": "weak_password", "message": "Password must be at least 12 characters"}})
	}

	var user models.User
	if err := h.DB.First(&user, userID).Error; err != nil { return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()}) }
	// Verify current password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.CurrentPassword)); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": fiber.Map{"code": "invalid_credentials", "message": "Current password is incorrect"}})
	}
	// If MFA is enabled, require TOTP or recovery code
	if user.MFAEnabled {
		if req.TotpCode == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": fiber.Map{"code": "mfa_required", "message": "TOTP or recovery code required"}})
		}
		ok, err := security.VerifyMFA(h.DB, h.Cfg, user.ID, req.TotpCode)
		if err != nil { return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()}) }
		if !ok { return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": fiber.Map{"code": "invalid_mfa", "message": "Invalid TOTP or recovery code"}}) }
	}
	// Hash and update
	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil { return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to hash password"}) }
	now := time.Now()
	if err := h.DB.Model(&user).Updates(map[string]any{"password": string(hash), "password_changed_at": &now}).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	// Audit
	_ = h.DB.Create(&models.SecurityAuditLog{UserID: user.ID, Action: "password_changed"}).Error
	// Notify
	if h.EmailClient != nil {
		go h.EmailClient.SendPasswordChangedEmail(user.Email)
	}
	return c.JSON(fiber.Map{"ok": true})
}

// BeginTOTPSetup implements POST /me/mfa/totp/setup
func (h *SecurityHandler) BeginTOTPSetup(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	var user models.User
	if err := h.DB.First(&user, userID).Error; err != nil { return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()}) }
	prov, err := security.BeginTOTPSetup(h.DB, h.Cfg, &user, "Team556")
	if err != nil { return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()}) }
	return c.JSON(fiber.Map{"secret": prov.Secret, "otpauthUrl": prov.OtpauthURL, "qrSvg": prov.QRImageDataURI})
}

// EnableTOTP implements POST /me/mfa/totp/enable
func (h *SecurityHandler) EnableTOTP(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	var req enableTotpReq
	if err := c.BodyParser(&req); err != nil || req.Code == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": fiber.Map{"code": "bad_request", "message": "code required"}})
	}
	codes, err := security.EnableTOTP(h.DB, h.Cfg, userID, req.Code)
	if err != nil { return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": fiber.Map{"code": "mfa_enable_failed", "message": err.Error()}}) }
	_ = h.DB.Create(&models.SecurityAuditLog{UserID: userID, Action: "mfa_enabled"}).Error
	// Notify
	if h.EmailClient != nil {
		var user models.User
		h.DB.First(&user, userID)
		go h.EmailClient.SendMFAEnabledEmail(user.Email)
	}
	return c.JSON(fiber.Map{"mfaEnabled": true, "recoveryCodes": codes})
}

// VerifyMFA implements POST /me/mfa/verify
func (h *SecurityHandler) VerifyMFA(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	var req verifyMfaReq
	if err := c.BodyParser(&req); err != nil || req.Code == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": fiber.Map{"code": "bad_request", "message": "code required"}})
	}
	ok, err := security.VerifyMFA(h.DB, h.Cfg, userID, req.Code)
	if err != nil { return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()}) }
	if !ok { return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": fiber.Map{"code": "invalid_mfa", "message": "Invalid code"}}) }
	return c.JSON(fiber.Map{"ok": true})
}

// DisableMFA implements DELETE /me/mfa
func (h *SecurityHandler) DisableMFA(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	var req disableMfaReq
	if err := c.BodyParser(&req); err != nil || req.Code == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": fiber.Map{"code": "bad_request", "message": "code required"}})
	}
	if err := security.DisableMFA(h.DB, h.Cfg, userID, req.Code); err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": fiber.Map{"code": "mfa_disable_failed", "message": err.Error()}})
	}
	_ = h.DB.Create(&models.SecurityAuditLog{UserID: userID, Action: "mfa_disabled"}).Error
	if h.EmailClient != nil {
		var user models.User
		h.DB.First(&user, userID)
		go h.EmailClient.SendMFADisabledEmail(user.Email)
	}
	return c.JSON(fiber.Map{"ok": true})
}

// RotateRecoveryCodes implements POST /me/mfa/recovery/rotate
func (h *SecurityHandler) RotateRecoveryCodes(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	codes, err := security.RotateRecoveryCodes(h.DB, userID)
	if err != nil { return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()}) }
	_ = h.DB.Create(&models.SecurityAuditLog{UserID: userID, Action: "recovery_codes_rotated"}).Error
	return c.JSON(fiber.Map{"recoveryCodes": codes})
}

// ListSessions implements GET /me/sessions
func (h *SecurityHandler) ListSessions(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	limitParam := c.Query("limit", "20")
	limit, _ := strconv.Atoi(limitParam)
	if limit <= 0 { limit = 20 }
	if limit > 100 { limit = 100 }

	var sessions []models.UserSession
	h.DB.Where("user_id = ?", userID).Order("created_at DESC").Limit(limit).Find(&sessions)

	data := make([]fiber.Map, 0, len(sessions))
	for _, s := range sessions {
		data = append(data, fiber.Map{
			"id":         s.ID,
			"createdAt":  s.CreatedAt,
			"lastSeenAt": s.LastSeenAt,
			"ip":         s.IP,
			"userAgent":  s.UserAgent,
			"location":   s.Location,
			"isCurrent":  false, // Determining current session requires token or jti matching
			"status":     "successful_login",
		})
	}
	return c.JSON(fiber.Map{"data": data})
}

// RevokeSession implements DELETE /me/sessions/:id
func (h *SecurityHandler) RevokeSession(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	id := c.Params("id")
	var sess models.UserSession
	if err := h.DB.First(&sess, "id = ? AND user_id = ?", id, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": fiber.Map{"code": "not_found", "message": "session not found"}})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	if err := h.DB.Model(&sess).Update("is_revoked", true).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	_ = h.DB.Create(&models.SecurityAuditLog{UserID: userID, Action: "session_revoked"}).Error
	return c.JSON(fiber.Map{"ok": true})
}
