package security

import (
	"time"

	"github.com/gofiber/fiber/v2/middleware/limiter"
)

// SensitiveLimiter returns a sane default limiter config for security-sensitive routes.
// Example: app.Post("/me/password", limiter.New(SensitiveLimiter(5, time.Minute)), handler)
func SensitiveLimiter(max int, window time.Duration) limiter.Config {
	if max <= 0 { max = 10 }
	if window <= 0 { window = time.Minute }
	return limiter.Config{
		Max:        max,
		Expiration: window,
	}
}
