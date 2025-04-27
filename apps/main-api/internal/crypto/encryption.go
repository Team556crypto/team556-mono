package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"

	"golang.org/x/crypto/pbkdf2"
	"gorm.io/datatypes"
)

const (
	// PBKDF2 parameters - adjust as needed for security/performance balance
	pdkdf2SaltBytes    = 16
	pdkdf2Iterations   = 600000 // Increased iterations
	pdkdf2KeyLength    = 32     // AES-256
)

// EncryptionMetadata holds the necessary info to decrypt the mnemonic
type EncryptionMetadata struct {
	Salt         string `json:"salt"`         // Base64 encoded salt
	Nonce        string `json:"nonce"`        // Base64 encoded nonce
	Iterations   int    `json:"iterations"`   // PBKDF2 iterations used
	// Algorithm string `json:"algorithm"` // Could add for future flexibility (e.g., "aes-gcm")
}

// DeriveKey uses PBKDF2 to derive a key from a password and salt
func DeriveKey(password string, salt []byte, iterations int) []byte {
	return pbkdf2.Key([]byte(password), salt, iterations, pdkdf2KeyLength, sha256.New)
}

// EncryptMnemonic encrypts the mnemonic using AES-GCM with a key derived from the password
func EncryptMnemonic(mnemonic, password string) (string, datatypes.JSON, error) {
	// 1. Generate a random salt
	salt := make([]byte, pdkdf2SaltBytes)
	if _, err := io.ReadFull(rand.Reader, salt); err != nil {
		return "", nil, errors.New("failed to generate salt: " + err.Error())
	}

	// 2. Derive the encryption key from the password and salt
	key := DeriveKey(password, salt, pdkdf2Iterations)

	// 3. Create AES cipher block
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", nil, errors.New("failed to create cipher block: " + err.Error())
	}

	// 4. Create GCM cipher
	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", nil, errors.New("failed to create GCM cipher: " + err.Error())
	}

	// 5. Generate a random nonce
	nonce := make([]byte, aesgcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", nil, errors.New("failed to generate nonce: " + err.Error())
	}

	// 6. Encrypt the mnemonic
	ciphertext := aesgcm.Seal(nil, nonce, []byte(mnemonic), nil) // No additional authenticated data

	// 7. Prepare metadata
	metadata := EncryptionMetadata{
		Salt:       base64.StdEncoding.EncodeToString(salt),
		Nonce:      base64.StdEncoding.EncodeToString(nonce),
		Iterations: pdkdf2Iterations,
	}
	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return "", nil, errors.New("failed to marshal metadata: " + err.Error())
	}

	// 8. Encode ciphertext to base64
	encryptedMnemonicBase64 := base64.StdEncoding.EncodeToString(ciphertext)

	return encryptedMnemonicBase64, datatypes.JSON(metadataJSON), nil
}

// DecryptMnemonic decrypts the base64 encoded mnemonic using the password and metadata
func DecryptMnemonic(encryptedMnemonicBase64 string, metadataJSON datatypes.JSON, password string) (string, error) {
	// 1. Decode ciphertext from base64
	ciphertext, err := base64.StdEncoding.DecodeString(encryptedMnemonicBase64)
	if err != nil {
		return "", errors.New("failed to decode mnemonic ciphertext: " + err.Error())
	}

	// 2. Unmarshal metadata
	var metadata EncryptionMetadata
	if err := json.Unmarshal(metadataJSON, &metadata); err != nil {
		return "", errors.New("failed to unmarshal encryption metadata: " + err.Error())
	}

	// 3. Decode salt and nonce from base64
	salt, err := base64.StdEncoding.DecodeString(metadata.Salt)
	if err != nil {
		return "", errors.New("failed to decode salt: " + err.Error())
	}
	nonce, err := base64.StdEncoding.DecodeString(metadata.Nonce)
	if err != nil {
		return "", errors.New("failed to decode nonce: " + err.Error())
	}

	// 4. Derive the decryption key
	// Use iterations from metadata in case it changes in the future
	key := DeriveKey(password, salt, metadata.Iterations)

	// 5. Create AES cipher block
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", errors.New("failed to create cipher block: " + err.Error())
	}

	// 6. Create GCM cipher
	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", errors.New("failed to create GCM cipher: " + err.Error())
	}

	// 7. Decrypt the mnemonic
	plaintext, err := aesgcm.Open(nil, nonce, ciphertext, nil) // No additional authenticated data
	if err != nil {
		// This error often means incorrect password/key or corrupted data
		return "", errors.New("failed to decrypt mnemonic: " + err.Error())
	}

	return string(plaintext), nil
}
