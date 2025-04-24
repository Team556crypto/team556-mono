package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/team556-mono/server/internal/config"
	"github.com/team556-mono/server/internal/database"
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

	// Create Fiber app
	app := fiber.New()

	// Setup routes
	router.SetupRoutes(app, db, cfg)

	// Get port from environment or default
	port := config.GetEnv("MAIN_API__PORT", "3000")

	log.Printf("Starting server on port %s...", port)
	// Start server
	err = app.Listen(":" + port)
	if err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
