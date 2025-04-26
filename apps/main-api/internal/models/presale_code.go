package models

import (
	"gorm.io/gorm"
)

// PresaleCode represents a presale code in the database
type PresaleCode struct {
	gorm.Model
	Code     string `gorm:"uniqueIndex;not null"` // The unique presale code (e.g., P1-XXXXXXX, P2-XXXXXXX)
	Type     int    `gorm:"not null;default:1"`   // Type of presale (e.g., 1 or 2), default 1 for existing rows
	Redeemed bool   `gorm:"default:false"`        // Whether the code has been redeemed
	UserID   *uint  // Foreign key to the User who redeemed it (nullable)
	User     User   // Belongs to User

	// WalletAddress is used specifically for Type 2 presales
	WalletAddress *string `gorm:"index"` // Associated wallet address for Type 2 (nullable)

	// Use soft delete
	DeletedAt gorm.DeletedAt `gorm:"index"`
}
