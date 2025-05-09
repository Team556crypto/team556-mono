package models

import (
	"time"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

// Firearm represents a firearm owned by a user
type Firearm struct {
	gorm.Model      // Includes ID, CreatedAt, UpdatedAt, DeletedAt
	UserID     uint `gorm:"not null;index" json:"-"`    // Foreign key for User, should not be set from json
	User       User `gorm:"foreignKey:UserID" json:"-"` // Belongs to relationship, should not be set from json

	Name                 string           `gorm:"size:255;not null" json:"name"`
	Type                 string           `gorm:"size:100" json:"type,omitempty"`
	Caliber              string           `gorm:"size:100" json:"caliber,omitempty"`
	SerialNumber         string           `gorm:"size:100;uniqueIndex" json:"serial_number"`
	AcquisitionDate      *time.Time       `json:"acquisition_date,omitempty"` 
	PurchasePrice        *decimal.Decimal `json:"purchase_price,omitempty"`
	LastFired            *time.Time       `json:"last_fired,omitempty"` 
	Image                *string          `gorm:"type:text" json:"image,omitempty"`
	Manufacturer         string           `gorm:"size:255" json:"manufacturer,omitempty"`
	ModelName            string           `gorm:"size:255" json:"model_name,omitempty"`
	RoundCount           *int             `json:"round_count,omitempty"`
	LastCleaned          *time.Time       `json:"last_cleaned,omitempty"` 
	Value                *float64         `json:"value,omitempty"`
	Status               *string          `gorm:"size:100" json:"status,omitempty"`
	BallisticPerformance string           `gorm:"type:text" json:"ballistic_performance,omitempty"`
}
