package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger" // Added logger middleware
	"github.com/team556-mono/server/internal/handlers"
)

// SetupRoutes configures the Fiber application and defines API routes.
func SetupRoutes(app *fiber.App) {
	// Middleware
	app.Use(logger.New()) // Add request logging

	// Group API routes
	api := app.Group("/api") // Example: Group routes under /api

	// Define routes
	api.Get("/", handlers.HelloWorld) // Maps GET /api/ to HelloWorld handler

	// Add more routes here...
	// api.Get("/products", handlers.GetProducts)
	// api.Post("/products", handlers.CreateProduct)
}
