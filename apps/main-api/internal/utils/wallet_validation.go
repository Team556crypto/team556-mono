package utils

import (
	"fmt"
	"strings"

	"github.com/mr-tron/base58"
)

// IsValidSolanaAddress validates a Solana wallet address format
func IsValidSolanaAddress(address string) bool {
	// Solana addresses are base58 encoded and typically 44 characters long
	if len(address) < 32 || len(address) > 44 {
		return false
	}

	// Try to decode base58 - if it fails, it's not a valid address
	decoded, err := base58.Decode(address)
	if err != nil || len(decoded) != 32 {
		return false
	}

	// Additional validation: check if it contains only valid base58 characters
	validChars := "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
	for _, char := range address {
		if !strings.ContainsRune(validChars, char) {
			return false
		}
	}

	return true
}

// ValidateWalletAddress performs comprehensive wallet address validation
func ValidateWalletAddress(address string) error {
	if address == "" {
		return fmt.Errorf("address cannot be empty")
	}

	// Trim whitespace
	address = strings.TrimSpace(address)

	if !IsValidSolanaAddress(address) {
		return fmt.Errorf("invalid Solana wallet address format")
	}

	return nil
}

// NormalizeWalletAddress normalizes a wallet address by trimming whitespace
func NormalizeWalletAddress(address string) string {
	return strings.TrimSpace(address)
}

// FormatAddressForDisplay formats a wallet address for display purposes (truncated)
func FormatAddressForDisplay(address string, prefixLength, suffixLength int) string {
	if address == "" {
		return ""
	}

	if len(address) <= prefixLength+suffixLength+3 {
		return address
	}

	return fmt.Sprintf("%s...%s", 
		address[:prefixLength], 
		address[len(address)-suffixLength:])
}

// IsAddressEqual compares two wallet addresses (case-sensitive, whitespace-trimmed)
func IsAddressEqual(addr1, addr2 string) bool {
	return NormalizeWalletAddress(addr1) == NormalizeWalletAddress(addr2)
}