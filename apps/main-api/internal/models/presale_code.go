package models

import "gorm.io/gorm"

// PresaleCode represents a presale code in the database
type PresaleCode struct {
	gorm.Model
	Code     string `gorm:"uniqueIndex;not null"` // The unique presale code
	Redeemed bool   `gorm:"default:false"`      // Whether the code has been redeemed
}
