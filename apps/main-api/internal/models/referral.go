package models

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// Referral represents a referral relationship between two users
type Referral struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Core referral relationship
	ReferrerUserID   uint   `json:"referrer_user_id" gorm:"not null;index"`
	ReferredUserID   uint   `json:"referred_user_id" gorm:"not null;uniqueIndex"` // One referral per referred user
	ReferralCodeUsed string `json:"referral_code_used" gorm:"not null;index;size:12"`

	// Referral progression tracking
	EmailVerifiedAt              *time.Time `json:"email_verified_at,omitempty" gorm:"index"`
	WalletCreatedAt              *time.Time `json:"wallet_created_at,omitempty" gorm:"index"`
	FirstTeam556BalanceDetectedAt *time.Time `json:"first_team556_balance_detected_at,omitempty" gorm:"index"`
	FirstTeam556PurchaseAmount   *float64   `json:"first_team556_purchase_amount,omitempty" gorm:"type:numeric(20,9)"`
	CurrentTeam556Balance        float64    `json:"current_team556_balance" gorm:"type:numeric(20,9);default:0"`
	LastBalanceCheckAt           *time.Time `json:"last_balance_check_at,omitempty"`

	// Additional metadata
	SignupIP         *string `json:"signup_ip,omitempty" gorm:"size:64"`
	ConversionSource *string `json:"conversion_source,omitempty" gorm:"size:64"` // e.g., 'mobile_app', 'web', 'social_share'

	// Relationships
	Referrer     User               `json:"referrer,omitempty" gorm:"foreignKey:ReferrerUserID"`
	ReferredUser User               `json:"referred_user,omitempty" gorm:"foreignKey:ReferredUserID"`
	Events       []ReferralEvent    `json:"events,omitempty" gorm:"foreignKey:ReferralID"`
}

// ReferralStats represents cached statistics for a user's referral performance
type ReferralStats struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	UserID uint `json:"user_id" gorm:"not null;uniqueIndex"` // One stats record per user

	// Basic referral counts
	TotalReferrals            int `json:"total_referrals" gorm:"default:0"`
	VerifiedReferrals         int `json:"verified_referrals" gorm:"default:0"`
	WalletCreatedReferrals    int `json:"wallet_created_referrals" gorm:"default:0"`
	Team556HoldingReferrals   int `json:"team556_holding_referrals" gorm:"default:0;index"`

	// Financial metrics
	TotalTeam556VolumeReferred   float64 `json:"total_team556_volume_referred" gorm:"type:numeric(20,9);default:0"`
	AverageTeam556BalanceReferred float64 `json:"average_team556_balance_referred" gorm:"type:numeric(20,9);default:0"`

	// Performance metrics (stored as decimals, e.g., 0.8500 = 85%)
	ConversionRateToVerified float64 `json:"conversion_rate_to_verified" gorm:"type:numeric(5,4);default:0"`
	ConversionRateToWallet   float64 `json:"conversion_rate_to_wallet" gorm:"type:numeric(5,4);default:0"`
	ConversionRateToTeam556  float64 `json:"conversion_rate_to_team556" gorm:"type:numeric(5,4);default:0"`

	// Timestamps
	LastCalculatedAt      time.Time  `json:"last_calculated_at" gorm:"default:CURRENT_TIMESTAMP"`
	FirstReferralAt       *time.Time `json:"first_referral_at,omitempty"`
	MostRecentReferralAt  *time.Time `json:"most_recent_referral_at,omitempty"`

	// Relationships
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// ReferralEvent represents individual events in the referral progression
type ReferralEvent struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	CreatedAt time.Time `json:"created_at"`

	ReferralID uint   `json:"referral_id" gorm:"not null;index"`
	EventType  string `json:"event_type" gorm:"not null;index;size:32"` // 'signup', 'email_verified', 'wallet_created', 'first_team556', 'balance_updated'

	// Event-specific data
	PreviousValue *float64 `json:"previous_value,omitempty" gorm:"type:numeric(20,9)"` // For balance updates
	NewValue      *float64 `json:"new_value,omitempty" gorm:"type:numeric(20,9)"`      // For balance updates
	Metadata      datatypes.JSON `json:"metadata" gorm:"default:'{}'"`

	// External system references
	TransactionSignature *string `json:"transaction_signature,omitempty" gorm:"size:88"` // Solana transaction signature
	BlockSlot            *int64  `json:"block_slot,omitempty"`                           // Solana block slot

	// Relationships
	Referral Referral `json:"referral,omitempty" gorm:"foreignKey:ReferralID"`
}

// ReferralCodeStatus represents the status of a referral code lookup
type ReferralCodeStatus struct {
	Valid         bool   `json:"valid"`
	ReferrerID    *uint  `json:"referrer_id,omitempty"`
	ReferrerName  string `json:"referrer_name,omitempty"`
	ReferrerEmail string `json:"referrer_email,omitempty"`
	Message       string `json:"message"`
}

// ReferralSummary provides a high-level overview of referral performance
type ReferralSummary struct {
	UserID                    uint    `json:"user_id"`
	ReferralCode              string  `json:"referral_code"`
	TotalReferrals            int     `json:"total_referrals"`
	VerifiedReferrals         int     `json:"verified_referrals"`
	WalletCreatedReferrals    int     `json:"wallet_created_referrals"`
	Team556HoldingReferrals   int     `json:"team556_holding_referrals"`
	ConversionRateToVerified  float64 `json:"conversion_rate_to_verified"`
	ConversionRateToWallet    float64 `json:"conversion_rate_to_wallet"`
	ConversionRateToTeam556   float64 `json:"conversion_rate_to_team556"`
	TotalTeam556Volume        float64 `json:"total_team556_volume"`
	FirstReferralAt           *time.Time `json:"first_referral_at,omitempty"`
	MostRecentReferralAt      *time.Time `json:"most_recent_referral_at,omitempty"`
}

// ReferralLeaderboard represents a user's position in referral rankings
type ReferralLeaderboard struct {
	Rank                    int     `json:"rank"`
	UserID                  uint    `json:"user_id"`
	UserCode                string  `json:"user_code"` // Using existing user_code field for privacy
	TotalReferrals          int     `json:"total_referrals"`
	Team556HoldingReferrals int     `json:"team556_holding_referrals"`
	ConversionRate          float64 `json:"conversion_rate"`
}