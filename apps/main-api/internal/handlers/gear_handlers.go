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

// CreateGearHandler handles creating a new gear entry
func CreateGearHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
		}

		var gear models.Gear
		if err := c.BodyParser(&gear); err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
		}

		gear.UserID = userID

		if err := db.Create(&gear).Error; err != nil {
			log.Printf("Error creating gear: %v", err)
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create gear"})
		}

		return c.Status(http.StatusCreated).JSON(gear)
	}
}

// GetGearsHandler handles retrieving all gear for the authenticated user
func GetGearsHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
		}

		var gears []models.Gear
		if err := db.Where("user_id = ?", userID).Find(&gears).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not retrieve gear"})
		}

		return c.JSON(gears)
	}
}

// GetGearByIDHandler handles retrieving a specific gear by its ID
func GetGearByIDHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
		}

		idStr := c.Params("id")
		gearID, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid gear ID"})
		}

		var gear models.Gear
		if err := db.Where("id = ? AND user_id = ?", uint(gearID), userID).First(&gear).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Gear not found"})
			}
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not retrieve gear"})
		}

		return c.JSON(gear)
	}
}

// UpdateGearHandler handles updating an existing gear entry
func UpdateGearHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
		}

		idStr := c.Params("id")
		gearID, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid gear ID"})
		}

		var gear models.Gear
		if err := db.Where("id = ? AND user_id = ?", uint(gearID), userID).First(&gear).Error; err != nil {
			return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Gear not found"})
		}

		var updateData models.Gear
		if err := c.BodyParser(&updateData); err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
		}

		if err := db.Model(&gear).Updates(updateData).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not update gear"})
		}

		return c.JSON(gear)
	}
}

// DeleteGearHandler handles deleting a gear entry
func DeleteGearHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
		}

		idStr := c.Params("id")
		gearID, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid gear ID"})
		}

		if err := db.Where("id = ? AND user_id = ?", uint(gearID), userID).Delete(&models.Gear{}).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not delete gear"})
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{"message": "Gear deleted successfully"})
	}
}
