package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/team556-mono/server/internal/config"
	"github.com/team556-mono/server/internal/database"
	"github.com/team556-mono/server/internal/email"
	"github.com/team556-mono/server/internal/router"
)

func main() {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize database connection
	db, err := database.InitDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Initialize Email Client
	emailClient, err := email.NewClient(cfg.ResendAPIKey)
	if err != nil {
		log.Fatalf("Failed to initialize email client: %v", err)
	}

	// Create Fiber app
	app := fiber.New()

	// Setup routes
	router.SetupRoutes(app, db, cfg, emailClient)

	// Get port from environment or default
	port := config.GetEnv("MAIN_API__PORT", "3000")

	// Start server
	log.Printf("Server starting on port %s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
