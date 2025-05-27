package config

import (
	"log"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

// Config holds the application configuration
type Config struct {
	DatabaseURL       string
	JWTSecret         string
	SolanaAPIURL      string `env:"MAIN_API__SOLANA_API_URL,required"`
	ResendAPIKey      string
	ArmorySecret      string
	UploadthingSecret string // For GLOBAL__UPLOADTHING_SECRET
	UploadthingApiURL string // For GLOBAL__UPLOADTHING_API_URL
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
		DatabaseURL:       os.Getenv("MAIN_API__DB_DIRECT"),
		JWTSecret:         os.Getenv("MAIN_API__JWT_SECRET"),
		SolanaAPIURL:      os.Getenv("MAIN_API__SOLANA_API_URL"),
		ResendAPIKey:      os.Getenv("GLOBAL__RESEND_API_KEY"),
		ArmorySecret:      os.Getenv("MAIN_API__ARMORY_SECRET"),
		UploadthingSecret: os.Getenv("GLOBAL__UPLOADTHING_SECRET"),
		UploadthingApiURL: os.Getenv("GLOBAL__UPLOADTHING_API_URL"), // Or use GetEnv with a default
	}

	if cfg.DatabaseURL == "" {
		log.Fatal("Error: MAIN_API__DB_DIRECT environment variable not set.")
	}
	if cfg.JWTSecret == "" {
		log.Fatal("Error: MAIN_API__JWT_SECRET environment variable not set.")
	}
	if cfg.SolanaAPIURL == "" {
		log.Fatal("Error: MAIN_API__SOLANA_API_URL environment variable not set.")
	}
	if cfg.ResendAPIKey == "" {
		log.Fatal("Error: GLOBAL__RESEND_API_KEY environment variable not set.")
	}
	if cfg.ArmorySecret == "" {
		log.Println("CRITICAL WARNING: MAIN_API__ARMORY_SECRET environment variable not set. Firearm data encryption/decryption will fail.")
		// Decide if the application should start without the secret.
		// For security, it might be better to return an error:
		// return nil, fmt.Errorf("MAIN_API__ARMORY_SECRET environment variable is required for firearm data encryption")
	}
	if cfg.UploadthingSecret == "" {
		log.Println("Warning: GLOBAL__UPLOADTHING_SECRET environment variable not set. Image uploads will fail.")
		// Depending on requirements, you might want to log.Fatal here if uploads are critical
	}
	// cfg.UploadthingApiURL can be optional if there's a fallback in the handler

	return cfg, nil
}

// GetEnv retrieves an environment variable or returns a default value.
func GetEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
