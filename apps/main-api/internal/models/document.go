package models

import (
	"time"

	"gorm.io/gorm"
)

// Document represents a document owned by a user
type Document struct {
	ID                uint           `gorm:"primarykey" json:"id"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	UserID            uint           `gorm:"not null;index" json:"user_id"`
	User              User           `gorm:"foreignKey:UserID" json:"-"`
	Name              string         `gorm:"size:255;not null" json:"name"`
	Type              string         `gorm:"size:100" json:"type"`
	IssuingAuthority  string         `gorm:"size:255" json:"issuing_authority,omitempty"`
	IssueDate         *time.Time     `json:"issue_date,omitempty"`
	ExpirationDate    *time.Time     `json:"expiration_date,omitempty"`
	DocumentNumber    string         `gorm:"size:255" json:"document_number,omitempty"`
	Notes             string         `gorm:"type:text" json:"notes,omitempty"`
	Attachments       *string        `gorm:"type:text" json:"attachments,omitempty"` // Storing as JSON array of strings
}
