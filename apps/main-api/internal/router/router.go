package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/team556-mono/server/internal/config"
	"github.com/team556-mono/server/internal/email"
	"github.com/team556-mono/server/internal/handlers"
	"github.com/team556-mono/server/internal/middleware"
	"gorm.io/gorm"
	"time"
)

func SetupRoutes(app *fiber.App, db *gorm.DB, cfg *config.Config, emailClient *email.Client) {
	// Middleware
	app.Use(logger.New())

	// CORS Middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization, solana-client, Solana-Client",
		AllowMethods: "GET, POST, HEAD, PUT, DELETE, PATCH, OPTIONS",
	}))

	api := app.Group("/api")

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(db, cfg.JWTSecret, emailClient)
	swapHandler := handlers.NewSwapHandler(db, cfg)
	priceHandler := handlers.NewPriceHandler(cfg)
	presaleHandler := handlers.NewPresaleHandler(db, cfg.JWTSecret, cfg.SolanaAPIURL)

	// Groups Routes
	auth := api.Group("/auth")
	wallet := api.Group("/wallet")
	swap := api.Group("/swap", middleware.AuthMiddleware(cfg.JWTSecret))
	firearms := api.Group("/firearms", middleware.AuthMiddleware(cfg.JWTSecret))
	presale := api.Group("/presale", middleware.AuthMiddleware(cfg.JWTSecret))
	v1 := api.Group("/v1")

	// Public, Rate-Limited Routes
	// Price endpoint (unauthenticated, rate-limited)
	priceLimiter := limiter.New(limiter.Config{
		Max:        10, // Max requests per duration
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP() // Use IP address for rate limiting
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "Too many requests, please try again later.",
			})
		},
	})
	api.Get("/price/team556-usdc", priceLimiter, priceHandler.HandleGetTeam556UsdcPriceAlchemy)

	// Auth Routes
	auth.Post("/register", authHandler.Register)
	auth.Post("/signup", authHandler.Register)
	auth.Post("/login", authHandler.Login)
	auth.Post("/logout", authHandler.Logout)
	auth.Get("/me", middleware.AuthMiddleware(cfg.JWTSecret), authHandler.GetMe)
	auth.Post("/verify-email", middleware.AuthMiddleware(cfg.JWTSecret), authHandler.VerifyEmail)
	auth.Post("/resend-verification", middleware.AuthMiddleware(cfg.JWTSecret), authHandler.ResendVerificationEmail)
	// Password Reset Routes
	auth.Post("/request-password-reset", authHandler.RequestPasswordReset)
	auth.Post("/reset-password", authHandler.ResetPassword)

	// Wallet Routes
	wallet.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	wallet.Post("/create", handlers.CreateWalletHandler(db, cfg))
	wallet.Get("/balance", handlers.GetWalletBalanceHandler(db, cfg))
	wallet.Get("/balance/team", handlers.GetWalletTeamTokenBalanceHandler(db, cfg))
	wallet.Post("/presale/check", handlers.CheckPresaleCode(db))
	wallet.Post("/presale/redeem", handlers.RedeemPresaleCode(db))
	wallet.Post("/sign-transaction", handlers.SignTransactionHandler(db, cfg))
	wallet.Post("/send-transaction", handlers.SendTransactionHandler(db, cfg))
	wallet.Post("/transactions", handlers.GetTransactionsHandler(db, cfg))
	wallet.Post("/webhook", handlers.SendWebhookHandler(db, cfg))
	wallet.Post("/recovery-phrase", handlers.GetRecoveryPhraseHandler(db))

	// Swap Routes
	swap.Post("/quote", swapHandler.HandleGetSwapQuote)
	swap.Post("/execute", swapHandler.HandleExecuteSwap)
	swap.Post("/create-token-accounts", swapHandler.HandleCreateTokenAccounts)

	// --- Firearm Routes ---
	firearms.Post("/", handlers.CreateFirearmHandler(db, cfg))
	firearms.Get("/", handlers.GetFirearmsHandler(db, cfg))
	firearms.Get("/:id", handlers.GetFirearmByIDHandler(db, cfg))
	firearms.Patch("/:id", handlers.UpdateFirearmHandler(db, cfg))
	firearms.Delete("/:id", handlers.DeleteFirearmHandler(db, cfg))

	// --- Presale Routes ---
	presale.Get("/claim-status", presaleHandler.GetPresaleClaimStatus)
	presale.Post("/claim/p1p1", presaleHandler.ClaimPresaleP1P1)
	presale.Post("/claim/p1p2", presaleHandler.ClaimPresaleP1P2)

	// --- Solana RPC proxy ---
	v1.Post("/solana/rpc", handlers.SolanaRpcProxy)
	api.Post("/solana/rpc", handlers.SolanaRpcProxy) // direct without version prefix to match existing clients

	// Payment request helper
	v1.Post("/solana/payment-request", handlers.HandleCreateSolanaPaymentRequest)
}
