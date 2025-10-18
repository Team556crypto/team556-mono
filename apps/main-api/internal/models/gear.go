package models

import (
	"time"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

// Gear represents gear or accessories owned by a user
type Gear struct {
	ID                 uint             `gorm:"primarykey" json:"id"`
	CreatedAt          time.Time        `json:"created_at"`
	UpdatedAt          time.Time        `json:"updated_at"`
	DeletedAt          gorm.DeletedAt   `gorm:"index" json:"deleted_at,omitempty"`
	UserID             uint             `gorm:"not null;index" json:"owner_user_id"`
	User               User             `gorm:"foreignKey:UserID" json:"-"`
	Name               string           `gorm:"size:255;not null" json:"name"`
	Type               string           `gorm:"size:100" json:"type"` // Legacy field
	Category           string           `gorm:"size:100" json:"category"`
	Subcategory        string           `gorm:"size:100" json:"subcategory"`
	Manufacturer       string           `gorm:"size:255" json:"manufacturer"`
	ModelName          string           `gorm:"size:255" json:"model"`
	Quantity           int              `json:"quantity"`
	Condition          string           `gorm:"size:50" json:"condition"`
	SerialNumber       string           `gorm:"size:255" json:"serialNumber"`
	WeightOz           *decimal.Decimal `json:"weightOz,omitempty"`
	Dimensions         string           `gorm:"size:100" json:"dimensions"`
	Color              string           `gorm:"size:50" json:"color"`
	Material           string           `gorm:"size:100" json:"material"`
	StorageLocation    string           `gorm:"size:255" json:"storageLocation"`
	WarrantyExpiration *time.Time       `json:"warrantyExpiration,omitempty"`
	LastMaintenance    *time.Time       `json:"lastMaintenance,omitempty"`
	PurchaseDate       *time.Time       `json:"purchaseDate,omitempty"`
	PurchasePrice      *decimal.Decimal `json:"purchasePrice,omitempty"`
	Specifications     *string          `gorm:"type:text" json:"specifications,omitempty"` // JSON object for category-specific specs
	Status             string           `gorm:"size:50;default:'active'" json:"status"`
	Notes              string           `gorm:"type:text" json:"notes,omitempty"`
	Pictures           *string          `gorm:"type:text" json:"pictures,omitempty"` // Storing as JSON array of strings
}
