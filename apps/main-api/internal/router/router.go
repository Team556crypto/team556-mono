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
	swapHandler := handlers.NewSwapHandler(db, cfg) // Instantiate Swap Handler

	// Groups Routes
	auth := api.Group("/auth")
	wallet := api.Group("/wallet")
	swap := api.Group("/swap") // Create Swap Group

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
	wallet.Post("/check-presale-code", handlers.CheckPresaleCode(db))
	wallet.Post("/redeem-presale-code", handlers.RedeemPresaleCode(db))
	wallet.Post("/sign", handlers.SignTransactionHandler(db, cfg)) // Route for transaction signing

	// Swap Routes
	swap.Use(middleware.AuthMiddleware(cfg.JWTSecret)) // Protect swap routes
	swap.Post("/quote", swapHandler.HandleGetSwapQuote) // Route for getting quote
	swap.Post("/execute", swapHandler.HandleExecuteSwap) // Route for executing swap
}
