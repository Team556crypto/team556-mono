package models

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// Firearm represents a firearm owned by a user
type Firearm struct {
	gorm.Model             // Includes ID, CreatedAt, UpdatedAt, DeletedAt
	UserID             uint `gorm:"not null;index"` // Foreign key for User
	User               User `gorm:"foreignKey:UserID"` // Belongs to relationship

	Name               string         `gorm:"size:255;not null"`
	Type               string         `gorm:"size:100"`
	Caliber            string         `gorm:"size:50"`
	SerialNumber       string         `gorm:"size:255;uniqueIndex"` // Added unique index
	PurchaseDate       *time.Time     // Pointer to allow null
	LastFired          *time.Time     // Pointer to allow null
	Image              string         `gorm:"size:512"`
	Manufacturer       string         `gorm:"size:255"`
	ModelName          string         `gorm:"size:255"` // Renamed from Model
	RoundCount         int
	LastCleaned        *time.Time      // Pointer to allow null
	Value              float64
	Status             string          `gorm:"size:50;default:'Active'"`
	BallisticPerformance datatypes.JSONMap `gorm:"type:jsonb"` // Stored as JSONB
}
