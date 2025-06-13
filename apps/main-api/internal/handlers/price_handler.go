package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/team556-mono/server/internal/config"
	"github.com/gofiber/fiber/v2"
)

// PriceHandler handles price-related requests.
type PriceHandler struct {
	Config *config.Config
}

// NewPriceHandler creates a new PriceHandler.
func NewPriceHandler(cfg *config.Config) *PriceHandler {
	return &PriceHandler{Config: cfg}
}

// AlchemyTokenPriceRequest defines the structure for Alchemy's token price API request.
type AlchemyTokenPriceRequest struct {
	Addresses []AlchemyAddress `json:"addresses"`
}

// AlchemyAddress defines the address and network for the token.
type AlchemyAddress struct {
	Network string `json:"network"`
	Address string `json:"address"`
}

// AlchemyPriceData holds the price information for a token.
type AlchemyPriceData struct {
	Value     string `json:"value"`
	Timestamp int64  `json:"timestamp"` // Unix timestamp
	Currency  string `json:"currency"`
}

// AlchemyTokenPrice holds the token address and its prices.
type AlchemyTokenPrice struct {
	TokenAddress string             `json:"tokenAddress"`
	Prices       []AlchemyPriceData `json:"prices"`
}

// AlchemyTokenPriceResponse defines the structure for Alchemy's token price API response.
type AlchemyTokenPriceResponse struct {
	Data []AlchemyTokenPrice `json:"data"`
}

// Team556PriceResponse is the structure for our API's response.
type Team556PriceResponse struct {
	Token      string `json:"token"`
	PriceUSDC  string `json:"price_usdc"` // Changed to string and renamed
	Currency   string `json:"currency"`
	Source     string `json:"source"`
	Timestamp  int64  `json:"timestamp"` // Renamed from LastUpdate to match WP plugin expectation more closely
}

const (
	team556TokenMint = "AMNfeXpjD6kXyyTDB4LMKzNWypqNHwtgJUACHUmuKLD5"
	alchemyNetwork   = "solana-mainnet"
)

// HandleGetTeam556UsdcPriceAlchemy fetches the TEAM556 price from Alchemy API.
func (h *PriceHandler) HandleGetTeam556UsdcPriceAlchemy(c *fiber.Ctx) error {
	if h.Config.AlchemyAPIKey == "" {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Alchemy API Key is not configured",
		})
	}

	apiURL := fmt.Sprintf("https://api.g.alchemy.com/prices/v1/%s/tokens/by-address", h.Config.AlchemyAPIKey)

	requestBody := AlchemyTokenPriceRequest{
		Addresses: []AlchemyAddress{
			{
				Network: alchemyNetwork,
				Address: team556TokenMint,
			},
		},
	}

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to marshal request body", "details": err.Error()})
	}

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create request to Alchemy API", "details": err.Error()})
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Failed to reach Alchemy API", "details": err.Error()})
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to read response from Alchemy API", "details": err.Error()})
	}

	if resp.StatusCode != http.StatusOK {
		return c.Status(resp.StatusCode).JSON(fiber.Map{
			"error":             "Alchemy API returned an error",
			"alchemy_api_status": resp.StatusCode,
			"alchemy_api_body":   string(bodyBytes), // Be cautious with large bodies
		})
	}

	var alchemyResponse AlchemyTokenPriceResponse
	if err := json.Unmarshal(bodyBytes, &alchemyResponse); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse price response from Alchemy API", "details": err.Error()})
	}

	if len(alchemyResponse.Data) == 0 || len(alchemyResponse.Data[0].Prices) == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Price data not found for TEAM556 token in Alchemy response"})
	}

	priceStr := alchemyResponse.Data[0].Prices[0].Value

	// Validate that priceStr is a valid number string if necessary, though Alchemy should provide valid data.
	// For example, ensure it's not empty or non-numeric if strict validation is needed here.

	apiResponse := Team556PriceResponse{
		Token:      team556TokenMint,
		PriceUSDC:  priceStr, // Use the string directly
		Currency:   alchemyResponse.Data[0].Prices[0].Currency, // Should be USD
		Source:     "alchemy",
		Timestamp:  alchemyResponse.Data[0].Prices[0].Timestamp,
	}

	return c.Status(fiber.StatusOK).JSON(apiResponse)
}
