package handlers

import (
	"fmt"
	"log"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"github.com/team556-mono/server/internal/models"
	"github.com/team556-mono/server/internal/utils"
)

// ReferralHandler holds dependencies for referral-related handlers
type ReferralHandler struct {
	DB       *gorm.DB
	Validate *validator.Validate
}

// NewReferralHandler creates a new ReferralHandler
func NewReferralHandler(db *gorm.DB) *ReferralHandler {
	return &ReferralHandler{
		DB:       db,
		Validate: validator.New(),
	}
}

// --- Request/Response Structures ---

// GenerateReferralCodeResponse defines the response for generating a referral code
type GenerateReferralCodeResponse struct {
	ReferralCode string    `json:"referral_code"`
	GeneratedAt  time.Time `json:"generated_at"`
	ShareURL     string    `json:"share_url"`
	Message      string    `json:"message"`
}

// ValidateReferralCodeRequest defines the request for validating a referral code
type ValidateReferralCodeRequest struct {
	ReferralCode string `json:"referral_code" validate:"required,min=4,max=12"`
}

// ValidateReferralCodeResponse defines the response for validating a referral code
type ValidateReferralCodeResponse struct {
	Valid         bool   `json:"valid"`
	ReferrerName  string `json:"referrer_name,omitempty"`
	Message       string `json:"message"`
	ReferrerID    *uint  `json:"referrer_id,omitempty"` // Internal use only
}

// GetReferralStatsResponse defines the response for referral statistics
type GetReferralStatsResponse struct {
	UserID                   uint       `json:"user_id"`
	ReferralCode             *string    `json:"referral_code"`
	TotalReferrals           int        `json:"total_referrals"`
	VerifiedReferrals        int        `json:"verified_referrals"`
	WalletCreatedReferrals   int        `json:"wallet_created_referrals"`
	Team556HoldingReferrals  int        `json:"team556_holding_referrals"`
	ConversionRateToVerified float64    `json:"conversion_rate_to_verified"`
	ConversionRateToWallet   float64    `json:"conversion_rate_to_wallet"`
	ConversionRateToTeam556  float64    `json:"conversion_rate_to_team556"`
	TotalTeam556Volume       float64    `json:"total_team556_volume"`
	AverageBalance           float64    `json:"average_balance"`
	FirstReferralAt          *time.Time `json:"first_referral_at,omitempty"`
	MostRecentReferralAt     *time.Time `json:"most_recent_referral_at,omitempty"`
	LastCalculatedAt         time.Time  `json:"last_calculated_at"`
}

// GetReferralHistoryResponse defines the response for referral history
type GetReferralHistoryResponse struct {
	Referrals []ReferralHistoryItem `json:"referrals"`
	Total     int                   `json:"total"`
	Page      int                   `json:"page"`
	PageSize  int                   `json:"page_size"`
}

// ReferralHistoryItem represents a single referral in the history
type ReferralHistoryItem struct {
	ID                       uint       `json:"id"`
	ReferredUserCode         string     `json:"referred_user_code"` // Using user_code for privacy
	SignupDate               time.Time  `json:"signup_date"`
	EmailVerified            bool       `json:"email_verified"`
	EmailVerifiedAt          *time.Time `json:"email_verified_at,omitempty"`
	WalletCreated            bool       `json:"wallet_created"`
	WalletCreatedAt          *time.Time `json:"wallet_created_at,omitempty"`
	HasTeam556               bool       `json:"has_team556"`
	Team556Balance           float64    `json:"team556_balance"`
	FirstTeam556DetectedAt   *time.Time `json:"first_team556_detected_at,omitempty"`
	ConversionSource         *string    `json:"conversion_source,omitempty"`
}

// --- Handler Functions ---

// GenerateReferralCode generates or returns existing referral code for a user
func (h *ReferralHandler) GenerateReferralCode(c *fiber.Ctx) error {
	// Get user ID from auth middleware
	userIDInterface := c.Locals("userID")
	if userIDInterface == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: User ID not found in context"})
	}

	userID, ok := userIDInterface.(uint)
	if !ok {
		log.Printf("Error: Invalid user ID type in context: %T", userIDInterface)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Internal server error: Invalid user ID type"})
	}

	// Get user from database
	var user models.User
	err := h.DB.Where("id = ?", userID).First(&user).Error
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
	}

	// Check if user already has a referral code
	if user.ReferralCode != nil && *user.ReferralCode != "" {
		shareURL := fmt.Sprintf("https://app.team556.com/signup?ref=%s", *user.ReferralCode)
		return c.JSON(GenerateReferralCodeResponse{
			ReferralCode: *user.ReferralCode,
			GeneratedAt:  *user.ReferralCodeGeneratedAt,
			ShareURL:     shareURL,
			Message:      "Existing referral code retrieved",
		})
	}

	// Generate new unique referral code
	referralCode, err := utils.GenerateUniqueReferralCode(h.DB, 8, 10) // 8 chars, max 10 attempts
	if err != nil {
		log.Printf("Error generating unique referral code for user %d: %v", userID, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate referral code"})
	}

	// Update user with referral code
	now := time.Now()
	err = h.DB.Model(&user).Updates(map[string]interface{}{
		"referral_code":             referralCode,
		"referral_code_generated_at": now,
	}).Error
	if err != nil {
		log.Printf("Error saving referral code for user %d: %v", userID, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save referral code"})
	}

	// Create share URL
	shareURL := fmt.Sprintf("https://app.team556.com/signup?ref=%s", referralCode)

	return c.JSON(GenerateReferralCodeResponse{
		ReferralCode: referralCode,
		GeneratedAt:  now,
		ShareURL:     shareURL,
		Message:      "Referral code generated successfully",
	})
}

// ValidateReferralCode validates if a referral code is valid and active
func (h *ReferralHandler) ValidateReferralCode(c *fiber.Ctx) error {
	var req ValidateReferralCodeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Validate request
	if err := h.Validate.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"details": formatValidationErrors(err.(validator.ValidationErrors)),
		})
	}

	// Validate the referral code
	status, err := utils.ValidateReferralCode(h.DB, req.ReferralCode)
	if err != nil {
		log.Printf("Error validating referral code %s: %v", req.ReferralCode, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to validate referral code"})
	}

	response := ValidateReferralCodeResponse{
		Valid:   status.Valid,
		Message: status.Message,
	}

	if status.Valid && status.ReferrerID != nil {
		response.ReferrerName = status.ReferrerName
		// Don't expose ReferrerID in public response for security
	}

	return c.JSON(response)
}

// GetReferralStats returns referral statistics for the authenticated user
func (h *ReferralHandler) GetReferralStats(c *fiber.Ctx) error {
	// Get user ID from auth middleware
	userIDInterface := c.Locals("userID")
	if userIDInterface == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: User ID not found in context"})
	}

	userID, ok := userIDInterface.(uint)
	if !ok {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Internal server error: Invalid user ID type"})
	}

	// Get user with referral code
	var user models.User
	err := h.DB.Where("id = ?", userID).First(&user).Error
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
	}

	// Get or create referral stats
	var stats models.ReferralStats
	err = h.DB.Where("user_id = ?", userID).First(&stats).Error
	if err == gorm.ErrRecordNotFound {
		// Create default stats record
		stats = models.ReferralStats{
			UserID:           userID,
			LastCalculatedAt: time.Now(),
		}
		if err := h.DB.Create(&stats).Error; err != nil {
			log.Printf("Error creating referral stats for user %d: %v", userID, err)
		}
	} else if err != nil {
		log.Printf("Error fetching referral stats for user %d: %v", userID, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch referral statistics"})
	}

	// If stats are older than 1 hour, update them asynchronously
	if time.Since(stats.LastCalculatedAt) > time.Hour {
		go func() {
			if err := utils.UpdateReferrerStats(h.DB, userID); err != nil {
				log.Printf("Warning: failed to update referrer stats for user %d: %v", userID, err)
			}
		}()
	}

	response := GetReferralStatsResponse{
		UserID:                   userID,
		ReferralCode:             user.ReferralCode,
		TotalReferrals:           stats.TotalReferrals,
		VerifiedReferrals:        stats.VerifiedReferrals,
		WalletCreatedReferrals:   stats.WalletCreatedReferrals,
		Team556HoldingReferrals:  stats.Team556HoldingReferrals,
		ConversionRateToVerified: stats.ConversionRateToVerified,
		ConversionRateToWallet:   stats.ConversionRateToWallet,
		ConversionRateToTeam556:  stats.ConversionRateToTeam556,
		TotalTeam556Volume:       stats.TotalTeam556VolumeReferred,
		AverageBalance:           stats.AverageTeam556BalanceReferred,
		FirstReferralAt:          stats.FirstReferralAt,
		MostRecentReferralAt:     stats.MostRecentReferralAt,
		LastCalculatedAt:         stats.LastCalculatedAt,
	}

	return c.JSON(response)
}

// GetReferralHistory returns paginated history of referred users
func (h *ReferralHandler) GetReferralHistory(c *fiber.Ctx) error {
	// Get user ID from auth middleware
	userIDInterface := c.Locals("userID")
	if userIDInterface == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: User ID not found in context"})
	}

	userID, ok := userIDInterface.(uint)
	if !ok {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Internal server error: Invalid user ID type"})
	}

	// Parse pagination parameters
	page := c.QueryInt("page", 1)
	if page < 1 {
		page = 1
	}
	pageSize := c.QueryInt("page_size", 20)
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize

	// Get referrals with referred user information
	var referrals []models.Referral
	err := h.DB.Preload("ReferredUser").
		Where("referrer_user_id = ?", userID).
		Order("created_at DESC").
		Limit(pageSize).
		Offset(offset).
		Find(&referrals).Error
	if err != nil {
		log.Printf("Error fetching referral history for user %d: %v", userID, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch referral history"})
	}

	// Get total count
	var totalCount int64
	err = h.DB.Model(&models.Referral{}).Where("referrer_user_id = ?", userID).Count(&totalCount).Error
	if err != nil {
		log.Printf("Error counting referrals for user %d: %v", userID, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to count referrals"})
	}

	// Build response
	historyItems := make([]ReferralHistoryItem, len(referrals))
	for i, referral := range referrals {
		historyItems[i] = ReferralHistoryItem{
			ID:                       referral.ID,
			ReferredUserCode:         referral.ReferredUser.UserCode,
			SignupDate:               referral.CreatedAt,
			EmailVerified:            referral.EmailVerifiedAt != nil,
			EmailVerifiedAt:          referral.EmailVerifiedAt,
			WalletCreated:            referral.WalletCreatedAt != nil,
			WalletCreatedAt:          referral.WalletCreatedAt,
			HasTeam556:               referral.CurrentTeam556Balance > 0,
			Team556Balance:           referral.CurrentTeam556Balance,
			FirstTeam556DetectedAt:   referral.FirstTeam556BalanceDetectedAt,
			ConversionSource:         referral.ConversionSource,
		}
	}

	response := GetReferralHistoryResponse{
		Referrals: historyItems,
		Total:     int(totalCount),
		Page:      page,
		PageSize:  pageSize,
	}

	return c.JSON(response)
}

// RegenerateReferralCode generates a new referral code for a user (invalidates the old one)
func (h *ReferralHandler) RegenerateReferralCode(c *fiber.Ctx) error {
	// Get user ID from auth middleware
	userIDInterface := c.Locals("userID")
	if userIDInterface == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: User ID not found in context"})
	}

	userID, ok := userIDInterface.(uint)
	if !ok {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Internal server error: Invalid user ID type"})
	}

	// Check if user exists
	var user models.User
	err := h.DB.Where("id = ?", userID).First(&user).Error
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
	}

	// Generate new unique referral code
	referralCode, err := utils.GenerateUniqueReferralCode(h.DB, 8, 10)
	if err != nil {
		log.Printf("Error regenerating referral code for user %d: %v", userID, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to regenerate referral code"})
	}

	// Update user with new referral code
	now := time.Now()
	err = h.DB.Model(&user).Updates(map[string]interface{}{
		"referral_code":             referralCode,
		"referral_code_generated_at": now,
	}).Error
	if err != nil {
		log.Printf("Error saving new referral code for user %d: %v", userID, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save new referral code"})
	}

	shareURL := fmt.Sprintf("https://app.team556.com/signup?ref=%s", referralCode)

	return c.JSON(GenerateReferralCodeResponse{
		ReferralCode: referralCode,
		GeneratedAt:  now,
		ShareURL:     shareURL,
		Message:      "Referral code regenerated successfully",
	})
}

