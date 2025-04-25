package handlers

import (
	"crypto/rand"
	"log"
	"math/big"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/team556-mono/server/internal/models"
	"github.com/team556-mono/server/internal/middleware"
	"errors"
)

// AuthHandler holds dependencies for authentication handlers
type AuthHandler struct {
	DB        *gorm.DB
	JWTSecret []byte
	Validate  *validator.Validate
}

// NewAuthHandler creates a new AuthHandler
func NewAuthHandler(db *gorm.DB, jwtSecret string) *AuthHandler {
	return &AuthHandler{
		DB:        db,
		JWTSecret: []byte(jwtSecret),
		Validate:  validator.New(),
	}
}

// RegisterInput defines the expected input for registration
type RegisterInput struct {
	Email     string `json:"email" validate:"required,email"`
	Password  string `json:"password" validate:"required,min=8"`
	FirstName string `json:"first_name" validate:"omitempty"`
	LastName  string `json:"last_name" validate:"omitempty"`
}

// LoginInput defines the expected input for login
type LoginInput struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// LoginResponse defines the successful login/register response structure
type LoginResponse struct {
	Token string       `json:"token"`
	User  models.User `json:"user"`
}

const codeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

// generateUserCode creates a random alphanumeric string of the specified length.
func generateUserCode(length int) (string, error) {
	var builder strings.Builder
	charSetLen := big.NewInt(int64(len(codeChars)))
	for i := 0; i < length; i++ {
		randomIndex, err := rand.Int(rand.Reader, charSetLen)
		if err != nil {
			return "", err // Return error if random number generation fails
		}
		builder.WriteByte(codeChars[randomIndex.Int64()])
	}
	return builder.String(), nil
}

// Register handles user registration
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	input := new(RegisterInput)
	if err := c.BodyParser(input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	// Validate the input struct
	if err := h.Validate.Struct(input); err != nil {
		// Log the specific validation error details on the backend
		log.Printf("Validation failed for registration: %v. Input received: %+v", err, input)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Validation failed", "details": err.Error()})
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Error hashing password: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not process registration"})
	}

	// Generate User Code
	userCode, err := generateUserCode(8) // Generate 8-character code
	if err != nil {
		log.Printf("Error generating user code: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not process registration due to code generation failure"})
	}

	// Create user model
	user := models.User{
		Email:     strings.ToLower(input.Email),
		Password:  string(hashedPassword),
		FirstName: input.FirstName,
		LastName:  input.LastName,
		UserCode:  userCode, // Assign generated code
	}

	// Save user to database
	if result := h.DB.Create(&user); result.Error != nil {
		log.Printf("Error creating user: %v", result.Error)
		if strings.Contains(result.Error.Error(), "UNIQUE constraint failed") || strings.Contains(result.Error.Error(), "duplicate key value violates unique constraint") {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Email or generated code already exists"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not register user"})
	}

	// --- Generate JWT Token ---
	claims := middleware.CustomClaims{
		UserID: user.ID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 72)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   user.Email,
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	t, err := token.SignedString(h.JWTSecret)
	if err != nil {
		log.Printf("Error signing token after registration: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Registration successful, but failed to generate token"})
	}

	// --- Prepare Response ---
	// Preload wallets before sending the response
	if err := h.DB.Preload("Wallets").First(&user, user.ID).Error; err != nil {
		log.Printf("Warning: Failed to preload wallets for user %d after registration: %v", user.ID, err)
		// Decide if this should be fatal or just log a warning
		// Non-fatal for now, but might indicate an issue
	}

	user.Password = ""

	response := LoginResponse{
		Token: t,
		User:  user,
	}

	return c.Status(fiber.StatusCreated).JSON(response)
}

// Login handles user login
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	input := new(LoginInput)
	if err := c.BodyParser(input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	// Validate the input struct
	if err := h.Validate.Struct(input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Validation failed", "details": err.Error()})
	}

	// Find user by email (case-insensitive search)
	var user models.User
	if result := h.DB.Where("LOWER(email) = LOWER(?)", input.Email).First(&user); result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
		}
		log.Printf("Error finding user: %v", result.Error)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Login failed"})
	}

	// Compare hashed password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	// --- Generate JWT Token ---
	claims := middleware.CustomClaims{
		UserID: user.ID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 72)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   user.Email,
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	t, err := token.SignedString(h.JWTSecret)
	if err != nil {
		log.Printf("Error signing token: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not generate token"})
	}

	// --- Prepare Response ---
	// Preload wallets before sending the response
	if err := h.DB.Preload("Wallets").First(&user, user.ID).Error; err != nil {
		log.Printf("Warning: Failed to preload wallets for user %d after login: %v", user.ID, err)
		// Non-fatal, but log the warning
	}

	user.Password = ""

	response := LoginResponse{
		Token: t,
		User:  user,
	}

	return c.JSON(response)
}

// Logout handles user logout (currently a placeholder)
// In a stateless JWT setup, logout is primarily handled client-side by discarding the token.
// This endpoint can be used for logging or future stateful token invalidation.
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	// TODO: Implement token blocklisting or session invalidation if needed in the future
	log.Println("Logout request received.") // Added basic logging
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Logout successful"})
}

// GetMe fetches the currently authenticated user's profile
func (h *AuthHandler) GetMe(c *fiber.Ctx) error {
	// Retrieve userID set by the AuthMiddleware
	userIDInterface := c.Locals("userID")
	userID, ok := userIDInterface.(uint)
	if !ok {
		log.Printf("Error: Invalid or missing userID in context for GetMe")
		// This suggests an issue with middleware or how it sets the context
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not identify user"})
	}

	var user models.User
	// Fetch user and crucially preload their wallets
	if err := h.DB.Preload("Wallets").First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
		}
		log.Printf("Error fetching user %d for GetMe: %v", userID, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not retrieve user profile"})
	}

	// Clear sensitive information before sending
	user.Password = ""

	return c.JSON(user)
}
