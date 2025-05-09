package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"golang.org/x/crypto/scrypt"
	"io"
)

const (
	// Recommended salt length for scrypt
	saltLength = 16
	// Key length for AES-256
	keyLength = 32
)

// deriveAESKey derives a key from a secret using scrypt.
// It generates a salt if none is provided, ensuring consistent key derivation for the same secret and salt.
func deriveAESKey(secret string, salt []byte) ([]byte, []byte, error) {
	if len(salt) == 0 {
		salt = make([]byte, saltLength)
		if _, err := rand.Read(salt); err != nil {
			return nil, nil, fmt.Errorf("failed to generate salt: %w", err)
		}
	}

	// N=32768, r=8, p=1 are recommended parameters for interactive logins as of 2017.
	// Adjust N based on your security requirements and performance constraints.
	key, err := scrypt.Key([]byte(secret), salt, 32768, 8, 1, keyLength)
	if err != nil {
		return nil, salt, fmt.Errorf("failed to derive key using scrypt: %w", err)
	}
	return key, salt, nil
}

// EncryptAESGCM encrypts plaintext using AES-GCM with a key derived from the secret.
// It returns a base64 encoded string containing salt + nonce + ciphertext.
func EncryptAESGCM(plaintext string, secret string) (string, error) {
	// Derive key and generate a new salt
	key, salt, err := deriveAESKey(secret, nil) // Pass nil to generate a new salt
	if err != nil {
		return "", fmt.Errorf("key derivation failed: %w", err)
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, aesgcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	// Seal will append the ciphertext to the nonce
	ciphertextBytes := aesgcm.Seal(nonce, nonce, []byte(plaintext), nil)

	// Combine salt and ciphertext
	saltAndCiphertext := append(salt, ciphertextBytes...)

	return base64.StdEncoding.EncodeToString(saltAndCiphertext), nil
}

// DecryptAESGCM decrypts a base64 encoded ciphertext (salt + nonce + encrypted data)
// using a key derived from the secret.
func DecryptAESGCM(encodedCiphertext string, secret string) (string, error) {
	ciphertextBytes, err := base64.StdEncoding.DecodeString(encodedCiphertext)
	if err != nil {
		return "", fmt.Errorf("failed to decode base64: %w", err)
	}

	if len(ciphertextBytes) < saltLength+12 { // 12 is the standard nonce size for AES-GCM
		return "", fmt.Errorf("invalid ciphertext size")
	}

	// Extract salt
	salt := ciphertextBytes[:saltLength]

	// Derive key using the extracted salt
	key, _, err := deriveAESKey(secret, salt) // Use the extracted salt
	if err != nil {
		return "", fmt.Errorf("key derivation failed: %w", err)
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := aesgcm.NonceSize()
	if len(ciphertextBytes) < saltLength+nonceSize {
		return "", errors.New("ciphertext too short")
	}

	nonce, actualCiphertext := ciphertextBytes[saltLength:saltLength+nonceSize], ciphertextBytes[saltLength+nonceSize:]

	plainBytes, err := aesgcm.Open(nil, nonce, actualCiphertext, nil)
	if err != nil {
		// Handle potential decryption errors (e.g., wrong key, corrupted data)
		return "", errors.New("failed to decrypt data: " + err.Error())
	}

	return string(plainBytes), nil
}
