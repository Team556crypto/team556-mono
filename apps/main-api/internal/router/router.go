package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/team556-mono/server/internal/config"
	"github.com/team556-mono/server/internal/email"
	"github.com/team556-mono/server/internal/handlers"
	"github.com/team556-mono/server/internal/middleware"
	"gorm.io/gorm"
)

func SetupRoutes(app *fiber.App, db *gorm.DB, cfg *config.Config, emailClient *email.Client) {
	// Middleware
	app.Use(logger.New()) // Request logging

	// CORS Middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*", // Reverted back to wildcard for now
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, HEAD, PUT, DELETE, PATCH, OPTIONS",
	}))

	api := app.Group("/api")

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(db, cfg.JWTSecret, emailClient) // Pass emailClient
	swapHandler := handlers.NewSwapHandler(db, cfg)                        // Instantiate Swap Handler

	// Groups Routes
	auth := api.Group("/auth")
	wallet := api.Group("/wallet")
	swap := api.Group("/swap", middleware.AuthMiddleware(cfg.JWTSecret)) // Create Swap Group
	firearms := api.Group("/firearms")

	// Auth Routes
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)
	auth.Post("/logout", authHandler.Logout)
	auth.Get("/me", middleware.AuthMiddleware(cfg.JWTSecret), authHandler.GetMe)
	auth.Post("/verify-email", middleware.AuthMiddleware(cfg.JWTSecret), authHandler.VerifyEmail)
	auth.Post("/resend-verification", middleware.AuthMiddleware(cfg.JWTSecret), authHandler.ResendVerificationEmail) // New route

	// Wallet Routes
	wallet.Use(middleware.AuthMiddleware(cfg.JWTSecret)) // Protect all wallet routes
	wallet.Post("/create", handlers.CreateWalletHandler(db, cfg))
	wallet.Get("/balance", handlers.GetWalletBalanceHandler(db, cfg))
	wallet.Get("/balance/team", handlers.GetWalletTeamTokenBalanceHandler(db, cfg))
	wallet.Post("/presale/check", handlers.CheckPresaleCode(db))               // Correct handler name
	wallet.Post("/presale/redeem", handlers.RedeemPresaleCode(db))             // Correct handler name
	wallet.Post("/sign-transaction", handlers.SignTransactionHandler(db, cfg)) // Add back cfg argument
	wallet.Post("/recovery-phrase", handlers.GetRecoveryPhraseHandler(db))     // View recovery phrase

	// Swap Routes
	swap.Post("/quote", swapHandler.HandleGetSwapQuote)                        // Route for getting quote
	swap.Post("/execute", swapHandler.HandleExecuteSwap)                       // Route for executing swap
	swap.Post("/create-token-accounts", swapHandler.HandleCreateTokenAccounts) // Route for submitting signed token account tx

	// --- Firearm Routes ---
	firearms.Post("/", handlers.CreateFirearmHandler(db))
	firearms.Get("/", handlers.GetFirearmsHandler(db))
	firearms.Get("/:id", handlers.GetFirearmByIDHandler(db))
	firearms.Put("/:id", handlers.UpdateFirearmHandler(db))
	firearms.Delete("/:id", handlers.DeleteFirearmHandler(db))

	// Swagger UI
	// (Ensure swagger setup is correct if you have it)
}
