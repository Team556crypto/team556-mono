package handlers

import (
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/team556-mono/server/internal/models"
	"gorm.io/gorm"
)

// ArmoryCounts represents the counts of each item type in the armory
type ArmoryCounts struct {
	Firearms int64 `json:"firearms"`
	Ammo     int64 `json:"ammo"`
	Gear     int64 `json:"gear"`
	NFA      int64 `json:"nfa"`
	Documents int64 `json:"documents"`
}

// GetArmoryCountsHandler handles the request to fetch counts of all armory items
func GetArmoryCountsHandler(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
		}

		// Initialize the counts struct
		counts := ArmoryCounts{}

		// Get firearms count
		if err := db.Model(&models.Firearm{}).Where("user_id = ?", userID).Count(&counts.Firearms).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not retrieve firearms count"})
		}

		// Get ammo count
		if err := db.Model(&models.Ammo{}).Where("user_id = ?", userID).Count(&counts.Ammo).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not retrieve ammo count"})
		}

		// Get gear count
		if err := db.Model(&models.Gear{}).Where("user_id = ?", userID).Count(&counts.Gear).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not retrieve gear count"})
		}

		// Get NFA count
		if err := db.Model(&models.NFA{}).Where("user_id = ?", userID).Count(&counts.NFA).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not retrieve NFA count"})
		}

		// Get documents count
		if err := db.Model(&models.Document{}).Where("user_id = ?", userID).Count(&counts.Documents).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not retrieve documents count"})
		}

		return c.JSON(counts)
	}
}