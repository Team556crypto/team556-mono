package handlers

import (
	"crypto/rand"
	"errors"
	"fmt"
	"log"
	"math/big"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/team556-mono/server/internal/email"
	"github.com/team556-mono/server/internal/models"
)

// AuthHandler holds dependencies for authentication handlers
type AuthHandler struct {
	DB          *gorm.DB
	JWTSecret   []byte
	Validate    *validator.Validate
	EmailClient *email.Client
}

// NewAuthHandler creates a new AuthHandler
func NewAuthHandler(db *gorm.DB, jwtSecret string, emailClient *email.Client) *AuthHandler {
	return &AuthHandler{
		DB:          db,
		JWTSecret:   []byte(jwtSecret),
		Validate:    validator.New(),
		EmailClient: emailClient,
	}
}

// RegisterRequest defines the expected input for registration
type RegisterRequest struct {
	Email     string `json:"email" validate:"required,email"`
	Password  string `json:"password" validate:"required,min=8"`
	FirstName string `json:"first_name" validate:"omitempty"`
	LastName  string `json:"last_name" validate:"omitempty"`
}

// LoginRequest defines the expected input for login
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// LoginResponse defines the successful login/register response structure
type LoginResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

// generateVerificationCode creates a random numeric string of the specified length.
func generateVerificationCode(length int) (string, error) {
	var builder strings.Builder
	charSetLen := big.NewInt(int64(10))
	for i := 0; i < length; i++ {
		randomIndex, err := rand.Int(rand.Reader, charSetLen)
		if err != nil {
			return "", err // Return error if random number generation fails
		}
		builder.WriteByte('0' + byte(randomIndex.Int64()))
	}
	return builder.String(), nil
}

// Register handles user registration.
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	// 1. Parse Request Body
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// 2. Validate Request Body
	if err := h.Validate.Struct(req); err != nil {
		// Provide more specific validation errors if needed
		errors := err.(validator.ValidationErrors)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Validation failed", "details": formatValidationErrors(errors)})
	}

	// 3. Check if email already exists and is verified
	var existingUser models.User
	err := h.DB.Where("email = ?", strings.ToLower(req.Email)).First(&existingUser).Error
	if err == nil { // User found
		if existingUser.EmailVerified {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Email already registered and verified"})
		}
		// If user exists but not verified, allow re-registration attempt (will overwrite code/expiry)
		log.Printf("Registration attempt for existing unverified user: %s\n", existingUser.Email)
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		// Handle other DB errors
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error checking existing user", "details": err.Error()})
	}
	// If ErrRecordNotFound, proceed to create new user

	// 4. Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to hash password"})
	}

	// 5. Generate verification code
	verificationCode, err := generateVerificationCode(6) // 6-digit code
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate verification code"})
	}
	codePtr := &verificationCode
	expiresAt := time.Now().Add(15 * time.Minute) // Code expires in 15 minutes
	expiresAtPtr := &expiresAt

	// 6. Prepare user data (new or update)
	user := models.User{
		Email:                      strings.ToLower(req.Email),
		Password:                   string(hashedPassword),
		EmailVerified:              false, // Always reset to false on registration/re-attempt
		EmailVerificationCode:      codePtr,
		EmailVerificationExpiresAt: expiresAtPtr,
		FirstName:                  req.FirstName,
		LastName:                   req.LastName,
	}

	// 7. Save or Update user in database
	if existingUser.ID != 0 { // User exists (must be unverified based on check above)
		// Update existing unverified user record with new code/password
		user.ID = existingUser.ID               // Ensure we update the correct record
		user.CreatedAt = existingUser.CreatedAt // Keep original creation time
		if err := h.DB.Save(&user).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update user registration", "details": err.Error()})
		}
		log.Printf("Updated verification code for existing unverified user: %s\n", user.Email)
	} else { // User does not exist, create new
		if err := h.DB.Create(&user).Error; err != nil {
			// Handle potential unique constraint violation again (race condition?)
			if strings.Contains(err.Error(), "duplicate key value violates unique constraint") || strings.Contains(err.Error(), "UNIQUE constraint failed") {
				return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Email already registered"})
			}
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to register user", "details": err.Error()})
		}
		log.Printf("Created new user requires verification: %s\n", user.Email)
	}

	// 8. Send verification email (always send on register/re-attempt)
	go func(email, code string) {
		if err := h.EmailClient.SendVerificationEmail(email, code); err != nil {
			// Log error, but don't fail the registration request itself
			log.Printf("Error sending verification email in background to %s: %v\n", email, err)
		}
	}(user.Email, verificationCode)

	// 9. Log success and return token + user details (LOGIN RESPONSE FORMAT)
	// Create JWT Token upon successful registration (even if not verified yet)
	claims := jwt.MapClaims{
		"user_id": user.ID,
		"exp":     time.Now().Add(time.Hour * 72).Unix(), // Token expires in 72 hours
		"iat":     time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	t, err := token.SignedString(h.JWTSecret)
	if err != nil {
		log.Printf("Error signing JWT token after registration for %s: %v", user.Email, err)
		// Don't fail the whole request, but maybe log or monitor this
		// Return the user object without the token in this edge case?
		// For now, let's return the user but maybe signal token error?
		// Let's proceed with returning success but maybe log it significantly.
		// Decided to return 500 as token generation is critical for login flow
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate authentication token after registration"})
	}

	log.Printf("Registration successful for %s. Verification required.", user.Email)
	return c.Status(fiber.StatusCreated).JSON(LoginResponse{
		Token: t,
		User:  user, // Return the full user object
	})
}

// Login handles user login.
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	// 1. Parse Request Body
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// 2. Validate Request Body
	if err := h.Validate.Struct(req); err != nil {
		errors := err.(validator.ValidationErrors)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Validation failed", "details": formatValidationErrors(errors)})
	}

	// 3. Check if email exists
	var user models.User
	if err := h.DB.Where("email = ?", strings.ToLower(req.Email)).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error", "details": err.Error()})
	}

	// 4. Compare hashed password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		// Make sure the error message is generic for security
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	// 5. *** Check if email is verified ***
	if !user.EmailVerified {
		// Optionally, consider resending the verification email here if needed
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error":         "Email not verified",
			"message":       "Please check your email and verify your account before logging in.",
			"emailVerified": false, // Send flag to frontend
		})
	}

	// 6. Generate JWT
	claims := jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"exp":     time.Now().Add(time.Hour * 72).Unix(), // Token expires in 72 hours
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(h.JWTSecret)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate token"})
	}

	// 7. Preload wallets after successful login before returning user data
	h.DB.Preload("Wallets").First(&user, user.ID) // Reload user with wallets

	// 8. Return token and user data
	return c.JSON(fiber.Map{
		"token": tokenString,
		"user": fiber.Map{
			"id":            user.ID,
			"email":         user.Email,
			"emailVerified": user.EmailVerified, // Include verification status
			"wallets":       user.Wallets,       // Include wallets
			"firstName":     user.FirstName,
			"lastName":      user.LastName,
			"createdAt":     user.CreatedAt,
			"updatedAt":     user.UpdatedAt,
		},
	})
}

// Logout handles user logout (currently stateless, could implement token blocklist).
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	// TODO: Implement token blocklisting or session invalidation if needed in the future
	log.Println("Logout request received.") // Added basic logging
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Logout successful"})
}

// GetMe handles retrieving the currently authenticated user's details.
func (h *AuthHandler) GetMe(c *fiber.Ctx) error {
	// Retrieve user ID from JWT claims (set by AuthMiddleware)
	userID, ok := c.Locals("userID").(uint) // Assuming middleware sets uint ID
	if !ok || userID == 0 {
		// This case should ideally be prevented by the AuthMiddleware
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User ID not found in token or invalid"})
	}

	// Fetch user details from DB using the ID
	var user models.User
	if err := h.DB.Preload("Wallets").First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// This means the user ID from a valid token doesn't exist in the DB (edge case, maybe user deleted)
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User associated with token not found"})
		}
		// Handle other potential database errors
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error fetching user details", "details": err.Error()})
	}

	// Return user details, ensuring sensitive info is excluded
	return c.JSON(fiber.Map{
		"id":            user.ID,
		"email":         user.Email,
		"emailVerified": user.EmailVerified, // Include verification status
		"wallets":       user.Wallets,
		"firstName":     user.FirstName,
		"lastName":      user.LastName,
		"createdAt":     user.CreatedAt,
		"updatedAt":     user.UpdatedAt,
	})
}

func formatValidationErrors(errors validator.ValidationErrors) string {
	var errorMessages []string
	for _, err := range errors {
		errorMessages = append(errorMessages, err.Error())
	}
	return strings.Join(errorMessages, ", ")
}

// VerifyEmailRequest defines the expected request body for email verification
type VerifyEmailRequest struct {
	Code string `json:"verification_code" validate:"required,len=6"` // Corrected json tag
}

// VerifyEmail handles the verification of a user's email address.
func (h *AuthHandler) VerifyEmail(c *fiber.Ctx) error {
	// 1. Get User ID from authenticated context (set by middleware)
	userIDClaim := c.Locals("userID") // Use the correct key "userID"
	if userIDClaim == nil {
		// This check might still be useful if middleware somehow fails silently, but the primary issue was the key name
		log.Printf("VerifyEmail Error: userID not found in context even after AuthMiddleware passed.") // Added logging
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User not authenticated (context error)"})
	}
	userID, ok := userIDClaim.(uint)
	if !ok || userID == 0 { // Check for type assertion failure or zero ID
		log.Printf("VerifyEmail Error: Invalid userID type or value in context (%v, type %T).", userIDClaim, userIDClaim) // Added logging
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Invalid user ID in token context"})
	}

	// Log the correctly retrieved user ID
	log.Printf("VerifyEmail Handler: Authenticated User ID: %d", userID)

	// 2. Parse request body
	var req VerifyEmailRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse request body"})
	}

	// 3. Validate request body
	if err := h.Validate.Struct(req); err != nil {
		// Use the existing FormatValidationErrors which handles the type assertion
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Validation failed", "details": FormatValidationErrors(err)})
	}

	// 4. Find the user by ID
	var user models.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error finding user"})
	}

	// 5. Check if already verified
	if user.EmailVerified {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Email already verified"})
	}

	// 6. Check if code exists and matches
	if user.EmailVerificationCode == nil || *user.EmailVerificationCode == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "No verification code found for this user. Please register again."}) // Or request a new code
	}
	if *user.EmailVerificationCode != req.Code {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid verification code"})
	}

	// 7. Check if code has expired
	if user.EmailVerificationExpiresAt == nil || time.Now().After(*user.EmailVerificationExpiresAt) {
		// Optionally: Clear the expired code here if desired
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Verification code expired. Please register again to get a new code."}) // Or request a new code
	}

	// 8. Verification successful - Update user record
	user.EmailVerified = true
	user.EmailVerificationCode = nil      // Clear the code
	user.EmailVerificationExpiresAt = nil // Clear expiry

	if err := h.DB.Save(&user).Error; err != nil {
		log.Printf("Error saving user after email verification: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update user verification status"})
	}

	// 9. Return success response
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Email successfully verified"})
}

// Helper function to format validation errors
func FormatValidationErrors(err error) map[string]string {
	errorsMap := make(map[string]string)
	validationErrors, ok := err.(validator.ValidationErrors)
	if !ok {
		// If it's not validation errors, return a generic message or nil
		// depending on how you want to handle other error types here.
		// For now, returning nil might be suitable if only validation errors are expected.
		// Or return a generic error: errorsMap["error"] = "Invalid request data"
		return errorsMap // Return empty map or map with generic error
	}

	for _, fieldErr := range validationErrors {
		fieldName := fieldErr.Field()
		tag := fieldErr.Tag()
		errorsMap[fieldName] = fmt.Sprintf("Field validation for '%s' failed on the '%s' tag", fieldName, tag)
	}
	return errorsMap
}
