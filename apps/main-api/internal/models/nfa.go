package models

import (
	"time"

	"gorm.io/gorm"
)

// NFA represents an NFA item owned by a user
type NFA struct {
	gorm.Model
	UserID                  uint       `gorm:"not null;index" json:"-"`
	User                    User       `gorm:"foreignKey:UserID" json:"-"`
	Manufacturer            string     `gorm:"size:255;not null" json:"manufacturer"`
	ModelName               string     `gorm:"size:255;not null" json:"model_name"`
	Caliber                 string     `gorm:"size:100;not null" json:"caliber"`
	Type                    string     `gorm:"size:100;not null" json:"type"`
	Value                   *float64   `json:"value,omitempty"`
	RoundCount              *int       `json:"round_count,omitempty"`
	TaxStampType            string     `gorm:"size:100;not null" json:"tax_stamp_type"`
	TaxStampSubmissionDate  *time.Time `json:"tax_stamp_submission_date,omitempty"`
	TaxStampApprovalDate    *time.Time `json:"tax_stamp_approval_date,omitempty"`
	TaxStampIDNumber        string     `gorm:"size:100;not null;uniqueIndex" json:"tax_stamp_id_number"`
	Picture                 *string    `gorm:"type:text" json:"picture,omitempty"`
}
