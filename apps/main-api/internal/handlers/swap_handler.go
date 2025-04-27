package handlers

import (
	"bytes"
	"context"
	"crypto/ed25519"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gagliardetto/solana-go"
	"github.com/gofiber/fiber/v2"
	"github.com/team556-mono/server/internal/config"
	"github.com/team556-mono/server/internal/crypto"
	"github.com/team556-mono/server/internal/models"
	bip39 "github.com/tyler-smith/go-bip39"
	"gorm.io/gorm"
)

// SwapHandler handles swap related requests
type SwapHandler struct {
	DB  *gorm.DB
	Cfg *config.Config
}

// NewSwapHandler creates a new SwapHandler
func NewSwapHandler(db *gorm.DB, cfg *config.Config) *SwapHandler {
	return &SwapHandler{
		DB:  db,
		Cfg: cfg,
	}
}

// --- Request/Response Structs ---

// GetQuoteRequest defines the expected body for the /quote request from the frontend
type GetQuoteRequest struct {
	InputMint   string `json:"inputMint"`
	OutputMint  string `json:"outputMint"`
	Amount      uint64 `json:"amount"` // Use uint64 for lamports/smallest unit
	SlippageBps *int   `json:"slippageBps,omitempty"` // Pointer for optional field
}

// SolanaAPIQuoteRequest defines the body sent to the solana-api /quote endpoint
type SolanaAPIQuoteRequest struct {
	InputMint   string `json:"inputMint"`
	OutputMint  string `json:"outputMint"`
	Amount      uint64 `json:"amount"`
	SlippageBps *int   `json:"slippageBps,omitempty"`
}

// ExecuteSwapRequest defines the body for the /execute request from the frontend
type ExecuteSwapRequest struct {
	QuoteResponse json.RawMessage `json:"quoteResponse"` // Pass the raw JSON quote object
	Password      string          `json:"password"`       // User's password for decryption
}

// SolanaAPISwapRequest defines the body sent to the solana-api /swap endpoint
type SolanaAPISwapRequest struct {
	QuoteResponse   json.RawMessage `json:"quoteResponse"`
	UserPrivateKey  string          `json:"userPrivateKey"` // Base64 encoded private key bytes
}

// SolanaAPISwapResponse from solana-api should contain the signature
type SolanaAPISwapResponse struct {
	Signature string `json:"signature"`
}

// HandleGetSwapQuote fetches a swap quote by proxying the request to the solana-api
func (h *SwapHandler) HandleGetSwapQuote(c *fiber.Ctx) error {
	// 1. Parse request body from frontend
	var reqBody GetQuoteRequest
	if err := c.BodyParser(&reqBody); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse request body", "details": err.Error()})
	}

	// Basic validation (can be more robust)
	if reqBody.InputMint == "" || reqBody.OutputMint == "" || reqBody.Amount == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing required fields: inputMint, outputMint, amount"})
	}

	// 2. Construct request for solana-api
	solanaAPIURL := fmt.Sprintf("%s/api/swap/quote", h.Cfg.SolanaAPIURL)
	solanaReqBody := SolanaAPIQuoteRequest{
		InputMint:   reqBody.InputMint,
		OutputMint:  reqBody.OutputMint,
		Amount:      reqBody.Amount,
		SlippageBps: reqBody.SlippageBps,
	}

	payloadBytes, err := json.Marshal(solanaReqBody)
	if err != nil {
		c.SendStatus(fiber.StatusInternalServerError)
		return fmt.Errorf("failed to marshal request body for solana-api: %w", err)
	}

	// 3. Make POST request to solana-api
	resp, err := http.Post(solanaAPIURL, "application/json", bytes.NewBuffer(payloadBytes))
	if err != nil {
		c.SendStatus(fiber.StatusInternalServerError)
		return fmt.Errorf("failed to send request to solana-api: %w", err)
	}
	defer resp.Body.Close()

	// 4. Read response body from solana-api
	responseBodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		c.SendStatus(fiber.StatusInternalServerError)
		return fmt.Errorf("failed to read response body from solana-api: %w", err)
	}

	// 5. Check solana-api response status
	if resp.StatusCode != http.StatusOK {
		// Try to parse error message from solana-api response
		var errorResp map[string]interface{}
		if json.Unmarshal(responseBodyBytes, &errorResp) == nil {
			return c.Status(resp.StatusCode).JSON(errorResp)
		}
		// Fallback if parsing fails
		return c.Status(resp.StatusCode).JSON(fiber.Map{"error": "Received non-OK status from solana-api", "details": string(responseBodyBytes)})
	}

	// 6. Unmarshal the successful quote response from solana-api
	var rawQuoteResponse interface{}
	if err := json.Unmarshal(responseBodyBytes, &rawQuoteResponse); err != nil {
		c.SendStatus(fiber.StatusInternalServerError)
		return fmt.Errorf("failed to unmarshal quote response from solana-api: %w", err)
	}

	// 7. Wrap the quote response in the structure expected by the frontend
	type FrontendQuoteResponse struct {
		QuoteResponse interface{} `json:"quoteResponse"`
	}
	frontendResponse := FrontendQuoteResponse{
		QuoteResponse: rawQuoteResponse,
	}

	// 8. Marshal the new structure and send it
	finalPayloadBytes, err := json.Marshal(frontendResponse)
	if err != nil {
		c.SendStatus(fiber.StatusInternalServerError)
		return fmt.Errorf("failed to marshal final response for frontend: %w", err)
	}

	// Send the wrapped response
	c.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
	return c.Status(http.StatusOK).Send(finalPayloadBytes)
}

// HandleExecuteSwap handles the swap execution process (Revised Architecture)
func (h *SwapHandler) HandleExecuteSwap(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second) // Context for DB query
	defer cancel()

	// 1. Get User ID from context
	userIDLocals := c.Locals("userID")
	userID, ok := userIDLocals.(uint)
	if !ok || userID == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User ID not found or invalid in context"})
	}

	// 2. Parse request body
	var reqBody ExecuteSwapRequest
	if err := c.BodyParser(&reqBody); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse request body", "details": err.Error()})
	}
	if reqBody.Password == "" || len(reqBody.QuoteResponse) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing required fields: quoteResponse, password"})
	}

	// 3. Fetch user's wallet
	var wallet models.Wallet
	if err := h.DB.WithContext(ctx).Where("user_id = ?", userID).First(&wallet).Error; err != nil {
		// Securely clear potentially sensitive password before returning
		reqBody.Password = ""
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Wallet not found for user"})
		}
		fmt.Printf("Error fetching wallet for user %d: %v\n", userID, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error fetching wallet"})
	}

	// 4. Decrypt mnemonic
	mnemonic, err := crypto.DecryptMnemonic(wallet.EncryptedMnemonic, wallet.EncryptionMetadata, reqBody.Password)
	// Clear password from memory ASAP regardless of decryption success/failure
	reqBody.Password = ""
	if err != nil {
		// Use strings.Contains for more robust error checking
		if strings.Contains(err.Error(), "cipher: message authentication failed") { 
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid password"})
		}
		fmt.Printf("Error decrypting mnemonic for user %d: %v\n", userID, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to decrypt wallet key"})
	}

	// 5. Derive private key from mnemonic
	seed := bip39.NewSeed(mnemonic, "")
	mnemonic = "" // Zero out mnemonic

	// Use standard crypto/ed25519 function with the first 32 bytes of the BIP39 seed.
	ed25519PrivKey := ed25519.NewKeyFromSeed(seed[:32])
	derivedKey := solana.PrivateKey(ed25519PrivKey) // Convert ed25519.PrivateKey to solana.PrivateKey

	for i := range seed { seed[i] = 0 } // Zero out seed buffer

	// Optional: Check key validity (though NewKeyFromSeed should always produce a valid key)
	if !derivedKey.IsValid() {
		fmt.Printf("Error: derived private key is invalid for user %d\n", userID)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to derive valid wallet key"})
	}

	// --- Architecture Change: Pass Key to Solana API ---

	// 6. Prepare request for solana-api
	solanaAPIURL := fmt.Sprintf("%s/api/swap/swap", h.Cfg.SolanaAPIURL) // Reverted endpoint back to /api/swap/swap
	solanaReqBody := SolanaAPISwapRequest{
		QuoteResponse:  reqBody.QuoteResponse,                     // Forward raw JSON quote
		UserPrivateKey: base64.StdEncoding.EncodeToString(derivedKey), // Send raw private key bytes encoded
	}
	// Clear derived key from memory ASAP
	derivedKey = solana.PrivateKey{}

	payloadBytes, err := json.Marshal(solanaReqBody)
	if err != nil {
		fmt.Printf("Error marshaling swap request for solana-api: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Internal server error creating swap request"})
	}

	// 7. Call solana-api /swap endpoint
	httpClient := &http.Client{Timeout: 90 * time.Second} // Increased timeout to 90 seconds
	resp, err := httpClient.Post(solanaAPIURL, "application/json", bytes.NewBuffer(payloadBytes))
	if err != nil {
		fmt.Printf("Error sending swap execution request to solana-api: %v\n", err)
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": "Failed to connect to swap execution service"})
	}
	defer resp.Body.Close()

	// 8. Read response body from solana-api
	responseBodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("Error reading swap execution response from solana-api: %v\n", err)
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": "Failed to read response from swap execution service"})
	}

	// 9. Check solana-api response status and forward
	if resp.StatusCode != http.StatusOK {
		fmt.Printf("Non-OK status from solana-api swap execution: %d - %s\n", resp.StatusCode, string(responseBodyBytes))
		// Try to forward the error structure from solana-api directly
		var errorResp map[string]interface{}
		if json.Unmarshal(responseBodyBytes, &errorResp) == nil {
			return c.Status(resp.StatusCode).JSON(errorResp)
		}
		// Fallback if parsing fails
		return c.Status(resp.StatusCode).JSON(fiber.Map{"error": "Received error from swap execution service", "details": string(responseBodyBytes)})
	}

	// Forward the successful response (should contain signature) from solana-api
	c.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
	return c.Status(http.StatusOK).Send(responseBodyBytes)
}
