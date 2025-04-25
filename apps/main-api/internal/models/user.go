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
	Password  string `json:"-"` // Add hashed password field, exclude from JSON
	UserCode  string `json:"user_code" gorm:"uniqueIndex;not null;size:8"` // Unique code for the user
 
	Wallets []Wallet `json:"wallets,omitempty"` // One-to-many relationship
}
