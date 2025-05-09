package models

import (
	"time"

	"gorm.io/gorm"
)

// PasswordResetCode stores information for password reset requests
type PasswordResetCode struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"` // Use soft delete if desired

	UserID    uint      `gorm:"not null;index" json:"user_id"` // Foreign key to User model
	User      User      `gorm:"foreignKey:UserID" json:"-"`    // Belongs to User
	Code      string    `gorm:"not null;index" json:"-"`       // The reset code itself (consider hashing)
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`    // When the code is no longer valid
	Used      bool      `gorm:"default:false" json:"used"`     // To mark if the code has been used
}
