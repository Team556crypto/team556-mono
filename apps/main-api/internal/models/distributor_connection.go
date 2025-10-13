package models

import (
    "time"

    "gorm.io/datatypes"
)

// DistributorConnection stores a merchant's connection to a distributor (credentials are encrypted at rest)
// Unique per (user_id, distributor_code)
type DistributorConnection struct {
    ID                   uint           `gorm:"primarykey" json:"id"`
    CreatedAt            time.Time      `json:"created_at"`
    UpdatedAt            time.Time      `json:"updated_at"`

    UserID               uint           `gorm:"index;not null" json:"user_id"`
    DistributorCode      string         `gorm:"index;not null" json:"distributor_code"`

    // EncryptedCredentials stores a base64 string returned by crypto.EncryptAESGCM
    EncryptedCredentials string         `gorm:"type:text;not null" json:"-"`

    Status               string         `gorm:"type:varchar(32);default:'disconnected'" json:"status"`
    LastSyncAt           *time.Time     `json:"last_sync_at,omitempty"`

    Meta                 datatypes.JSON `json:"meta,omitempty"`
}

// TableName explicit table name
func (DistributorConnection) TableName() string { return "distributor_connections" }