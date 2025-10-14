package models

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// MfaRecoveryCode stores hashed one-time recovery codes for MFA.
// Only the hash is stored. Codes are displayed to the user once at creation time.
type MfaRecoveryCode struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID   uint   `gorm:"not null;index" json:"user_id"`
	User     User   `gorm:"foreignKey:UserID" json:"-"`
	CodeHash string `gorm:"not null" json:"-"` // e.g., bcrypt hash
	UsedAt   *time.Time `json:"used_at,omitempty"`
}

// UserSession represents an authenticated session/device for a user.
// If JWTs are stateless, this can be populated on login and pruned on logout/expiry.
type UserSession struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID uint  `gorm:"not null;index" json:"user_id"`
	User   User  `gorm:"foreignKey:UserID" json:"-"`

	IP        string     `gorm:"size:64" json:"ip"`
	UserAgent string     `gorm:"size:512" json:"user_agent"`
	Location  *string    `gorm:"size:128" json:"location,omitempty"`
	LastSeenAt *time.Time `json:"last_seen_at,omitempty"`
	IsRevoked bool       `gorm:"default:false" json:"is_revoked"`
	// Optional: identifier for the token to associate with this session (jti)
	TokenID *string `gorm:"index;size:64" json:"token_id,omitempty"`
}

// LoginActivity records login attempts (success/fail) for auditing and UI display.
type LoginActivity struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"` // Timestamp of the event
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID uint  `gorm:"not null;index" json:"user_id"`
	User   User  `gorm:"foreignKey:UserID" json:"-"`

	Status   string  `gorm:"type:varchar(32);index" json:"status"` // "successful_login" | "failed_login"
	IP       string  `gorm:"size:64" json:"ip"`
	UserAgent string `gorm:"size:512" json:"user_agent"`
	Location *string `gorm:"size:128" json:"location,omitempty"`
}

// SecurityAuditLog captures sensitive actions (password change, MFA toggles, session revoke).
type SecurityAuditLog struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID uint  `gorm:"not null;index" json:"user_id"`
	User   User  `gorm:"foreignKey:UserID" json:"-"`
	Action string `gorm:"type:varchar(64);index" json:"action"`
	IP     *string `gorm:"size:64" json:"ip,omitempty"`
	Meta   datatypes.JSON `json:"meta,omitempty"`
}
