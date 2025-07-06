package models

import (
	"time"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

// Ammo represents ammunition owned by a user
type Ammo struct {
	ID            uint           `gorm:"primarykey" json:"id"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	UserID        uint           `gorm:"not null;index" json:"owner_user_id"`
	User          User            `gorm:"foreignKey:UserID" json:"-"`
	Manufacturer  string          `gorm:"size:255" json:"manufacturer"`
	Caliber       string          `gorm:"size:100" json:"caliber"`
	Type          string          `gorm:"size:100" json:"type"`
	Quantity      int             `json:"quantity"`
	GrainWeight   string          `gorm:"size:50" json:"grainWeight"`
	PurchaseDate  *time.Time      `json:"purchaseDate,omitempty"`
	PurchasePrice *decimal.Decimal `json:"purchasePrice,omitempty"`
	Notes         string          `gorm:"type:text" json:"notes,omitempty"`
	Pictures      *string         `gorm:"type:text" json:"pictures,omitempty"` // Storing as JSON array of strings
}
