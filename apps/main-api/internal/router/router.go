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
	app.Use(logger.New())

	// CORS Middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, HEAD, PUT, DELETE, PATCH, OPTIONS",
	}))

	api := app.Group("/api")

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(db, cfg.JWTSecret, emailClient)
	swapHandler := handlers.NewSwapHandler(db, cfg)

	// Groups Routes
	auth := api.Group("/auth")
	wallet := api.Group("/wallet")
	swap := api.Group("/swap", middleware.AuthMiddleware(cfg.JWTSecret))
	firearms := api.Group("/firearms")

	// Auth Routes
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)
	auth.Post("/logout", authHandler.Logout)
	auth.Get("/me", middleware.AuthMiddleware(cfg.JWTSecret), authHandler.GetMe)
	auth.Post("/verify-email", middleware.AuthMiddleware(cfg.JWTSecret), authHandler.VerifyEmail)
	auth.Post("/resend-verification", middleware.AuthMiddleware(cfg.JWTSecret), authHandler.ResendVerificationEmail)

	// Wallet Routes
	wallet.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	wallet.Post("/create", handlers.CreateWalletHandler(db, cfg))
	wallet.Get("/balance", handlers.GetWalletBalanceHandler(db, cfg))
	wallet.Get("/balance/team", handlers.GetWalletTeamTokenBalanceHandler(db, cfg))
	wallet.Post("/presale/check", handlers.CheckPresaleCode(db))
	wallet.Post("/presale/redeem", handlers.RedeemPresaleCode(db))
	wallet.Post("/sign-transaction", handlers.SignTransactionHandler(db, cfg))
	wallet.Post("/recovery-phrase", handlers.GetRecoveryPhraseHandler(db))

	// Swap Routes
	swap.Post("/quote", swapHandler.HandleGetSwapQuote)
	swap.Post("/execute", swapHandler.HandleExecuteSwap)
	swap.Post("/create-token-accounts", swapHandler.HandleCreateTokenAccounts)

	// --- Firearm Routes ---
	firearms.Post("/", handlers.CreateFirearmHandler(db, cfg))
	firearms.Get("/", handlers.GetFirearmsHandler(db, cfg))
	firearms.Get("/:id", handlers.GetFirearmByIDHandler(db, cfg))
	firearms.Put("/:id", handlers.UpdateFirearmHandler(db, cfg))
	firearms.Delete("/:id", handlers.DeleteFirearmHandler(db, cfg)) 

	// --- Add other route groups here ---
}
