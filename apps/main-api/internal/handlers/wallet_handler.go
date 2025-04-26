package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

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

// Response structure from solana-api/wallet/balance/:address
type SolanaWalletBalanceResponse struct {
	Balance float64  `json:"balance"`
	Price   *float64 `json:"price"` // Use pointer to handle potential null from solana-api
}

// Response body for our main-api get balance endpoint
type GetWalletBalanceResponse struct {
	Balance float64  `json:"balance"`
	Price   *float64 `json:"price"` // Use pointer to handle potential null
}

// CheckPresaleCodeRequest defines the structure for the presale code check request
type CheckPresaleCodeRequest struct {
	Code string `json:"code" validate:"required"`
}

// CheckPresaleCodeResponse defines the structure for the presale code check response
type CheckPresaleCodeResponse struct {
	IsValid  bool   `json:"isValid"`
	Redeemed bool   `json:"redeemed"`
	Type     int    `json:"type,omitempty"` // Only included if IsValid is true
	Message  string `json:"message"`
}

// RedeemPresaleCodeRequest defines the structure for the presale code redeem request
type RedeemPresaleCodeRequest struct {
	Code          string  `json:"code" validate:"required"`
	WalletAddress *string `json:"walletAddress,omitempty"` // Required only for Type 2 codes
}

// RedeemPresaleCodeResponse defines the structure for the presale code redeem response
type RedeemPresaleCodeResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
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
		// Get URL from config and normalize 'localhost' to '127.0.0.1'
		solanaAPIURL := cfg.SolanaAPIURL
		if strings.Contains(solanaAPIURL, "//localhost") { // Check if it contains localhost
			solanaAPIURL = strings.Replace(solanaAPIURL, "//localhost", "//127.0.0.1", 1)
			log.Printf("Normalized Solana API URL to use 127.0.0.1: %s", solanaAPIURL)
		}

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

// GetWalletBalanceHandler handles fetching the SOL balance for the authenticated user's wallet.
func GetWalletBalanceHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// --- Authentication ---
		userIDInterface := c.Locals("userID")
		if userIDInterface == nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: User ID not found in context"})
		}
		userID, ok := userIDInterface.(uint)
		if !ok {
			log.Printf("Error: Invalid user ID type in context: %T", userIDInterface)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Internal server error: Invalid user ID type"})
		}

		log.Printf("User %d requesting wallet balance", userID)

		// --- Get Wallet Address from DB ---
		var wallet models.Wallet
		// Assuming user has one primary wallet for now. Add logic if multiple wallets are possible.
		result := db.Where("user_id = ?", userID).First(&wallet)
		if result.Error != nil {
			if result.Error == gorm.ErrRecordNotFound {
				log.Printf("User %d has no wallet record", userID)
				return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Wallet not found for this user"})
			}
			log.Printf("Error fetching wallet for user %d: %v", userID, result.Error)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve wallet information"})
		}
		userWalletAddress := wallet.Address
		log.Printf("Found wallet address %s for user %d", userWalletAddress, userID)

		// --- Call Solana API ---
		solanaAPIURL := cfg.SolanaAPIURL
		if solanaAPIURL == "" {
			log.Println("Error: SOLANA_API_BASE_URL not configured")
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Configuration error: Solana API URL missing"})
		}
		// Note: Ensure the solana-api route is exactly /api/wallet/balance/:address
		getBalanceURL := fmt.Sprintf("%s/api/wallet/balance/%s", solanaAPIURL, userWalletAddress)

		log.Printf("Calling Solana API: GET %s", getBalanceURL)
		client := &http.Client{}
		resp, err := client.Get(getBalanceURL)
		if err != nil {
			log.Printf("Error calling Solana API for balance: %v", err)
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Failed to connect to Solana service for balance"})
		}

		// --- Read raw body for debugging ---
		bodyBytes, readErr := io.ReadAll(resp.Body)
		if readErr != nil {
			log.Printf("Error reading Solana API balance response body: %v", readErr)
			// We might still be able to proceed if status code was OK, but response is likely compromised
			// For now, return server error if body read fails
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to read Solana service balance response"})
		}
		bodyString := string(bodyBytes)
		log.Printf("Raw response body from Solana API (Balance): %s", bodyString)

		if resp.StatusCode != http.StatusOK { // Expect 200 OK
			var errorBody map[string]interface{}
			// Try decoding the raw body we already read
			_ = json.Unmarshal(bodyBytes, &errorBody)
			log.Printf("Error from Solana API (Balance - Status %d): Body: %s, DecodedError: %v", resp.StatusCode, bodyString, errorBody)
			// Forward the status code if it's a client error (4xx)
			if resp.StatusCode >= 400 && resp.StatusCode < 500 {
				return c.Status(resp.StatusCode).JSON(fiber.Map{
					"error":         "Error fetching balance from Solana service",
					"upstreamError": errorBody,
				})
			}
			// Otherwise, it's likely a server error on their end or ours
			return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{
				"error":         "Failed to get balance via Solana service",
				"upstreamError": errorBody,
			})
		}

		// --- Process Solana API Response ---
		var solanaResp SolanaWalletBalanceResponse
		// Decode the raw body we already read
		if err := json.Unmarshal(bodyBytes, &solanaResp); err != nil {
			log.Printf("Error decoding Solana API balance response JSON: %v. Raw Body: %s", err, bodyString)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to process Solana service balance response"})
		}

		// Log the decoded struct fields explicitly
		log.Printf("Decoded Solana Response: Balance=%.9f, Price=%v", solanaResp.Balance, solanaResp.Price)

		// --- Return Response to Client ---
		return c.Status(fiber.StatusOK).JSON(GetWalletBalanceResponse{
			Balance: solanaResp.Balance,
			Price:   solanaResp.Price, // Pass along the price (or nil if fetch failed)
		})
	}
}

// GetWalletTeamTokenBalanceHandler fetches the TEAM token balance and price for the user's wallet
func GetWalletTeamTokenBalanceHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// 1. Get user ID from context (set by middleware)
		userIDInterface := c.Locals("userID")
		if userIDInterface == nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: User ID not found in context"})
		}
		userID, ok := userIDInterface.(uint)
		if !ok {
			log.Printf("Error: Invalid user ID type in context: %T", userIDInterface)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Internal server error: Invalid user ID type"})
		}

		log.Printf("User %d requesting wallet TEAM token balance", userID)

		// 2. Find the wallet for the user
		var wallet models.Wallet
		// Assuming user has one primary wallet for now. Add logic if multiple wallets are possible.
		result := db.Where("user_id = ?", userID).First(&wallet)
		if result.Error != nil {
			if result.Error == gorm.ErrRecordNotFound {
				log.Printf("User %d has no wallet record", userID)
				return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Wallet not found for this user"})
			}
			log.Printf("Error fetching wallet for user %d: %v", userID, result.Error)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve wallet information"})
		}
		userWalletAddress := wallet.Address
		log.Printf("Found wallet address %s for user %d", userWalletAddress, userID)

		// 3. Call Solana API for TEAM token balance
		solanaAPIURL := cfg.SolanaAPIURL
		if solanaAPIURL == "" {
			log.Println("Solana API URL is not configured")
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Server configuration error: Solana API URL missing"})
		}

		// Construct the URL for the TEAM token balance endpoint
		url := fmt.Sprintf("%s/api/wallet/balance/team/%s", solanaAPIURL, userWalletAddress)
		log.Printf("Calling Solana API for TEAM token balance: %s", url)

		// Use a client with a timeout
		apiClient := http.Client{Timeout: 10 * time.Second}
		solanaRespRaw, err := apiClient.Get(url)
		if err != nil {
			log.Printf("Error calling Solana API for TEAM balance: %v", err)
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Failed to connect to Solana service for TEAM balance"})
		}
		defer solanaRespRaw.Body.Close()

		if solanaRespRaw.StatusCode != http.StatusOK {
			bodyBytes, _ := io.ReadAll(solanaRespRaw.Body)
			bodyString := string(bodyBytes)
			log.Printf("Solana API (TEAM Balance) returned non-OK status: %d. Body: %s", solanaRespRaw.StatusCode, bodyString)
			return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{
				"error":         "Solana service returned error for TEAM balance: " + bodyString,
				"upstreamError": bodyString,
			})
		}

		// 4. Decode Solana API Response
		bodyBytes, err := io.ReadAll(solanaRespRaw.Body)
		if err != nil {
			log.Printf("Error reading Solana API TEAM balance response body: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to read response body from Solana API (TEAM Balance)"})
		}
		bodyString := string(bodyBytes)
		log.Printf("Raw response body from Solana API (TEAM Balance): %s", bodyString)

		var solanaResp SolanaWalletBalanceResponse // Reuse the same struct
		if err := json.Unmarshal(bodyBytes, &solanaResp); err != nil {
			log.Printf("Error decoding Solana API TEAM balance response JSON: %v. Raw Body: %s", err, bodyString)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to decode Solana API TEAM balance response"})
		}

		// Log decoded values
		priceLog := "nil"
		if solanaResp.Price != nil {
			priceLog = fmt.Sprintf("%.6f", *solanaResp.Price)
		}
		log.Printf("Decoded Solana TEAM Response: Balance=%.8f, Price=%s", solanaResp.Balance, priceLog)

		// 5. Prepare and Send Response
		resp := GetWalletBalanceResponse{
			Balance: solanaResp.Balance,
			Price:   solanaResp.Price,
		}

		return c.Status(fiber.StatusOK).JSON(resp)
	}
}

// CheckPresaleCode checks the validity and status of a given presale code.
func CheckPresaleCode(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req CheckPresaleCodeRequest

		// Parse request body
		if err := c.BodyParser(&req); err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": "Cannot parse JSON",
			})
		}

		// Basic validation (e.g., presence)
		if req.Code == "" {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": "Presale code is required",
			})
		}

		// Validate format (P1-XXXXXXX or P2-XXXXXXX)
		parts := strings.Split(req.Code, "-")
		if len(parts) != 2 || (parts[0] != "P1" && parts[0] != "P2") || len(parts[1]) == 0 {
			return c.Status(http.StatusBadRequest).JSON(CheckPresaleCodeResponse{
				IsValid: false,
				Message: "Invalid code format. Use P1-XXXXXXX or P2-XXXXXXX.",
			})
		}

		// Query database
		var presaleCode models.PresaleCode
		result := db.First(&presaleCode, "code = ?", req.Code)

		if result.Error != nil {
			if errors.Is(result.Error, gorm.ErrRecordNotFound) {
				return c.Status(http.StatusNotFound).JSON(CheckPresaleCodeResponse{
					IsValid: false,
					Message: "Presale code not found.",
				})
			}
			// Handle other potential database errors
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Database error checking code",
			})
		}

		// Check if redeemed
		if presaleCode.Redeemed {
			return c.Status(http.StatusOK).JSON(CheckPresaleCodeResponse{
				IsValid:  true,
				Redeemed: true,
				Type:     presaleCode.Type,
				Message:  "This presale code has already been redeemed.",
			})
		}

		// Code is valid and not redeemed
		return c.Status(http.StatusOK).JSON(CheckPresaleCodeResponse{
			IsValid:  true,
			Redeemed: false,
			Type:     presaleCode.Type,
			Message:  "Presale code is valid.",
		})
	}
}

// RedeemPresaleCode handles the redemption of a valid, non-redeemed presale code.
func RedeemPresaleCode(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req RedeemPresaleCodeRequest

		// Get authenticated user ID from context (set by auth middleware)
		userID, ok := c.Locals("userID").(uint)
		if !ok || userID == 0 {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "User not authenticated or invalid user ID"})
		}

		// Parse request body
		if err := c.BodyParser(&req); err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
		}

		// Validate presence of code
		if req.Code == "" {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Presale code is required"})
		}

		// Find the presale code
		var presaleCode models.PresaleCode
		result := db.First(&presaleCode, "code = ?", req.Code)

		if result.Error != nil {
			if errors.Is(result.Error, gorm.ErrRecordNotFound) {
				return c.Status(http.StatusNotFound).JSON(RedeemPresaleCodeResponse{
					Success: false,
					Message: "Presale code not found.",
				})
			}
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Database error finding code"})
		}

		// Check if already redeemed
		if presaleCode.Redeemed {
			return c.Status(http.StatusConflict).JSON(RedeemPresaleCodeResponse{
				Success: false,
				Message: "This presale code has already been redeemed.",
			})
		}

		// Validate wallet address for Type 2 codes
		if presaleCode.Type == 2 {
			if req.WalletAddress == nil || *req.WalletAddress == "" {
				return c.Status(http.StatusBadRequest).JSON(RedeemPresaleCodeResponse{
					Success: false,
					Message: "Wallet address is required for this type of presale code.",
				})
			}
		}

		// --- Start Transaction ---
		tx := db.Begin()
		if tx.Error != nil {
			log.Printf("Error starting transaction: %v", tx.Error)
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not process redemption"})
		}

		// Associate the user ID with the presale code
		presaleCode.UserID = &userID
		presaleCode.Redeemed = true

		// Handle WalletAddress based on Type
		if presaleCode.Type == 1 {
			// For Type 1, find the user's primary wallet address
			var userWallet models.Wallet // Assuming models.Wallet exists
			if err := tx.Where("user_id = ?", userID).First(&userWallet).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					tx.Rollback()
					log.Printf("User %d does not have a wallet", userID)
					return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "User wallet not found"})
				} else {
					tx.Rollback()
					log.Printf("Error fetching user wallet for user %d: %v", userID, err)
					return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not fetch user wallet"})
				}
			}
			presaleCode.WalletAddress = &userWallet.Address // Set the fetched address

		} else if presaleCode.Type == 2 {
			// For Type 2, use the provided wallet address (validate if provided)
			if req.WalletAddress == nil || *req.WalletAddress == "" {
				tx.Rollback()
				return c.Status(http.StatusBadRequest).JSON(RedeemPresaleCodeResponse{
					Success: false,
					Message: "Wallet address is required for Type 2 presale code",
				})
			}
			presaleCode.WalletAddress = req.WalletAddress
		}

		// Save the updated presale code within the transaction
		if err := tx.Save(&presaleCode).Error; err != nil {
			tx.Rollback() // Rollback transaction on error
			log.Printf("Error redeeming presale code %s: %v", req.Code, err)
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not redeem presale code"})
		}

		// Commit the transaction
		if err := tx.Commit().Error; err != nil {
			tx.Rollback() // Ensure rollback if commit fails
			log.Printf("Error committing transaction for presale code %s: %v", req.Code, err)
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to finalize redemption"})
		}

		// Successfully redeemed
		return c.Status(http.StatusOK).JSON(RedeemPresaleCodeResponse{
			Success: true,
			Message: "Presale code successfully redeemed.",
		})
	}
}
