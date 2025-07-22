package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/team556-mono/server/internal/models"
	"gorm.io/gorm"
)

// PresaleHandler holds dependencies for presale related handlers
type PresaleHandler struct {
	DB           *gorm.DB
	JWTSecret    []byte
	SolanaAPIURL string
}

// NewPresaleHandler creates a new PresaleHandler
func NewPresaleHandler(db *gorm.DB, jwtSecret string, solanaAPIURL string) *PresaleHandler {
	return &PresaleHandler{
		DB:           db,
		JWTSecret:    []byte(jwtSecret),
		SolanaAPIURL: solanaAPIURL,
	}
}

// PresaleClaimStatusResponse defines the structure for claim status
type PresaleClaimStatusResponse struct {
	TokensClaimedP1P1 bool `json:"tokensClaimedP1P1"`
	TokensClaimedP1P2 bool `json:"tokensClaimedP1P2"`
	TokensClaimedP2   bool `json:"tokensClaimedP2"`
	HasPresaleCode    bool `json:"hasPresaleCode"` // Indicates if the user has a presale code linked
}

// GetPresaleClaimStatus retrieves the token claim status for the authenticated user.
func (h *PresaleHandler) GetPresaleClaimStatus(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)

	var presaleCode models.PresaleCode
	err := h.DB.Where("user_id = ?", userID).First(&presaleCode).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.JSON(PresaleClaimStatusResponse{
				TokensClaimedP1P1: false,
				TokensClaimedP1P2: false,
				TokensClaimedP2:   false,
				HasPresaleCode:    false,
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve presale code status", "details": err.Error()})
	}

	return c.JSON(PresaleClaimStatusResponse{
		TokensClaimedP1P1: presaleCode.TokensClaimedP1P1,
		TokensClaimedP1P2: presaleCode.TokensClaimedP1P2,
		TokensClaimedP2:   presaleCode.TokensClaimedP2,
		HasPresaleCode:    true,
	})
}

// SolanaAirdropRequest defines the payload for the solana-api airdrop endpoint
type SolanaAirdropRequest struct {
	RecipientAddress string `json:"recipientAddress"`
}

// SolanaAirdropResponse defines the expected response from solana-api
type SolanaAirdropResponse struct {
	Message   string `json:"message"`
	Signature string `json:"signature,omitempty"`
	Error     string `json:"error,omitempty"`
}

// handleClaim is a generic function to process token claims for different presale types and periods.
func (h *PresaleHandler) handleClaim(c *fiber.Ctx, presaleType int, period int) error {
	userID := c.Locals("userID").(uint)

	var user models.User
	if err := h.DB.Preload("Wallets").First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve user", "details": err.Error()})
	}

	if len(user.Wallets) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "User has no registered wallet to receive tokens"})
	}
	targetWalletAddress := user.Wallets[0].Address

	dbTx := h.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			dbTx.Rollback()
		}
	}()

	var presaleCode models.PresaleCode
	if err := dbTx.Set("gorm:query_option", "FOR UPDATE").Where("user_id = ?", userID).First(&presaleCode).Error; err != nil {
		dbTx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Presale code not found for user"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve presale code", "details": err.Error()})
	}

	if presaleCode.Type != presaleType {
		dbTx.Rollback()
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Not eligible for this presale type claim"})
	}
	if !presaleCode.Redeemed {
		dbTx.Rollback()
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Presale code not yet redeemed"})
	}

	// Check if already claimed
	alreadyClaimed := false
	switch {
	case presaleType == 1 && period == 1:
		alreadyClaimed = presaleCode.TokensClaimedP1P1
	case presaleType == 1 && period == 2:
		alreadyClaimed = presaleCode.TokensClaimedP1P2
	case presaleType == 2:
		alreadyClaimed = presaleCode.TokensClaimedP2
	}
	if alreadyClaimed {
		dbTx.Rollback()
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Tokens for this period already claimed"})
	}

	// Call Solana API to airdrop tokens
	airdropPayload := SolanaAirdropRequest{RecipientAddress: targetWalletAddress}
	payloadBytes, err := json.Marshal(airdropPayload)
	if err != nil {
		dbTx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to prepare airdrop request", "details": err.Error()})
	}

	solanaAPIEndpoint := h.SolanaAPIURL + "/api/token/airdrop"
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Post(solanaAPIEndpoint, "application/json", bytes.NewBuffer(payloadBytes))
	if err != nil {
		dbTx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to call Solana API", "details": err.Error()})
	}
	defer resp.Body.Close()

	var solanaResp SolanaAirdropResponse
	if err := json.NewDecoder(resp.Body).Decode(&solanaResp); err != nil {
		dbTx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to decode Solana API response", "details": err.Error()})
	}

	if resp.StatusCode != http.StatusOK || solanaResp.Error != "" {
		dbTx.Rollback()
		return c.Status(resp.StatusCode).JSON(fiber.Map{
			"error":              "Airdrop failed on Solana API",
			"solana_api_message": solanaResp.Message,
			"solana_api_error":   solanaResp.Error,
		})
	}

	// Update presale code status
	switch {
	case presaleType == 1 && period == 1:
		presaleCode.TokensClaimedP1P1 = true
	case presaleType == 1 && period == 2:
		presaleCode.TokensClaimedP1P2 = true
	case presaleType == 2:
		presaleCode.TokensClaimedP2 = true
	}

	if err := dbTx.Save(&presaleCode).Error; err != nil {
		dbTx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update presale code claim status", "details": err.Error()})
	}

	if err := dbTx.Commit().Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to commit transaction", "details": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message":   fmt.Sprintf("Tokens for Presale %d, Period %d claimed successfully", presaleType, period),
		"signature": solanaResp.Signature,
	})
}

// ClaimPresaleP1P1 handles the claim for the first period of Presale Type 1.
func (h *PresaleHandler) ClaimPresaleP1P1(c *fiber.Ctx) error {
	return h.handleClaim(c, 1, 1)
}

// ClaimPresaleP1P2 handles the claim for the second period of Presale Type 1.
func (h *PresaleHandler) ClaimPresaleP1P2(c *fiber.Ctx) error {
	return h.handleClaim(c, 1, 2)
}

// ClaimPresaleP2 handles the claiming of tokens for Presale 2.
func (h *PresaleHandler) ClaimPresaleP2(c *fiber.Ctx) error {
	return h.handleClaim(c, 2, 0) // For P2, period is irrelevant, can be 0 or 1
}

