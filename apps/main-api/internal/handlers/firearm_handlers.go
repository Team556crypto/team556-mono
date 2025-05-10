package handlers

import (
	"log"
	"net/http"
	"strconv"
	"strings"
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

// CreateFirearmRequest defines the expected payload for creating a firearm.
// It includes ImageBase64 specifically for the incoming base64 image string.
type CreateFirearmRequest struct {
	Name                 string           `json:"name"`
	Type                 string           `json:"type,omitempty"`
	Caliber              string           `json:"caliber,omitempty"`
	SerialNumber         string           `json:"serial_number"`
	AcquisitionDate      *time.Time       `json:"acquisition_date,omitempty"`
	PurchasePrice        *decimal.Decimal `json:"purchase_price,omitempty"`
	LastFired            *time.Time       `json:"last_fired,omitempty"`
	Manufacturer         string           `json:"manufacturer,omitempty"`
	ModelName            string           `json:"model_name,omitempty"`
	RoundCount           *int             `json:"round_count,omitempty"`
	LastCleaned          *time.Time       `json:"last_cleaned,omitempty"`
	Value                *float64         `json:"value,omitempty"`
	Status               *string          `json:"status,omitempty"`
	BallisticPerformance string           `json:"ballistic_performance,omitempty"`
	ImageBase64          *string          `json:"image_base64,omitempty"` // For incoming base64 image
}

// UpdateFirearmRequest defines the expected payload for updating a firearm.
// Includes optional fields for new image data.
type UpdateFirearmRequest struct {
	Name                 *string          `json:"name,omitempty"`
	Type                 *string          `json:"type,omitempty"`
	Caliber              *string          `json:"caliber,omitempty"`
	SerialNumber         *string          `json:"serial_number,omitempty"`
	AcquisitionDate      *time.Time       `json:"acquisition_date,omitempty"`
	PurchasePrice        *decimal.Decimal `json:"purchase_price,omitempty"`
	LastFired            *time.Time       `json:"last_fired,omitempty"`
	Manufacturer         *string          `json:"manufacturer,omitempty"`
	ModelName            *string          `json:"model_name,omitempty"`
	RoundCount           *int             `json:"round_count,omitempty"`
	LastCleaned          *time.Time       `json:"last_cleaned,omitempty"`
	Value                *float64         `json:"value,omitempty"`
	Status               *string          `json:"status,omitempty"`
	BallisticPerformance *string          `json:"ballistic_performance,omitempty"`
	Image                *string          `json:"image,omitempty"` // Existing image URL (e.g., if user wants to clear it by sending null)

	// Fields for new image upload
	ImageName *string `json:"imageName,omitempty"`
	ImageData *string `json:"imageData,omitempty"` // Base64 encoded data
	ImageType *string `json:"imageType,omitempty"` // Mime type
	ImageSize *int    `json:"imageSize,omitempty"` // Size in bytes
}

// Removed UploadThing-related structs since we're now storing base64 images directly

// CreateFirearmHandler handles the creation of a new firearm
func CreateFirearmHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
		}

		// Beta Test: Limit firearms to 2 per user
		var count int64
		if err := db.Model(&models.Firearm{}).Where("user_id = ?", userID).Count(&count).Error; err != nil {
			log.Printf("Error counting firearms for user %d: %v", userID, err)
			// Allow creation if count fails, to not block users due to a potential DB issue during beta.
			// Consider stricter error handling in production.
		} else if count >= 2 {
			return c.Status(http.StatusForbidden).JSON(fiber.Map{"error": "Firearm limit reached (max 2 for beta test)"})
		}

		// Parse the request body into CreateFirearmRequest
		requestPayload := new(CreateFirearmRequest)
		if err := c.BodyParser(requestPayload); err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON", "details": err.Error()})
		}

		// Basic validation
		if requestPayload.Name == "" || requestPayload.SerialNumber == "" {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Name and SerialNumber are required"})
		}

		// Map CreateFirearmRequest to models.Firearm
		firearmModel := &models.Firearm{
			UserID:               userID,
			Name:                 requestPayload.Name,
			Type:                 requestPayload.Type,
			Caliber:              requestPayload.Caliber,
			SerialNumber:         requestPayload.SerialNumber,
			AcquisitionDate:      requestPayload.AcquisitionDate,
			PurchasePrice:        requestPayload.PurchasePrice,
			LastFired:            requestPayload.LastFired,
			Manufacturer:         requestPayload.Manufacturer,
			ModelName:            requestPayload.ModelName,
			RoundCount:           requestPayload.RoundCount,
			LastCleaned:          requestPayload.LastCleaned,
			Value:                requestPayload.Value,
			Status:               requestPayload.Status,
			BallisticPerformance: requestPayload.BallisticPerformance,
		}

		// Store base64 image directly if provided
		if requestPayload.ImageBase64 != nil && *requestPayload.ImageBase64 != "" {
			// Store the base64 image string directly in the database
			imageBase64Str := *requestPayload.ImageBase64
			
			// Add data:image prefix if not already present
			if !strings.HasPrefix(imageBase64Str, "data:image") {
				imageBase64Str = "data:image/png;base64," + imageBase64Str
			}
			
			// Set the image field directly with the base64 string
			firearmModel.Image = &imageBase64Str
		}

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

		// Parse the request body into UpdateFirearmRequest
		requestPayload := new(UpdateFirearmRequest)
		if err := c.BodyParser(requestPayload); err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON", "details": err.Error()})
		}

		// Handle new image upload if ImageData is provided
		newImageURL := existingFirearmModel.Image // Keep existing image URL by default
		if requestPayload.ImageData != nil && *requestPayload.ImageData != "" {
			log.Println("UpdateFirearmHandler: ImageData received. Processing base64 image.")
			
			// Log info about the received image (truncated to avoid huge logs)
			if len(*requestPayload.ImageData) > 50 {
				log.Printf("UpdateFirearmHandler: Received ImageData (first 50 chars): %s...", (*requestPayload.ImageData)[:50])
			} else {
				log.Printf("UpdateFirearmHandler: Received ImageData: %s", *requestPayload.ImageData)
			}

			// Store the base64 string directly
			imageBase64Str := *requestPayload.ImageData

			// Add data:image prefix if not already present
			if !strings.HasPrefix(imageBase64Str, "data:image") {
				// Use the provided mime type if available, otherwise default to png
				imageMimeType := "image/png"
				if requestPayload.ImageType != nil && *requestPayload.ImageType != "" {
					imageMimeType = *requestPayload.ImageType
				}
				imageBase64Str = "data:" + imageMimeType + ";base64," + imageBase64Str
			}

			// Set the image field with the base64 string
			newImageURL = &imageBase64Str
		} else if requestPayload.Image != nil && *requestPayload.Image == "" { 
			log.Println("UpdateFirearmHandler: Clearing image as per request (Image field is empty string).")
			// If image field is explicitly sent as empty string, intent is to remove image
			emptyStr := ""
			newImageURL = &emptyStr 
		} else if requestPayload.Image != nil { 
			// If image field is sent with a non-empty value but no ImageData, it implies user wants to manually set URL (less common)
			// Or if image data was not provided, and client sends current URL, this handles it.
			newImageURL = requestPayload.Image
		}

		log.Printf("UpdateFirearmHandler: Final newImageURL to be used: %v (pointer: %p)", newImageURL, newImageURL)
		if newImageURL != nil {
			log.Printf("UpdateFirearmHandler: Final newImageURL value: %s", *newImageURL)
		} else {
			log.Println("UpdateFirearmHandler: Final newImageURL is nil")
		}

		// Apply updates from requestPayload to existingFirearmModel
		if requestPayload.Name != nil { existingFirearmModel.Name = *requestPayload.Name }
		if requestPayload.Type != nil { existingFirearmModel.Type = *requestPayload.Type }
		if requestPayload.Caliber != nil { existingFirearmModel.Caliber = *requestPayload.Caliber }
		if requestPayload.SerialNumber != nil { existingFirearmModel.SerialNumber = *requestPayload.SerialNumber }
		if requestPayload.AcquisitionDate != nil { existingFirearmModel.AcquisitionDate = requestPayload.AcquisitionDate } // This is already *time.Time
		if requestPayload.PurchasePrice != nil { existingFirearmModel.PurchasePrice = requestPayload.PurchasePrice } // This is already *decimal.Decimal
		if requestPayload.LastFired != nil { existingFirearmModel.LastFired = requestPayload.LastFired } // This is already *time.Time
		if requestPayload.Manufacturer != nil { existingFirearmModel.Manufacturer = *requestPayload.Manufacturer }
		if requestPayload.ModelName != nil { existingFirearmModel.ModelName = *requestPayload.ModelName }
		if requestPayload.RoundCount != nil { existingFirearmModel.RoundCount = requestPayload.RoundCount } // This is already *int
		if requestPayload.LastCleaned != nil { existingFirearmModel.LastCleaned = requestPayload.LastCleaned } // This is already *time.Time
		if requestPayload.Value != nil { existingFirearmModel.Value = requestPayload.Value } // This is already *float64
		if requestPayload.Status != nil { existingFirearmModel.Status = requestPayload.Status } // This is already *string in models.Firearm
		if requestPayload.BallisticPerformance != nil { existingFirearmModel.BallisticPerformance = *requestPayload.BallisticPerformance }
		
		existingFirearmModel.Image = newImageURL // Set the image URL (either new, cleared, or existing)

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
