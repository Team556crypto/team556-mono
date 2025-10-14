package utils

import (
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"

	"gorm.io/gorm"
	"github.com/team556-mono/server/internal/models"
)

// Character set for referral code generation - excluding confusing characters
const referralCodeChars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789" // Excluded: O, 0 for clarity

// GenerateReferralCode creates a unique referral code for a user
func GenerateReferralCode(length int) (string, error) {
	if length <= 0 || length > 20 {
		return "", errors.New("referral code length must be between 1 and 20")
	}

	var builder strings.Builder
	charSetLen := big.NewInt(int64(len(referralCodeChars)))
	
	for i := 0; i < length; i++ {
		randomIndex, err := rand.Int(rand.Reader, charSetLen)
		if err != nil {
			return "", fmt.Errorf("failed to generate random index for referral code: %w", err)
		}
		builder.WriteByte(referralCodeChars[randomIndex.Int64()])
	}
	
	return builder.String(), nil
}

// GenerateUniqueReferralCode generates a unique referral code that doesn't exist in the database
func GenerateUniqueReferralCode(db *gorm.DB, length int, maxAttempts int) (string, error) {
	for attempt := 0; attempt < maxAttempts; attempt++ {
		code, err := GenerateReferralCode(length)
		if err != nil {
			return "", err
		}

		// Check if code already exists
		var existingUser models.User
		err = db.Where("referral_code = ?", code).First(&existingUser).Error
		if err == gorm.ErrRecordNotFound {
			// Code is unique
			return code, nil
		} else if err != nil {
			// Database error
			return "", fmt.Errorf("failed to check referral code uniqueness: %w", err)
		}
		// Code exists, try again
	}

	return "", fmt.Errorf("failed to generate unique referral code after %d attempts", maxAttempts)
}

// ValidateReferralCode checks if a referral code is valid and returns the referrer information
func ValidateReferralCode(db *gorm.DB, code string) (*models.ReferralCodeStatus, error) {
	if code == "" {
		return &models.ReferralCodeStatus{
			Valid:   false,
			Message: "Referral code cannot be empty",
		}, nil
	}

	// Normalize code to uppercase
	code = strings.ToUpper(strings.TrimSpace(code))

	var referrer models.User
	err := db.Where("referral_code = ?", code).First(&referrer).Error
	
	if err == gorm.ErrRecordNotFound {
		return &models.ReferralCodeStatus{
			Valid:   false,
			Message: "Invalid referral code",
		}, nil
	} else if err != nil {
		return nil, fmt.Errorf("failed to validate referral code: %w", err)
	}

	// Check if referrer account is verified
	if !referrer.EmailVerified {
		return &models.ReferralCodeStatus{
			Valid:   false,
			Message: "Referrer account is not verified",
		}, nil
	}

	return &models.ReferralCodeStatus{
		Valid:         true,
		ReferrerID:    &referrer.ID,
		ReferrerName:  fmt.Sprintf("%s %s", referrer.FirstName, referrer.LastName),
		ReferrerEmail: referrer.Email, // Consider if you want to expose this
		Message:       "Valid referral code",
	}, nil
}

// CreateReferralRecord creates a new referral relationship
func CreateReferralRecord(db *gorm.DB, referrerID, referredUserID uint, referralCode, signupIP, conversionSource string) (*models.Referral, error) {
	now := time.Now()
	
	referral := &models.Referral{
		ReferrerUserID:   referrerID,
		ReferredUserID:   referredUserID,
		ReferralCodeUsed: referralCode,
		SignupIP:         &signupIP,
		ConversionSource: &conversionSource,
	}

	// Create referral record
	if err := db.Create(referral).Error; err != nil {
		return nil, fmt.Errorf("failed to create referral record: %w", err)
	}

	// Update referred user with referral information
	err := db.Model(&models.User{}).Where("id = ?", referredUserID).Updates(map[string]interface{}{
		"referred_by_user_id": referrerID,
		"referred_at":         now,
	}).Error
	if err != nil {
		return nil, fmt.Errorf("failed to update referred user: %w", err)
	}

	// Log the signup event
	metadataMap := map[string]interface{}{
		"signup_ip":         signupIP,
		"conversion_source": conversionSource,
	}
	metadataJSON, _ := json.Marshal(metadataMap)
	event := &models.ReferralEvent{
		ReferralID: referral.ID,
		EventType:  "signup",
		Metadata:   metadataJSON,
	}
	
	if err := db.Create(event).Error; err != nil {
		// Log error but don't fail the referral creation
		fmt.Printf("Warning: failed to create referral signup event: %v", err)
	}

	// Update referrer stats (or queue for async update)
	go func() {
		if err := UpdateReferrerStats(db, referrerID); err != nil {
			fmt.Printf("Warning: failed to update referrer stats: %v", err)
		}
	}()

	return referral, nil
}

// LogReferralEvent logs a significant event in the referral progression
func LogReferralEvent(db *gorm.DB, referredUserID uint, eventType string, metadata map[string]interface{}) error {
	// Find the referral record for this user
	var referral models.Referral
	err := db.Where("referred_user_id = ?", referredUserID).First(&referral).Error
	if err == gorm.ErrRecordNotFound {
		// User was not referred, nothing to log
		return nil
	} else if err != nil {
		return fmt.Errorf("failed to find referral record: %w", err)
	}

	// Update the referral record with event timestamp
	updates := make(map[string]interface{})
	now := time.Now()
	
	switch eventType {
	case "email_verified":
		updates["email_verified_at"] = now
	case "wallet_created":
		updates["wallet_created_at"] = now
	case "first_team556":
		updates["first_team556_balance_detected_at"] = now
		if amount, ok := metadata["amount"].(float64); ok {
			updates["first_team556_purchase_amount"] = amount
		}
	case "balance_updated":
		if balance, ok := metadata["new_balance"].(float64); ok {
			updates["current_team556_balance"] = balance
		}
		updates["last_balance_check_at"] = now
	}

	if len(updates) > 0 {
		err = db.Model(&referral).Where("id = ?", referral.ID).Updates(updates).Error
		if err != nil {
			return fmt.Errorf("failed to update referral record: %w", err)
		}
	}

	// Create event log
	metadataJSON, _ := json.Marshal(metadata)
	event := &models.ReferralEvent{
		ReferralID: referral.ID,
		EventType:  eventType,
		Metadata:   metadataJSON,
	}

	if err := db.Create(event).Error; err != nil {
		return fmt.Errorf("failed to create referral event: %w", err)
	}

	// Update stats asynchronously
	go func() {
		if err := UpdateReferrerStats(db, referral.ReferrerUserID); err != nil {
			fmt.Printf("Warning: failed to update referrer stats after event: %v", err)
		}
	}()

	return nil
}

// UpdateReferrerStats recalculates and updates referral statistics for a user
func UpdateReferrerStats(db *gorm.DB, referrerUserID uint) error {
	// Get all referrals for this user
	var referrals []models.Referral
	err := db.Where("referrer_user_id = ?", referrerUserID).Find(&referrals).Error
	if err != nil {
		return fmt.Errorf("failed to fetch referrals: %w", err)
	}

	if len(referrals) == 0 {
		// No referrals, ensure stats record exists with zeros
		stats := &models.ReferralStats{
			UserID:           referrerUserID,
			LastCalculatedAt: time.Now(),
		}
		
		return db.Save(stats).Error
	}

	// Calculate statistics
	var (
		totalReferrals            = len(referrals)
		verifiedReferrals         = 0
		walletCreatedReferrals    = 0
		team556HoldingReferrals   = 0
		totalTeam556Volume        = 0.0
		firstReferralAt           *time.Time
		mostRecentReferralAt      *time.Time
	)

	for i, referral := range referrals {
		// Set first and most recent referral timestamps
		if i == 0 || (firstReferralAt != nil && referral.CreatedAt.Before(*firstReferralAt)) {
			firstReferralAt = &referral.CreatedAt
		}
		if i == 0 || (mostRecentReferralAt != nil && referral.CreatedAt.After(*mostRecentReferralAt)) {
			mostRecentReferralAt = &referral.CreatedAt
		}

		// Count progression milestones
		if referral.EmailVerifiedAt != nil {
			verifiedReferrals++
		}
		if referral.WalletCreatedAt != nil {
			walletCreatedReferrals++
		}
		if referral.CurrentTeam556Balance > 0 {
			team556HoldingReferrals++
			totalTeam556Volume += referral.CurrentTeam556Balance
		}
	}

	// Calculate conversion rates
	var (
		conversionRateToVerified = 0.0
		conversionRateToWallet   = 0.0
		conversionRateToTeam556  = 0.0
		averageBalance          = 0.0
	)

	if totalReferrals > 0 {
		conversionRateToVerified = float64(verifiedReferrals) / float64(totalReferrals)
		conversionRateToWallet = float64(walletCreatedReferrals) / float64(totalReferrals)
		conversionRateToTeam556 = float64(team556HoldingReferrals) / float64(totalReferrals)
	}

	if team556HoldingReferrals > 0 {
		averageBalance = totalTeam556Volume / float64(team556HoldingReferrals)
	}

	// Update or create stats record
	stats := &models.ReferralStats{
		UserID:                        referrerUserID,
		TotalReferrals:                totalReferrals,
		VerifiedReferrals:             verifiedReferrals,
		WalletCreatedReferrals:        walletCreatedReferrals,
		Team556HoldingReferrals:       team556HoldingReferrals,
		TotalTeam556VolumeReferred:    totalTeam556Volume,
		AverageTeam556BalanceReferred: averageBalance,
		ConversionRateToVerified:      conversionRateToVerified,
		ConversionRateToWallet:        conversionRateToWallet,
		ConversionRateToTeam556:       conversionRateToTeam556,
		LastCalculatedAt:              time.Now(),
		FirstReferralAt:               firstReferralAt,
		MostRecentReferralAt:          mostRecentReferralAt,
	}

	// Use Upsert functionality
	return db.Save(stats).Error
}