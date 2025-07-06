package handlers

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/team556-mono/server/internal/config"
	"github.com/team556-mono/server/internal/models"
	"gorm.io/gorm"
)

// CreateAmmoHandler handles creating a new ammo entry
func CreateAmmoHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
		}

		var ammo models.Ammo
		if err := c.BodyParser(&ammo); err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
		}

		ammo.UserID = userID

		if err := db.Create(&ammo).Error; err != nil {
			log.Printf("Error creating ammo: %v", err)
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create ammo"})
		}

		return c.Status(http.StatusCreated).JSON(ammo)
	}
}

// GetAmmosHandler handles retrieving all ammo for the authenticated user
func GetAmmosHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
		}

		var ammos []models.Ammo
		if err := db.Where("user_id = ?", userID).Find(&ammos).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not retrieve ammo"})
		}

		return c.JSON(ammos)
	}
}

// GetAmmoByIDHandler handles retrieving a specific ammo by its ID
func GetAmmoByIDHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
		}

		idStr := c.Params("id")
		ammoID, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ammo ID"})
		}

		var ammo models.Ammo
		if err := db.Where("id = ? AND user_id = ?", uint(ammoID), userID).First(&ammo).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Ammo not found"})
			}
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not retrieve ammo"})
		}

		return c.JSON(ammo)
	}
}

// UpdateAmmoHandler handles updating an existing ammo entry
func UpdateAmmoHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
		}

		idStr := c.Params("id")
		ammoID, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ammo ID"})
		}

		var ammo models.Ammo
		if err := db.Where("id = ? AND user_id = ?", uint(ammoID), userID).First(&ammo).Error; err != nil {
			return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Ammo not found"})
		}

		var updateData models.Ammo
		if err := c.BodyParser(&updateData); err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
		}

		if err := db.Model(&ammo).Updates(updateData).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not update ammo"})
		}

		return c.JSON(ammo)
	}
}

// DeleteAmmoHandler handles deleting an ammo entry
func DeleteAmmoHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
		}

		idStr := c.Params("id")
		ammoID, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ammo ID"})
		}

		if err := db.Where("id = ? AND user_id = ?", uint(ammoID), userID).Delete(&models.Ammo{}).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not delete ammo"})
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{"message": "Ammo deleted successfully"})
	}
}
