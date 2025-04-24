package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/team556-mono/server/internal/config" 
	"github.com/team556-mono/server/internal/models"
	"gorm.io/gorm"
)

// Response structure from solana-api/wallet/create
type SolanaWalletCreateResponse struct {
	PublicKey string `json:"publicKey"`
	Mnemonic  string `json:"mnemonic"`
}

// Response body for our main-api endpoint
type CreateWalletResponse struct {
	Message  string `json:"message"`
	Mnemonic string `json:"mnemonic"` // IMPORTANT: Only return this, don't store it
}

// CreateWalletHandler handles the creation of a new Solana wallet for the authenticated user.
func CreateWalletHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// --- Authentication ---
		// Assuming an auth middleware sets the user ID in locals
		userIDInterface := c.Locals("userID")
		if userIDInterface == nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: User ID not found in context"})
		}
		userID, ok := userIDInterface.(uint) // Using uint based on GORM default primary key
		if !ok {
			log.Printf("Error: Invalid user ID type in context: %T", userIDInterface)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Internal server error: Invalid user ID type"})
		}

		log.Printf("User %d requesting wallet creation", userID)

		// --- Call Solana API ---
		solanaAPIURL := cfg.SolanaAPIURL // Get URL from config
		if solanaAPIURL == "" {
			log.Println("Error: SOLANA_API_BASE_URL not configured")
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Configuration error: Solana API URL missing"})
		}
		createWalletURL := fmt.Sprintf("%s/api/wallet/create", solanaAPIURL)

		log.Printf("Calling Solana API: POST %s", createWalletURL)
		// Use http.Client for potential pooling/reuse
		client := &http.Client{}
		// No request body needed for solana-api endpoint currently
		resp, err := client.Post(createWalletURL, "application/json", nil)
		if err != nil {
			log.Printf("Error calling Solana API: %v", err)
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Failed to connect to Solana service"})
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusCreated { // Check for 201 Created
			// Try to read body for more details
			var errorBody map[string]interface{}
			_ = json.NewDecoder(resp.Body).Decode(&errorBody) // Ignore decode error here, focus on status code
			log.Printf("Error from Solana API (Status %d): %v", resp.StatusCode, errorBody)
			return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{
				"error":         "Failed to create wallet via Solana service",
				"upstreamError": errorBody,
			})
		}

		// --- Process Solana API Response ---
		var solanaResp SolanaWalletCreateResponse
		if err := json.NewDecoder(resp.Body).Decode(&solanaResp); err != nil {
			log.Printf("Error decoding Solana API response: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to process Solana service response"})
		}

		if solanaResp.PublicKey == "" || solanaResp.Mnemonic == "" {
			log.Println("Error: Invalid response from Solana API - missing publicKey or mnemonic")
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Received invalid data from Solana service"})
		}

		log.Printf("Received PublicKey: %s from Solana API", solanaResp.PublicKey)

		// --- Save Wallet to Database ---
		newWallet := models.Wallet{
			UserID:  userID,
			Address: solanaResp.PublicKey,
			Name:    "Primary Wallet", // Default name
		}

		// Use a transaction for safety if needed, but simple create is often fine here
		result := db.Create(&newWallet)
		if result.Error != nil {
			// TODO: Handle potential unique constraint violation (user might already have this exact wallet address somehow?)
			// Or other DB errors
			log.Printf("Error saving wallet to database: %v", result.Error)
			// Consider checking for specific GORM errors like gorm.ErrDuplicatedKey
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save wallet information"})
		}

		log.Printf("Successfully created wallet record %d for user %d", newWallet.ID, userID)

		// --- Return Mnemonic to Client ---
		// CRITICAL: Only return the mnemonic, do not store it anywhere in main-api DB
		return c.Status(fiber.StatusCreated).JSON(CreateWalletResponse{
			Message:  "Wallet created successfully. Secure your mnemonic phrase!",
			Mnemonic: solanaResp.Mnemonic,
		})
	}
}
