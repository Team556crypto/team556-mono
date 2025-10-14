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

	// Security additions
	MFAEnabled         bool       `gorm:"default:false" json:"mfa_enabled"`
	MFASecretEncrypted *string    `json:"-"` // Encrypted TOTP secret (AES-GCM); never expose via JSON
	PasswordChangedAt  *time.Time `json:"password_changed_at,omitempty"`

	// POS Wallet Addresses for receiving payments
	PrimaryWalletAddress   string  `json:"primary_wallet_address" gorm:"size:44;default:''"`
	SecondaryWalletAddress *string `json:"secondary_wallet_address,omitempty" gorm:"size:44"`

	// Referral system fields
	ReferralCode            *string    `json:"referral_code,omitempty" gorm:"uniqueIndex;size:12"` // Unique referral code for this user
	ReferredByUserID        *uint      `json:"referred_by_user_id,omitempty" gorm:"index"`         // ID of user who referred this user
	ReferralCodeGeneratedAt *time.Time `json:"referral_code_generated_at,omitempty"`              // When referral code was generated
	ReferredAt              *time.Time `json:"referred_at,omitempty"`                             // When this user was referred

	Wallets []Wallet `json:"wallets,omitempty"` // One-to-many relationship

	// Referral relationships
	ReferredBy    *User      `json:"referred_by,omitempty" gorm:"foreignKey:ReferredByUserID"` // User who referred this user
	Referrals     []Referral `json:"referrals,omitempty" gorm:"foreignKey:ReferrerUserID"`    // Users this user has referred
	ReferralStats *ReferralStats `json:"referral_stats,omitempty" gorm:"foreignKey:UserID"`   // Referral performance stats
}
