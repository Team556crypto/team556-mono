package models

import (
	"time"

	"gorm.io/gorm"
)

// User represents a user in the database
type User struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email" gorm:"uniqueIndex;not null"`
	Password  string `json:"-"`                                   // Add hashed password field, exclude from JSON
	UserCode  string `json:"user_code" gorm:"uniqueIndex;size:8"` // Unique code for the user

	EmailVerified              bool       `gorm:"default:false" json:"email_verified"` // Changed JSON tag to snake_case
	EmailVerificationCode      *string    `gorm:"index" json:"-"`                      // Nullable, index for lookup
	EmailVerificationExpiresAt *time.Time `json:"-"`

	// POS Wallet Addresses for receiving payments
	PrimaryWalletAddress   string  `json:"primary_wallet_address" gorm:"size:44;default:''"`
	SecondaryWalletAddress *string `json:"secondary_wallet_address,omitempty" gorm:"size:44"`

	Wallets []Wallet `json:"wallets,omitempty"` // One-to-many relationship
}
