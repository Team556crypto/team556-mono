package models

import "time"

// PushDevice stores a user's push notification device token
// Unique per (user_id, token)
type PushDevice struct {
    ID         uint      `gorm:"primarykey" json:"id"`
    CreatedAt  time.Time `json:"created_at"`
    UpdatedAt  time.Time `json:"updated_at"`

    UserID     uint      `gorm:"index;not null" json:"user_id"`
    Token      string    `gorm:"not null;index:idx_user_token,unique" json:"token"`
    Platform   string    `gorm:"type:varchar(16);not null" json:"platform"` // ios | android | web
    LastSeenAt time.Time `json:"last_seen_at"`
    Active     bool      `gorm:"default:true" json:"active"`
}