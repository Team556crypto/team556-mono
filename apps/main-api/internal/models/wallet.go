package models

import (
	"time"

	"gorm.io/gorm"
	"gorm.io/datatypes"
)

// Wallet represents a user's wallet in the database
type Wallet struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	UserID  uint   `json:"user_id" gorm:"not null;index"` // Foreign key to User
	Address string `json:"address" gorm:"uniqueIndex;not null"`
	Name    string `json:"name" gorm:"not null"` // e.g., "My Main Wallet"
	// Balance could be stored here or derived from transactions/external sources
	// Balance decimal.Decimal `json:"balance" gorm:"type:numeric;default:0"`

	// Server-side encryption fields
	EncryptedMnemonic  string          `json:"-"` // Store as base64 encoded string, exclude from default JSON responses
	EncryptionMetadata datatypes.JSON `json:"-"` // Store salt, nonce, params, exclude from default JSON responses
}
