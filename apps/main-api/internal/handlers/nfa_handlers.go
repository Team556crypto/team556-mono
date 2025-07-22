package handlers

import (
	"net/http"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/team556-mono/server/internal/config"
	"github.com/team556-mono/server/internal/models"
	"gorm.io/gorm"
)

// CreateNFAHandler handles the creation of a new NFA item
func CreateNFAHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
		}

		var nfa models.NFA
		if err := c.BodyParser(&nfa); err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
		}

		nfa.UserID = userID

		if err := db.Create(&nfa).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create NFA item"})
		}

		return c.Status(http.StatusCreated).JSON(nfa)
	}
}

// GetNFAItemsHandler handles retrieving all NFA items for the authenticated user
func GetNFAItemsHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
		}

		var nfaItems []models.NFA
		if err := db.Where("user_id = ?", userID).Find(&nfaItems).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not retrieve NFA items"})
		}

		return c.JSON(nfaItems)
	}
}

// GetNFAByIDHandler handles retrieving a specific NFA item by its ID
func GetNFAByIDHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
		}

		idStr := c.Params("id")
		nfaID, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid NFA item ID"})
		}

		var nfa models.NFA
		if err := db.Where("id = ? AND user_id = ?", uint(nfaID), userID).First(&nfa).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "NFA item not found"})
			}
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not retrieve NFA item"})
		}

		return c.JSON(nfa)
	}
}

// UpdateNFAHandler handles updating an existing NFA item
func UpdateNFAHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
		}

		idStr := c.Params("id")
		nfaID, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid NFA item ID"})
		}

		var nfa models.NFA
		if err := db.Where("id = ? AND user_id = ?", uint(nfaID), userID).First(&nfa).Error; err != nil {
			return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "NFA item not found"})
		}

		if err := c.BodyParser(&nfa); err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
		}

		nfa.UserID = userID // Ensure user ID is not changed

		if err := db.Save(&nfa).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not update NFA item"})
		}

		return c.JSON(nfa)
	}
}

// DeleteNFAHandler handles deleting an NFA item
func DeleteNFAHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
		}

		idStr := c.Params("id")
		nfaID, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid NFA item ID"})
		}

		if err := db.Where("id = ? AND user_id = ?", uint(nfaID), userID).Delete(&models.NFA{}).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not delete NFA item"})
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{"message": "NFA item deleted successfully"})
	}
}
