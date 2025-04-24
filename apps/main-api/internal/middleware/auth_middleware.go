package middleware

import (
	"log"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// CustomClaims struct including standard claims and userID
type CustomClaims struct {
	UserID uint `json:"userID"`
	jwt.RegisteredClaims
}

// AuthMiddleware creates a Fiber middleware for JWT authentication.
func AuthMiddleware(jwtSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing Authorization header"})
		}

		// Check for "Bearer " prefix
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid Authorization header format"})
		}
		tokenString := parts[1]

		// Parse and validate the token
		token, err := jwt.ParseWithClaims(tokenString, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
			// Validate the alg is what you expect:
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.NewError(fiber.StatusUnauthorized, "Unexpected signing method")
			}
			return []byte(jwtSecret), nil
		})

		if err != nil {
			log.Printf("JWT Error: %v", err)
			// Differentiate between expired and invalid tokens
			if err == jwt.ErrTokenExpired {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Token has expired"})
			}
			// Check for specific validation errors if needed, e.g., invalid signature
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
		}

		if claims, ok := token.Claims.(*CustomClaims); ok && token.Valid {
			// Check expiration (already implicitly checked by ParseWithClaims, but good practice)
			if claims.ExpiresAt != nil && claims.ExpiresAt.Time.Before(time.Now()) {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Token has expired"})
			}

			// Token is valid, set userID in locals
			c.Locals("userID", claims.UserID) // Use the UserID from the custom claims
			log.Printf("Authenticated user %d", claims.UserID)
			return c.Next()
		}

		// Generic invalid token if claims extraction failed or token invalid
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
	}
}
