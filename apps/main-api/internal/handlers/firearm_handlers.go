package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/team556-mono/server/internal/models"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// CreateFirearmHandler godoc
// @Summary Create a new firearm
// @Description Add a new firearm associated with a user
// @Tags firearms
// @Accept json
// @Produce json
// @Param firearm body models.Firearm true "Firearm data (UserID required)"
// @Success 201 {object} models.Firearm
// @Failure 400 {object} map[string]string "Invalid input"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /api/firearms [post]
func CreateFirearmHandler(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		firearm := new(models.Firearm)

		if err := c.BodyParser(firearm); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
		}

		// Basic validation (example: ensure UserID is provided)
		if firearm.UserID == 0 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "UserID is required"})
		}

		// Explicitly handle JSONMap if needed during creation (optional based on client input)
		if firearm.BallisticPerformance == nil {
			firearm.BallisticPerformance = datatypes.JSONMap{}
		}

		result := db.Create(&firearm)
		if result.Error != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": result.Error.Error()})
		}

		return c.Status(fiber.StatusCreated).JSON(firearm)
	}
}

// GetFirearmsHandler godoc
// @Summary Get all firearms
// @Description Retrieve a list of all firearms
// @Tags firearms
// @Produce json
// @Success 200 {array} models.Firearm
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /api/firearms [get]
func GetFirearmsHandler(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var firearms []models.Firearm
		result := db.Preload("User").Find(&firearms)
		if result.Error != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": result.Error.Error()})
		}
		return c.JSON(firearms)
	}
}

// GetFirearmByIDHandler godoc
// @Summary Get a firearm by ID
// @Description Retrieve details of a specific firearm by its ID
// @Tags firearms
// @Produce json
// @Param id path int true "Firearm ID"
// @Success 200 {object} models.Firearm
// @Failure 404 {object} map[string]string "Firearm not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /api/firearms/{id} [get]
func GetFirearmByIDHandler(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		idStr := c.Params("id")
		id, err := strconv.Atoi(idStr)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID format"})
		}

		var firearm models.Firearm
		result := db.Preload("User").First(&firearm, id)
		if result.Error != nil {
			if result.Error == gorm.ErrRecordNotFound {
				return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Firearm not found"})
			}
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": result.Error.Error()})
		}
		return c.JSON(firearm)
	}
}

// UpdateFirearmHandler godoc
// @Summary Update a firearm
// @Description Update details of an existing firearm by its ID
// @Tags firearms
// @Accept json
// @Produce json
// @Param id path int true "Firearm ID"
// @Param firearm body models.Firearm true "Updated firearm data"
// @Success 200 {object} models.Firearm
// @Failure 400 {object} map[string]string "Invalid input"
// @Failure 404 {object} map[string]string "Firearm not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /api/firearms/{id} [put]
func UpdateFirearmHandler(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		idStr := c.Params("id")
		id, err := strconv.Atoi(idStr)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID format"})
		}

		// Find existing firearm
		var existingFirearm models.Firearm
		findResult := db.First(&existingFirearm, id)
		if findResult.Error != nil {
			if findResult.Error == gorm.ErrRecordNotFound {
				return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Firearm not found"})
			}
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": findResult.Error.Error()})
		}

		// Parse updated data
		updatedData := new(models.Firearm)
		if err := c.BodyParser(updatedData); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
		}

		// Update fields (excluding ID, CreatedAt, UserID to prevent accidental changes?)
		// GORM's Updates method respects zero values, use Select for specific fields or Map for partial updates if needed.
		// For simplicity here, we update most fields. Ensure UserID is not updated this way.
		updatedData.ID = existingFirearm.ID               // Keep original ID
		updatedData.UserID = existingFirearm.UserID       // Keep original UserID
		updatedData.CreatedAt = existingFirearm.CreatedAt // Keep original CreatedAt

		// Use Model & Updates to update non-zero fields from updatedData
		// Alternatively, use Select("*").Omit("id", "created_at", "user_id").Updates(updatedData)
		// Or map structure for specific updates: database.DB.Model(&firearm).Updates(map[string]interface{}{...})
		existingFirearm.Name = updatedData.Name
		existingFirearm.Type = updatedData.Type
		existingFirearm.BallisticPerformance = updatedData.BallisticPerformance

		// Save the updated firearm
		saveResult := db.Save(&existingFirearm)
		if saveResult.Error != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": saveResult.Error.Error()})
		}

		return c.JSON(existingFirearm) // Return the updated firearm
	}
}

// DeleteFirearmHandler godoc
// @Summary Delete a firearm
// @Description Remove a firearm by its ID
// @Tags firearms
// @Produce json
// @Param id path int true "Firearm ID"
// @Success 200 {object} map[string]string "Success message"
// @Failure 404 {object} map[string]string "Firearm not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /api/firearms/{id} [delete]
func DeleteFirearmHandler(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		idStr := c.Params("id")
		id, err := strconv.Atoi(idStr)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID format"})
		}

		// Attempt to delete the firearm
		result := db.Delete(&models.Firearm{}, id)
		if result.Error != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": result.Error.Error()})
		}

		if result.RowsAffected == 0 {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Firearm not found or already deleted"})
		}

		return c.JSON(fiber.Map{"message": "Firearm deleted successfully"})
	}
}
