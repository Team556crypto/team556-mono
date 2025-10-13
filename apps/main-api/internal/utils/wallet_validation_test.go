package utils

import (
	"testing"
)

func TestIsValidSolanaAddress(t *testing.T) {
	tests := []struct {
		name    string
		address string
		want    bool
	}{
		{
			name:    "Valid Solana address",
			address: "11111111111111111111111111111112", // System Program ID
			want:    true,
		},
		{
			name:    "Valid long Solana address",
			address: "So11111111111111111111111111111111111111112", // Wrapped SOL
			want:    true,
		},
		{
			name:    "Empty address",
			address: "",
			want:    false,
		},
		{
			name:    "Too short address",
			address: "123456789",
			want:    false,
		},
		{
			name:    "Too long address",
			address: "123456789012345678901234567890123456789012345", // 45 chars
			want:    false,
		},
		{
			name:    "Invalid characters",
			address: "1111111111111111111111111111111O", // Contains 'O' which is invalid in base58
			want:    false,
		},
		{
			name:    "Invalid characters (lowercase L)",
			address: "1111111111111111111111111111111l", // Contains 'l' which is invalid in base58
			want:    false,
		},
		{
			name:    "Invalid characters (zero)",
			address: "1111111111111111111111111111111110", // Contains '0' which is invalid in base58
			want:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := IsValidSolanaAddress(tt.address); got != tt.want {
				t.Errorf("IsValidSolanaAddress() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestValidateWalletAddress(t *testing.T) {
	tests := []struct {
		name    string
		address string
		wantErr bool
	}{
		{
			name:    "Valid address",
			address: "11111111111111111111111111111112",
			wantErr: false,
		},
		{
			name:    "Valid address with whitespace",
			address: "  11111111111111111111111111111112  ",
			wantErr: false,
		},
		{
			name:    "Empty address",
			address: "",
			wantErr: true,
		},
		{
			name:    "Whitespace only",
			address: "   ",
			wantErr: true,
		},
		{
			name:    "Invalid address",
			address: "invalid-address",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateWalletAddress(tt.address)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateWalletAddress() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestNormalizeWalletAddress(t *testing.T) {
	tests := []struct {
		name    string
		address string
		want    string
	}{
		{
			name:    "No whitespace",
			address: "11111111111111111111111111111112",
			want:    "11111111111111111111111111111112",
		},
		{
			name:    "Leading whitespace",
			address: "  11111111111111111111111111111112",
			want:    "11111111111111111111111111111112",
		},
		{
			name:    "Trailing whitespace",
			address: "11111111111111111111111111111112  ",
			want:    "11111111111111111111111111111112",
		},
		{
			name:    "Both leading and trailing whitespace",
			address: "  11111111111111111111111111111112  ",
			want:    "11111111111111111111111111111112",
		},
		{
			name:    "Empty string",
			address: "",
			want:    "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := NormalizeWalletAddress(tt.address); got != tt.want {
				t.Errorf("NormalizeWalletAddress() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestFormatAddressForDisplay(t *testing.T) {
	tests := []struct {
		name         string
		address      string
		prefixLength int
		suffixLength int
		want         string
	}{
		{
			name:         "Normal formatting",
			address:      "11111111111111111111111111111112",
			prefixLength: 6,
			suffixLength: 4,
			want:         "111111...1112",
		},
		{
			name:         "Short address (no truncation needed)",
			address:      "123456789",
			prefixLength: 6,
			suffixLength: 4,
			want:         "123456789",
		},
		{
			name:         "Empty address",
			address:      "",
			prefixLength: 6,
			suffixLength: 4,
			want:         "",
		},
		{
			name:         "Address equal to prefix + suffix + ellipsis length",
			address:      "1234567890", // 10 chars = 6 + 4
			prefixLength: 6,
			suffixLength: 4,
			want:         "1234567890", // Should not truncate
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := FormatAddressForDisplay(tt.address, tt.prefixLength, tt.suffixLength); got != tt.want {
				t.Errorf("FormatAddressForDisplay() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestIsAddressEqual(t *testing.T) {
	tests := []struct {
		name  string
		addr1 string
		addr2 string
		want  bool
	}{
		{
			name:  "Identical addresses",
			addr1: "11111111111111111111111111111112",
			addr2: "11111111111111111111111111111112",
			want:  true,
		},
		{
			name:  "One with whitespace",
			addr1: "  11111111111111111111111111111112  ",
			addr2: "11111111111111111111111111111112",
			want:  true,
		},
		{
			name:  "Both with whitespace",
			addr1: "  11111111111111111111111111111112  ",
			addr2: "   11111111111111111111111111111112   ",
			want:  true,
		},
		{
			name:  "Different addresses",
			addr1: "11111111111111111111111111111112",
			addr2: "11111111111111111111111111111113",
			want:  false,
		},
		{
			name:  "Empty addresses",
			addr1: "",
			addr2: "",
			want:  true,
		},
		{
			name:  "One empty",
			addr1: "11111111111111111111111111111112",
			addr2: "",
			want:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := IsAddressEqual(tt.addr1, tt.addr2); got != tt.want {
				t.Errorf("IsAddressEqual() = %v, want %v", got, tt.want)
			}
		})
	}
}