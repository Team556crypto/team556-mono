package models

import (
    "time"

    "gorm.io/datatypes"
)

// NotificationSettings stores per-user notification preferences
// One row per user (unique on user_id)
type NotificationSettings struct {
    ID                       uint           `gorm:"primarykey" json:"id"`
    CreatedAt                time.Time      `json:"created_at"`
    UpdatedAt                time.Time      `json:"updated_at"`

    UserID                   uint           `gorm:"uniqueIndex;not null" json:"user_id"`

    EmailEnabled             bool           `gorm:"default:true" json:"email_enabled"`
    PushEnabled              bool           `gorm:"default:false" json:"push_enabled"`

    // Types is a JSON array of strings: ["transaction","alerts","security","marketing"]
    Types                    datatypes.JSON `json:"types"`

    ContactEmail             *string        `json:"contact_email,omitempty"`

    DailySummaryEnabled      bool           `gorm:"default:false" json:"daily_summary_enabled"`
    TransactionAlertsEnabled bool           `gorm:"default:false" json:"transaction_alerts_enabled"`
    MarketingOptIn           bool           `gorm:"default:false" json:"marketing_opt_in"`
}