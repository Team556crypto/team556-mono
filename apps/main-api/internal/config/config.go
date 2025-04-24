package config

import (
	"log"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

// Config holds the application configuration
type Config struct {
	DatabaseURL  string
	JWTSecret    string
	SolanaAPIURL string
}

// LoadConfig loads environment variables from the .env file at the project root.
func LoadConfig() (*Config, error) {
	// Determine the path to the root .env file relative to the application's CWD
	// When running `go run cmd/api/main.go` from `apps/main-api`, the CWD is `apps/main-api`.
	// We need to go up two levels to reach the monorepo root.
	rootEnvPath := filepath.Join("..", "..", ".env")
	err := godotenv.Load(rootEnvPath)
	if err != nil {
		// Log a more specific warning if the file isn't found
		if os.IsNotExist(err) {
			log.Printf("Warning: root .env file not found at expected path %s", rootEnvPath)
		} else {
			log.Printf("Warning: error loading root .env file from %s: %v", rootEnvPath, err)
		}
	}

	cfg := &Config{
		DatabaseURL:  os.Getenv("MAIN_API__DB_DIRECT"),
		JWTSecret:    os.Getenv("MAIN_API__JWT_SECRET"),
		SolanaAPIURL: os.Getenv("MAIN_API__SOLANA_API_URL"),
	}

	if cfg.DatabaseURL == "" {
		log.Fatal("Error: MAIN_API__DB_DIRECT environment variable not set.")
	}
	if cfg.JWTSecret == "" {
		log.Fatal("Error: MAIN_API_JWT_SECRET environment variable not set.")
	}
	if cfg.SolanaAPIURL == "" {
		log.Fatal("Error: MAIN_API__SOLANA_API_URL environment variable not set.")
	}

	return cfg, nil
}

// GetEnv retrieves an environment variable or returns a default value.
func GetEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
