package config

import (
	"log"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

// LoadConfig loads environment variables from the .env file at the project root.
func LoadConfig() {
	// Determine the path to the root .env file relative to the application's CWD
	// When running `go run cmd/api/main.go` from `apps/main-api`, the CWD is `apps/main-api`.
	// We need to go up two levels to reach the monorepo root.
	rootEnvPath := filepath.Join("..", "..", ".env") // Corrected path: up 2 levels from CWD
	err := godotenv.Load(rootEnvPath)
	if err != nil {
		// Log a more specific warning if the file isn't found
		if os.IsNotExist(err) {
			log.Printf("Warning: root .env file not found at expected path %s", rootEnvPath)
		} else {
			log.Printf("Warning: error loading root .env file from %s: %v", rootEnvPath, err)
		}
	}
}

// GetEnv retrieves an environment variable or returns a default value.
func GetEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
