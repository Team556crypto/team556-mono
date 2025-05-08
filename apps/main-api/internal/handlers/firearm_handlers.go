package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/shopspring/decimal"
	"github.com/team556-mono/server/internal/config"
	"github.com/team556-mono/server/internal/models"
	"gorm.io/gorm"
)

// FirearmResponse DTO to control JSON output, especially for the ID field
// and to explicitly include fields from gorm.Model if needed.
type FirearmResponse struct {
	ID                   uint             `json:"id"`
	Name                 string           `json:"name"`
	Type                 string           `json:"type,omitempty"`
	Caliber              string           `json:"caliber,omitempty"`
	SerialNumber         string           `json:"serial_number"`
	AcquisitionDate      *time.Time       `json:"acquisition_date,omitempty"`
	PurchasePrice        *decimal.Decimal `json:"purchase_price,omitempty"`
	LastFired            *time.Time       `json:"last_fired,omitempty"`
	Image                *string          `json:"image,omitempty"`
	Manufacturer         string           `json:"manufacturer,omitempty"`
	ModelName            string           `json:"model_name,omitempty"`
	RoundCount           *int             `json:"round_count,omitempty"`
	LastCleaned          *time.Time       `json:"last_cleaned,omitempty"`
	Value                *float64         `json:"value,omitempty"`
	Status               *string          `json:"status,omitempty"`
	BallisticPerformance string           `json:"ballistic_performance,omitempty"`
	CreatedAt            time.Time        `json:"created_at"`
	UpdatedAt            time.Time        `json:"updated_at"`
}

// CreateFirearmHandler handles the creation of a new firearm
func CreateFirearmHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
		}

		firearmModel := new(models.Firearm)
		if err := c.BodyParser(firearmModel); err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
		}

		// Basic validation
		if firearmModel.Name == "" || firearmModel.SerialNumber == "" {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Name and SerialNumber are required"})
		}

		firearmModel.UserID = userID

		if err := db.Create(firearmModel).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create firearm", "details": err.Error()})
		}

		// Convert to FirearmResponse before sending
		response := FirearmResponse{
			ID:                   firearmModel.ID,
			Name:                 firearmModel.Name,
			Type:                 firearmModel.Type,
			Caliber:              firearmModel.Caliber,
			SerialNumber:         firearmModel.SerialNumber,
			AcquisitionDate:      firearmModel.AcquisitionDate,
			PurchasePrice:        firearmModel.PurchasePrice,
			LastFired:            firearmModel.LastFired,
			Image:                firearmModel.Image,
			Manufacturer:         firearmModel.Manufacturer,
			ModelName:            firearmModel.ModelName,
			RoundCount:           firearmModel.RoundCount,
			LastCleaned:          firearmModel.LastCleaned,
			Value:                firearmModel.Value,
			Status:               firearmModel.Status,
			BallisticPerformance: firearmModel.BallisticPerformance,
			CreatedAt:            firearmModel.CreatedAt,
			UpdatedAt:            firearmModel.UpdatedAt,
		}

		return c.Status(http.StatusCreated).JSON(response)
	}
}

// GetFirearmsHandler handles retrieving all firearms for the authenticated user
func GetFirearmsHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
		}

		var firearms []models.Firearm
		if err := db.Where("user_id = ?", userID).Find(&firearms).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not retrieve firearms", "details": err.Error()})
		}

		// Convert to FirearmResponse to ensure correct JSON field names (e.g., lowercase 'id')
		firearmResponses := make([]FirearmResponse, len(firearms))
		for i, f := range firearms {
			firearmResponses[i] = FirearmResponse{
				ID:                   f.ID, // This ID comes from the embedded gorm.Model
				Name:                 f.Name,
				Type:                 f.Type,
				Caliber:              f.Caliber,
				SerialNumber:         f.SerialNumber,
				AcquisitionDate:      f.AcquisitionDate,
				PurchasePrice:        f.PurchasePrice,
				LastFired:            f.LastFired,
				Image:                f.Image,
				Manufacturer:         f.Manufacturer,
				ModelName:            f.ModelName,
				RoundCount:           f.RoundCount,
				LastCleaned:          f.LastCleaned,
				Value:                f.Value,
				Status:               f.Status,
				BallisticPerformance: f.BallisticPerformance,
				CreatedAt:            f.CreatedAt, // This comes from the embedded gorm.Model
				UpdatedAt:            f.UpdatedAt, // This comes from the embedded gorm.Model
			}
		}

		return c.JSON(firearmResponses)
	}
}

// GetFirearmByIDHandler handles retrieving a specific firearm by its ID
func GetFirearmByIDHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
		}

		idStr := c.Params("id")
		firearmID, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid firearm ID"})
		}

		var firearm models.Firearm
		if errDB := db.Where("id = ? AND user_id = ?", uint(firearmID), userID).First(&firearm).Error; errDB != nil {
			if errDB == gorm.ErrRecordNotFound {
				return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Firearm not found"})
			}
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not retrieve firearm", "details": errDB.Error()})
		}

		// Convert to FirearmResponse for consistent API output
		response := FirearmResponse{
			ID:                   firearm.ID,
			Name:                 firearm.Name,
			Type:                 firearm.Type,
			Caliber:              firearm.Caliber,
			SerialNumber:         firearm.SerialNumber,
			AcquisitionDate:      firearm.AcquisitionDate,
			PurchasePrice:        firearm.PurchasePrice,
			LastFired:            firearm.LastFired,
			Image:                firearm.Image,
			Manufacturer:         firearm.Manufacturer,
			ModelName:            firearm.ModelName,
			RoundCount:           firearm.RoundCount,
			LastCleaned:          firearm.LastCleaned,
			Value:                firearm.Value,
			Status:               firearm.Status,
			BallisticPerformance: firearm.BallisticPerformance,
			CreatedAt:            firearm.CreatedAt,
			UpdatedAt:            firearm.UpdatedAt,
		}

		return c.JSON(response)
	}
}

// UpdateFirearmHandler handles updating an existing firearm
func UpdateFirearmHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
		}

		idStr := c.Params("id")
		firearmID, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid firearm ID"})
		}

		var existingFirearmModel models.Firearm
		if errDB := db.Where("id = ? AND user_id = ?", uint(firearmID), userID).First(&existingFirearmModel).Error; errDB != nil {
			if errDB == gorm.ErrRecordNotFound {
				return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Firearm not found"})
			}
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not retrieve firearm for update", "details": errDB.Error()})
		}

		updateData := new(models.Firearm) // Still parse into models.Firearm to get all fields
		if err := c.BodyParser(updateData); err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
		}

		// Apply updates to the existingFirearmModel instance
		existingFirearmModel.Name = updateData.Name
		existingFirearmModel.Type = updateData.Type
		existingFirearmModel.Caliber = updateData.Caliber
		existingFirearmModel.SerialNumber = updateData.SerialNumber
		existingFirearmModel.AcquisitionDate = updateData.AcquisitionDate
		existingFirearmModel.PurchasePrice = updateData.PurchasePrice
		existingFirearmModel.LastFired = updateData.LastFired
		existingFirearmModel.Image = updateData.Image
		existingFirearmModel.Manufacturer = updateData.Manufacturer
		existingFirearmModel.ModelName = updateData.ModelName
		existingFirearmModel.RoundCount = updateData.RoundCount
		existingFirearmModel.LastCleaned = updateData.LastCleaned
		existingFirearmModel.Value = updateData.Value
		existingFirearmModel.Status = updateData.Status
		existingFirearmModel.BallisticPerformance = updateData.BallisticPerformance
		// UserID and ID are protected (not updated from payload)
		// CreatedAt is preserved

		if err := db.Save(&existingFirearmModel).Error; err != nil { 
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not update firearm", "details": err.Error()})
		}
        
		// Convert to FirearmResponse before sending
		response := FirearmResponse{
			ID:                   existingFirearmModel.ID,
			Name:                 existingFirearmModel.Name,
			Type:                 existingFirearmModel.Type,
			Caliber:              existingFirearmModel.Caliber,
			SerialNumber:         existingFirearmModel.SerialNumber,
			AcquisitionDate:      existingFirearmModel.AcquisitionDate,
			PurchasePrice:        existingFirearmModel.PurchasePrice,
			LastFired:            existingFirearmModel.LastFired,
			Image:                existingFirearmModel.Image,
			Manufacturer:         existingFirearmModel.Manufacturer,
			ModelName:            existingFirearmModel.ModelName,
			RoundCount:           existingFirearmModel.RoundCount,
			LastCleaned:          existingFirearmModel.LastCleaned,
			Value:                existingFirearmModel.Value,
			Status:               existingFirearmModel.Status,
			BallisticPerformance: existingFirearmModel.BallisticPerformance,
			CreatedAt:            existingFirearmModel.CreatedAt,
			UpdatedAt:            existingFirearmModel.UpdatedAt,
		}

		return c.JSON(response)
	}
}

// DeleteFirearmHandler handles deleting a firearm
func DeleteFirearmHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
		}

		idStr := c.Params("id")
		firearmID, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid firearm ID"})
		}

		// Check if firearm exists and belongs to user before deleting
		var firearm models.Firearm
		if err := db.Where("id = ? AND user_id = ?", uint(firearmID), userID).First(&firearm).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Firearm not found"})
			}
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not retrieve firearm for deletion", "details": err.Error()})
		}

		if err := db.Delete(&models.Firearm{}, uint(firearmID)).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not delete firearm", "details": err.Error()})
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{"message": "Firearm deleted successfully"})
	}
}
