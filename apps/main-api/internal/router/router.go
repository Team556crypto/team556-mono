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
	"github.com/team556-mono/server/internal/security"
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
	referralHandler := handlers.NewReferralHandler(db)

	// Groups Routes
	auth := api.Group("/auth")
	wallet := api.Group("/wallet")
	swap := api.Group("/swap", middleware.AuthMiddleware(cfg.JWTSecret))
	firearms := api.Group("/firearms", middleware.AuthMiddleware(cfg.JWTSecret))
	ammos := api.Group("/ammos", middleware.AuthMiddleware(cfg.JWTSecret))
	gear := api.Group("/gear", middleware.AuthMiddleware(cfg.JWTSecret))
	presale := api.Group("/presale", middleware.AuthMiddleware(cfg.JWTSecret))
	distributorsGroup := api.Group("/distributors", middleware.AuthMiddleware(cfg.JWTSecret))
	distConnGroup := api.Group("/distributor-connections", middleware.AuthMiddleware(cfg.JWTSecret))
	notifications := api.Group("/notifications", middleware.AuthMiddleware(cfg.JWTSecret))
	referrals := api.Group("/referrals", middleware.AuthMiddleware(cfg.JWTSecret))
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
	
	// Public referral validation endpoint (for signup process)
	api.Post("/referrals/validate", referralHandler.ValidateReferralCode)

	// Auth Routes
	auth.Post("/register", authHandler.Register)
	auth.Post("/signup", authHandler.Register)
	auth.Post("/login", limiter.New(security.SensitiveLimiter(10, time.Minute)), authHandler.Login)
	auth.Post("/logout", authHandler.Logout)
	auth.Get("/me", middleware.AuthMiddleware(cfg.JWTSecret), authHandler.GetMe)
	auth.Post("/verify-email", middleware.AuthMiddleware(cfg.JWTSecret), authHandler.VerifyEmail)
	auth.Post("/resend-verification", middleware.AuthMiddleware(cfg.JWTSecret), authHandler.ResendVerificationEmail)
	auth.Post("/delete-account", middleware.AuthMiddleware(cfg.JWTSecret), authHandler.DeleteAccount)

	// Security routes under /me
	me := api.Group("/me", middleware.AuthMiddleware(cfg.JWTSecret))
	secHandler := handlers.NewSecurityHandler(db, cfg, emailClient)
	me.Get("/security", secHandler.GetSecurityOverview)
	// Apply rate limiting for sensitive routes
	me.Post("/password", limiter.New(security.SensitiveLimiter(5, time.Minute)), secHandler.ChangePassword)
	me.Post("/mfa/totp/setup", limiter.New(security.SensitiveLimiter(10, time.Minute)), secHandler.BeginTOTPSetup)
	me.Post("/mfa/totp/enable", limiter.New(security.SensitiveLimiter(10, time.Minute)), secHandler.EnableTOTP)
	me.Post("/mfa/verify", limiter.New(security.SensitiveLimiter(20, time.Minute)), secHandler.VerifyMFA)
	me.Delete("/mfa", limiter.New(security.SensitiveLimiter(5, time.Minute)), secHandler.DisableMFA)
	me.Post("/mfa/recovery/rotate", limiter.New(security.SensitiveLimiter(5, time.Minute)), secHandler.RotateRecoveryCodes)
	me.Get("/sessions", secHandler.ListSessions)
	me.Delete("/sessions/:id", secHandler.RevokeSession)

	// Distributor Routes
	distributorHandler := handlers.NewDistributorHandler(db, cfg)
	distributorsGroup.Get("/", distributorHandler.ListSupported)
	distConnGroup.Get("/", distributorHandler.ListConnections)
	distConnGroup.Post("/", distributorHandler.UpsertConnection)
	distConnGroup.Post("/:code/validate", distributorHandler.ValidateConnection)
	distConnGroup.Get("/:code/settings", distributorHandler.GetSettings)
	distConnGroup.Patch("/:code/settings", distributorHandler.UpdateSettings)
	distConnGroup.Delete("/:code", distributorHandler.DeleteConnection)
	distConnGroup.Post("/:code/sync", distributorHandler.TriggerSync)

	// Notification Routes
	notificationHandler := handlers.NewNotificationHandler(db, cfg)
	notifications.Get("/settings", notificationHandler.GetSettings)
	notifications.Patch("/settings", notificationHandler.UpdateSettings)
notifications.Post("/resend-verification", authHandler.ResendVerificationEmail)
	notifications.Post("/push/devices", notificationHandler.RegisterPushDevice)
	notifications.Delete("/push/devices", notificationHandler.UnregisterPushDevice)
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

	// POS Wallet Routes (for configuring receiving addresses)
	posWallet := api.Group("/pos-wallet", middleware.AuthMiddleware(cfg.JWTSecret))
	posWallet.Get("/addresses", handlers.GetPOSWalletAddressesHandler(db))
	posWallet.Patch("/primary", handlers.UpdatePrimaryWalletAddressHandler(db))
	posWallet.Patch("/secondary", handlers.UpdateSecondaryWalletAddressHandler(db))
	posWallet.Post("/validate", handlers.ValidateWalletAddressHandler(db))
	posWallet.Get("/health", handlers.GetWalletAddressHealthHandler(db))

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

	// --- Ammo Routes ---
	ammos.Post("/", handlers.CreateAmmoHandler(db, cfg))
	ammos.Get("/", handlers.GetAmmosHandler(db, cfg))
	ammos.Get("/:id", handlers.GetAmmoByIDHandler(db, cfg))
	ammos.Patch("/:id", handlers.UpdateAmmoHandler(db, cfg))
	ammos.Delete("/:id", handlers.DeleteAmmoHandler(db, cfg))

	// --- Gear Routes ---
	gear.Post("/", handlers.CreateGearHandler(db, cfg))
	gear.Get("/", handlers.GetGearsHandler(db, cfg))
	gear.Get("/:id", handlers.GetGearByIDHandler(db, cfg))
	gear.Put("/:id", handlers.UpdateGearHandler(db, cfg))
	gear.Delete("/:id", handlers.DeleteGearHandler(db, cfg))

	// --- Documents Routes ---
	documents := api.Group("/documents", middleware.AuthMiddleware(cfg.JWTSecret))
	documents.Post("/", handlers.CreateDocumentHandler(db, cfg))
	documents.Get("/", handlers.GetDocumentsHandler(db, cfg))
	documents.Get("/:id", handlers.GetDocumentByIDHandler(db, cfg))
	documents.Put("/:id", handlers.UpdateDocumentHandler(db, cfg))
	documents.Delete("/:id", handlers.DeleteDocumentHandler(db, cfg))

	// --- NFA Routes ---
	nfa := api.Group("/nfa", middleware.AuthMiddleware(cfg.JWTSecret))
	nfa.Post("/", handlers.CreateNFAHandler(db, cfg))
	nfa.Get("/", handlers.GetNFAItemsHandler(db, cfg))
	nfa.Get("/:id", handlers.GetNFAByIDHandler(db, cfg))
	nfa.Put("/:id", handlers.UpdateNFAHandler(db, cfg))
	nfa.Delete("/:id", handlers.DeleteNFAHandler(db, cfg))

	// --- Presale Routes ---
	presale.Get("/claim-status", presaleHandler.GetPresaleClaimStatus)
	presale.Post("/claim/p1p1", presaleHandler.ClaimPresaleP1P1)
	presale.Post("/claim/p1p2", presaleHandler.ClaimPresaleP1P2)
	presale.Post("/claim/p2", presaleHandler.ClaimPresaleP2)

	// --- Referral Routes ---
	referrals.Get("/code", referralHandler.GenerateReferralCode)       // Get or generate referral code
	referrals.Post("/code/regenerate", referralHandler.RegenerateReferralCode) // Generate new referral code
	referrals.Get("/stats", referralHandler.GetReferralStats)          // Get referral statistics
	referrals.Get("/history", referralHandler.GetReferralHistory)      // Get referral history with pagination

	// --- Solana RPC proxy ---
	v1.Post("/solana/rpc", handlers.SolanaRpcProxy)
	api.Post("/solana/rpc", handlers.SolanaRpcProxy) // direct without version prefix to match existing clients

	// Payment request helper
	v1.Post("/solana/payment-request", handlers.HandleCreateSolanaPaymentRequest)
}
