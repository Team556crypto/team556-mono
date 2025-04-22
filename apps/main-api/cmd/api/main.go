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
	config.LoadConfig()

	// Initialize database connection
	database.InitDatabase()

	// Create Fiber app
	app := fiber.New()

	// Setup routes
	router.SetupRoutes(app)

	// Get port from environment or default
	port := config.GetEnv("MAIN_API__PORT", "3000")

	log.Printf("Starting server on port %s...", port)
	// Start server
	err := app.Listen(":" + port)
	if err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
