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

	// Imports for lyonnee/key25519 based derivation
	"github.com/lyonnee/key25519/bip32"
	"github.com/lyonnee/key25519/bip44"

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
	QuoteResponse       json.RawMessage `json:"quoteResponse"`
	UserPublicKeyString   string          `json:"userPublicKeyString"` // Renamed field and tag
	UserPrivateKeyBase64 string          `json:"userPrivateKeyBase64,omitempty"` // Add back as optional
}

// SolanaAPISwapResponse from solana-api should contain the signature
type SolanaAPISwapResponse struct {
	Signature string `json:"signature"`
}

// CreateTokenAccountsRequest defines the body for /create-token-accounts requests from the frontend
type CreateTokenAccountsRequest struct {
	SignedTransaction string `json:"signedTransaction"` // Base64 encoded signed transaction
	Password          string `json:"password"`          // User's password for decryption
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
	var userWallet models.Wallet
	if err := h.DB.WithContext(ctx).Where("user_id = ?", userID).First(&userWallet).Error; err != nil {
		// Securely clear potentially sensitive password before returning
		reqBody.Password = ""
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Wallet not found for user"})
		}
		fmt.Printf("Error fetching wallet for user %d: %v\n", userID, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error fetching wallet"})
	}

	// 4. Decrypt mnemonic
	mnemonic, err := crypto.DecryptMnemonic(userWallet.EncryptedMnemonic, userWallet.EncryptionMetadata, reqBody.Password)
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

	// --- Derive User Keypair from Mnemonic using Standard Path (lyonnee/key25519) ---
	seed := bip39.NewSeed(mnemonic, "")
	mnemonic = "" // zero out mnemonic asap

	// Create master key from seed
	masterKey := bip32.GenerateMasterKey(seed)

	// Define the standard Solana derivation path
	path := "m/44'/501'/0'/0'"
	indices, err := bip44.ParsePath(path)
	if err != nil {
		for i := range seed { seed[i] = 0 } // Clear seed
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse derivation path", "details": err.Error()})
	}

	// Derive the key by iterating through path indices
	derivedKey := masterKey
	for _, index := range indices {
		derivedKey = bip32.CKDPriv(derivedKey, index)
	}

	// Convert the derived private key bytes to an ed25519.PrivateKey
	finalEd25519PrivKey := ed25519.NewKeyFromSeed(derivedKey.PrivKey)

	// Get the public key string (using gagliardetto/solana-go type for consistency)
	userPublicKey := solana.PublicKey(finalEd25519PrivKey.Public().(ed25519.PublicKey))
	userPublicKeyString := userPublicKey.String()

	// Convert the 32-byte private seed to base64 for sending
	secretKeyBase64 := base64.StdEncoding.EncodeToString(derivedKey.PrivKey) // Send the 32-byte seed

	// Clear sensitive data
	for i := range seed { seed[i] = 0 }
	for i := range derivedKey.PrivKey { derivedKey.PrivKey[i] = 0 }

	// --- Call Solana API Swap Endpoint ---
	// The solana-api /swap endpoint now expects userPublicKeyString
	solanaAPIURL := fmt.Sprintf("%s/api/swap/swap", h.Cfg.SolanaAPIURL)
	solanaReqBody := SolanaAPISwapRequest{
		QuoteResponse:       reqBody.QuoteResponse,
		UserPublicKeyString: userPublicKeyString,
		UserPrivateKeyBase64: secretKeyBase64, // Send the 32-byte seed (base64 encoded)
	}

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

// HandleCreateTokenAccounts handles submission of signed token account creation tx
func (h *SwapHandler) HandleCreateTokenAccounts(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// --- Authentication ---
	userIDLocals := c.Locals("userID")
	userID, ok := userIDLocals.(uint)
	if !ok || userID == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User ID not found or invalid in context"})
	}

	// --- Parse Request Body ---
	var reqBody CreateTokenAccountsRequest
	if err := c.BodyParser(&reqBody); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse request body", "details": err.Error()})
	}
	if reqBody.SignedTransaction == "" || reqBody.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing required fields: signedTransaction, password"})
	}

	// --- Fetch Wallet ---
	var wallet models.Wallet
	if err := h.DB.WithContext(ctx).Where("user_id = ?", userID).First(&wallet).Error; err != nil {
		reqBody.Password = "" // clear sensitive data
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Wallet not found for user"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error fetching wallet"})
	}

	// --- Decrypt Mnemonic ---
	// Decrypt just to verify password, mnemonic is not needed further in this func
	_, err := crypto.DecryptMnemonic(wallet.EncryptedMnemonic, wallet.EncryptionMetadata, reqBody.Password)
	reqBody.Password = "" // zero out password asap
	if err != nil {
		if strings.Contains(err.Error(), "cipher: message authentication failed") {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid password"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to decrypt wallet key"})
	}

	// --- Proxy Request to solana-api --- 
	// We only need the signedTransaction from the client now
	solanaAPIURL := fmt.Sprintf("%s/api/swap/create-token-accounts", h.Cfg.SolanaAPIURL)

	proxyBody := map[string]interface{}{
		"signedTransaction": reqBody.SignedTransaction, 
		// "userPrivateKey": base64.StdEncoding.EncodeToString(derivedKey), // Removed - Private key no longer sent here
	}

	payloadBytes, err := json.Marshal(proxyBody)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Internal server error creating request"})
	}

	httpClient := &http.Client{Timeout: 90 * time.Second}
	resp, err := httpClient.Post(solanaAPIURL, "application/json", bytes.NewBuffer(payloadBytes))
	if err != nil {
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": "Failed to connect to token account creation service"})
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": "Failed to read response from token account creation service"})
	}

	if resp.StatusCode != http.StatusOK {
		var forwarded map[string]interface{}
		if json.Unmarshal(respBytes, &forwarded) == nil {
			return c.Status(resp.StatusCode).JSON(forwarded)
		}
		return c.Status(resp.StatusCode).JSON(fiber.Map{"error": "Received error from token account creation service", "details": string(respBytes)})
	}

	c.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
	return c.Status(http.StatusOK).Send(respBytes)
}
