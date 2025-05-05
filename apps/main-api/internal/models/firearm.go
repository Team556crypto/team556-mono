package models

import (
	"time"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

// Firearm represents a firearm owned by a user
type Firearm struct {
	gorm.Model      // Includes ID, CreatedAt, UpdatedAt, DeletedAt
	UserID     uint `gorm:"not null;index"`    // Foreign key for User
	User       User `gorm:"foreignKey:UserID"` // Belongs to relationship

	Name                 string     `gorm:"size:255;not null"`
	Type                 string     `gorm:"size:100"`
	Caliber              string     `gorm:"size:255"`             // Increased size for encryption
	SerialNumber         string     `gorm:"size:255;uniqueIndex"` // Added unique index
	AcquisitionDate      *string    // Changed from *time.Time
	PurchasePrice        *string    // Changed from float64
	LastFired            *time.Time // Pointer to allow null
	Image                *string    `gorm:"type:text"` // Encrypted, use text
	Manufacturer         string     `gorm:"size:255"`
	ModelName            string     `gorm:"size:255"` // Renamed from Model
	RoundCount           *string    // Encrypted
	LastCleaned          *time.Time // Pointer to allow null
	Value                *string    // Encrypted
	Status               *string    `gorm:"size:255"`  // Encrypted
	BallisticPerformance string     `gorm:"type:text"` // Changed to string to store encrypted JSON

	// Temporary fields for processing - NOT stored in DB
	AcquisitionDateRaw *time.Time       `gorm:"-" json:"-"`
	PurchasePriceRaw   *decimal.Decimal `gorm:"-" json:"-"`
	ImageRaw           string           `gorm:"-" json:"-"` // Decrypted Image path/URL
	RoundCountRaw      int              `gorm:"-" json:"-"` // Decrypted RoundCount
	ValueRaw           float64          `gorm:"-" json:"-"` // Decrypted Value
	StatusRaw          string           `gorm:"-" json:"-"` // Decrypted Status
}
