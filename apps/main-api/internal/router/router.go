package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/team556-mono/server/internal/config"
	"github.com/team556-mono/server/internal/handlers"
	"github.com/team556-mono/server/internal/middleware"
	"gorm.io/gorm"
)

// SetupRoutes configures the Fiber application and defines API routes.
func SetupRoutes(app *fiber.App, db *gorm.DB, cfg *config.Config) {
	// Middleware
	app.Use(logger.New()) // Add request logging

	// Add CORS Middleware
	app.Use(cors.New(cors.Config{
		// Allow specific origins - adjust for your development/production needs
		// Using localhost:8081 as the default Expo web dev server port
		AllowOrigins: "http://localhost:8082",
		// Allow specific headers
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		// Allow specific methods
		AllowMethods: "GET, POST, HEAD, PUT, DELETE, PATCH, OPTIONS",
		// Allow credentials (cookies, authorization headers)
		// AllowCredentials: true, // Uncomment if needed
	}))

	// Create an instance of the handlers, passing the database connection
	// We'll create the auth handlers next.
	// h := handlers.New(db) // Placeholder for general handlers if needed
	authHandler := handlers.NewAuthHandler(db, cfg.JWTSecret) // Instantiate AuthHandler

	// Group API routes
	api := app.Group("/api") // Example: Group routes under /api

	// Define routes
	api.Get("/", handlers.HelloWorld) // Maps GET /api/ to HelloWorld handler

	// Auth routes group
	auth := api.Group("/auth")

	// Define auth endpoints (handlers will be created next)
	auth.Post("/register", authHandler.Register) // Connect Register handler
	auth.Post("/login", authHandler.Login)       // Connect Login handler
	auth.Post("/logout", authHandler.Logout)     // Connect Logout handler

	// Add GET /me route, protected by AuthMiddleware
	auth.Get("/me", middleware.AuthMiddleware(cfg.JWTSecret), authHandler.GetMe)

	// Wallet routes group
	wallet := api.Group("/wallet")
	wallet.Use(middleware.AuthMiddleware(cfg.JWTSecret)) // Protect all wallet routes

	// Define wallet endpoints
	wallet.Post("/create", handlers.CreateWalletHandler(db, cfg))
	wallet.Get("/balance", handlers.GetWalletBalanceHandler(db, cfg))
	wallet.Get("/balance/team", handlers.GetWalletTeamTokenBalanceHandler(db, cfg)) // For TEAM Token

	// --- Wallet Routes (Protected) ---
	wallets := api.Group("/wallets")
	// Apply authentication middleware to this group
	wallets.Use(middleware.AuthMiddleware(cfg.JWTSecret))

	// Define wallet endpoints
	wallets.Post("/create", handlers.CreateWalletHandler(db, cfg))

	// Add more routes here...
	// api.Get("/products", handlers.GetProducts)
	// api.Post("/products", handlers.CreateProduct)
	// Add other routes here (e.g., product routes, wallet routes)
	// Example using a handler instance:
	// products := api.Group("/products")
	// products.Get("/", h.GetProducts)
	// products.Post("/", h.CreateProduct)
}
