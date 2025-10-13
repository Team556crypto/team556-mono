package handlers

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/team556-mono/server/internal/models"
	"github.com/team556-mono/server/internal/utils"
	"gorm.io/gorm"
)

// POSWalletAddressesResponse represents the user's configured wallet addresses
type POSWalletAddressesResponse struct {
	PrimaryAddress   string  `json:"primary_address"`
	SecondaryAddress *string `json:"secondary_address"`
	HasPrimary       bool    `json:"has_primary"`
	HasSecondary     bool    `json:"has_secondary"`
}

// UpdateWalletAddressRequest represents the request to update a wallet address
type UpdateWalletAddressRequest struct {
	Address string `json:"address" validate:"required,min=32,max=44"`
}

// ValidateAddressRequest represents the request to validate a wallet address
type ValidateAddressRequest struct {
	Address string `json:"address" validate:"required,min=1,max=50"`
}

// ValidateAddressResponse represents the validation result
type ValidateAddressResponse struct {
	IsValid bool   `json:"is_valid"`
	Message string `json:"message"`
}

// ClearSecondaryAddressRequest represents the request to clear secondary address
type ClearSecondaryAddressRequest struct {
	Clear bool `json:"clear"`
}

// UpdateWalletAddressResponse represents the response after updating a wallet address
type UpdateWalletAddressResponse struct {
	Message string  `json:"message"`
	Address string  `json:"address"`
	Updated bool    `json:"updated"`
}

// ErrorResponse represents a standard error response
type ErrorResponse struct {
	Error   string                 `json:"error"`
	Code    int                    `json:"code,omitempty"`
	Details map[string]interface{} `json:"details,omitempty"`
}

// HealthCheckResponse represents the response for address configuration health
type HealthCheckResponse struct {
	HasPrimary         bool   `json:"has_primary"`
	HasSecondary       bool   `json:"has_secondary"`
	PrimaryValid       bool   `json:"primary_valid"`
	SecondaryValid     bool   `json:"secondary_valid"`
	ReadyForPayments   bool   `json:"ready_for_payments"`
	Recommendation     string `json:"recommendation,omitempty"`
}

// validateWalletAddress performs comprehensive wallet address validation for HTTP handlers
func validateWalletAddress(address string) error {
	if err := utils.ValidateWalletAddress(address); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return nil
}

// GetPOSWalletAddressesHandler returns the user's configured POS wallet addresses
func GetPOSWalletAddressesHandler(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get authenticated user ID from context
		userIDInterface := c.Locals("userID")
		if userIDInterface == nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Unauthorized: User ID not found in context",
			})
		}

		userID, ok := userIDInterface.(uint)
		if !ok {
			log.Printf("Error: Invalid user ID type in context: %T", userIDInterface)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Internal server error: Invalid user ID type",
			})
		}

		// Fetch user from database
		var user models.User
		result := db.Where("id = ?", userID).First(&user)
		if result.Error != nil {
			if result.Error == gorm.ErrRecordNotFound {
				return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
					"error": "User not found",
				})
			}
			log.Printf("Error fetching user %d: %v", userID, result.Error)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to fetch user information",
			})
		}

		// Prepare response
		response := POSWalletAddressesResponse{
			PrimaryAddress:   user.PrimaryWalletAddress,
			SecondaryAddress: user.SecondaryWalletAddress,
			HasPrimary:       user.PrimaryWalletAddress != "",
			HasSecondary:     user.SecondaryWalletAddress != nil && *user.SecondaryWalletAddress != "",
		}

	return c.JSON(response)
	}
}

// GetWalletAddressHealthHandler returns the health status of wallet address configuration
func GetWalletAddressHealthHandler(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get authenticated user ID from context
		userIDInterface := c.Locals("userID")
		if userIDInterface == nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Unauthorized: User ID not found in context",
			})
		}

		userID, ok := userIDInterface.(uint)
		if !ok {
			log.Printf("Error: Invalid user ID type in context: %T", userIDInterface)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Internal server error: Invalid user ID type",
			})
		}

		// Fetch user from database
		var user models.User
		result := db.Where("id = ?", userID).First(&user)
		if result.Error != nil {
			if result.Error == gorm.ErrRecordNotFound {
				return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
					"error": "User not found",
				})
			}
			log.Printf("Error fetching user %d: %v", userID, result.Error)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to fetch user information",
			})
		}

		// Check address validity
		hasPrimary := user.PrimaryWalletAddress != ""
		hasSecondary := user.SecondaryWalletAddress != nil && *user.SecondaryWalletAddress != ""
		
		primaryValid := hasPrimary && utils.ValidateWalletAddress(user.PrimaryWalletAddress) == nil
		secondaryValid := true // Secondary is optional, so it's valid if empty or if valid address
		if hasSecondary {
			secondaryValid = utils.ValidateWalletAddress(*user.SecondaryWalletAddress) == nil
		}

		// Determine readiness and recommendations
		readyForPayments := hasPrimary && primaryValid
		var recommendation string

		if !hasPrimary {
			recommendation = "Please configure a primary wallet address to receive payments"
		} else if !primaryValid {
			recommendation = "Primary wallet address is invalid. Please update it with a valid Solana address"
		} else if hasSecondary && !secondaryValid {
			recommendation = "Secondary wallet address is invalid. Please update or remove it"
		} else if readyForPayments {
			recommendation = "Wallet addresses are properly configured for payments"
		}

		// Prepare response
		response := HealthCheckResponse{
			HasPrimary:         hasPrimary,
			HasSecondary:       hasSecondary,
			PrimaryValid:       primaryValid,
			SecondaryValid:     secondaryValid,
			ReadyForPayments:   readyForPayments,
			Recommendation:     recommendation,
		}

		return c.JSON(response)
	}
}

// UpdatePrimaryWalletAddressHandler updates the user's primary wallet address
func UpdatePrimaryWalletAddressHandler(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get authenticated user ID from context
		userIDInterface := c.Locals("userID")
		if userIDInterface == nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Unauthorized: User ID not found in context",
			})
		}

		userID, ok := userIDInterface.(uint)
		if !ok {
			log.Printf("Error: Invalid user ID type in context: %T", userIDInterface)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Internal server error: Invalid user ID type",
			})
		}

		// Parse request body
		var req UpdateWalletAddressRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid request body: " + err.Error(),
			})
		}

		// Validate address
		req.Address = utils.NormalizeWalletAddress(req.Address)
		if err := validateWalletAddress(req.Address); err != nil {
			return err
		}

		// Update user's primary wallet address
		result := db.Model(&models.User{}).Where("id = ?", userID).Update("primary_wallet_address", req.Address)
		if result.Error != nil {
			log.Printf("Error updating primary wallet address for user %d: %v", userID, result.Error)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to update primary wallet address",
			})
		}

		if result.RowsAffected == 0 {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "User not found",
			})
		}

		log.Printf("User %d updated primary wallet address to: %s", userID, req.Address)

		return c.JSON(UpdateWalletAddressResponse{
			Message: "Primary wallet address updated successfully",
			Address: req.Address,
			Updated: true,
		})
	}
}

// UpdateSecondaryWalletAddressHandler updates the user's secondary wallet address
func UpdateSecondaryWalletAddressHandler(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get authenticated user ID from context
		userIDInterface := c.Locals("userID")
		if userIDInterface == nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Unauthorized: User ID not found in context",
			})
		}

		userID, ok := userIDInterface.(uint)
		if !ok {
			log.Printf("Error: Invalid user ID type in context: %T", userIDInterface)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Internal server error: Invalid user ID type",
			})
		}

		// Parse request body
		var req UpdateWalletAddressRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid request body: " + err.Error(),
			})
		}

		// Handle clearing secondary address (empty string)
		req.Address = utils.NormalizeWalletAddress(req.Address)
		if req.Address == "" {
			// Clear secondary address (set to NULL)
			result := db.Model(&models.User{}).Where("id = ?", userID).Update("secondary_wallet_address", nil)
			if result.Error != nil {
				log.Printf("Error clearing secondary wallet address for user %d: %v", userID, result.Error)
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": "Failed to clear secondary wallet address",
				})
			}

			if result.RowsAffected == 0 {
				return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
					"error": "User not found",
				})
			}

			log.Printf("User %d cleared secondary wallet address", userID)

			return c.JSON(UpdateWalletAddressResponse{
				Message: "Secondary wallet address cleared successfully",
				Address: "",
				Updated: true,
			})
		}

		// Validate address
		if err := validateWalletAddress(req.Address); err != nil {
			return err
		}

		// Update user's secondary wallet address
		result := db.Model(&models.User{}).Where("id = ?", userID).Update("secondary_wallet_address", req.Address)
		if result.Error != nil {
			log.Printf("Error updating secondary wallet address for user %d: %v", userID, result.Error)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to update secondary wallet address",
			})
		}

		if result.RowsAffected == 0 {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "User not found",
			})
		}

		log.Printf("User %d updated secondary wallet address to: %s", userID, req.Address)

		return c.JSON(UpdateWalletAddressResponse{
			Message: "Secondary wallet address updated successfully",
			Address: req.Address,
			Updated: true,
		})
	}
}

// ValidateWalletAddressHandler validates a wallet address without saving it
func ValidateWalletAddressHandler(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Authentication is required but we don't need user data for validation
		userIDInterface := c.Locals("userID")
		if userIDInterface == nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Unauthorized: User ID not found in context",
			})
		}

		// Parse request body
		var req ValidateAddressRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid request body: " + err.Error(),
			})
		}

		// Normalize address
		req.Address = utils.NormalizeWalletAddress(req.Address)

		// Validate address
		response := ValidateAddressResponse{
			IsValid: true,
			Message: "Valid Solana wallet address",
		}

		if req.Address == "" {
			response.IsValid = false
			response.Message = "Address cannot be empty"
		} else if err := validateWalletAddress(req.Address); err != nil {
			response.IsValid = false
			// Extract error message from fiber error
			if fiberErr, ok := err.(*fiber.Error); ok {
				response.Message = fiberErr.Message
			} else {
				response.Message = err.Error()
			}
		}

		return c.JSON(response)
	}
}