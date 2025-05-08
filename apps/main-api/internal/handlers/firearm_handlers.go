package handlers

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"log"
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

// Structure for UploadThing API request
type UploadThingFile struct {
	Name string `json:"name"`
	Data string `json:"data"` // Base64 encoded string
	Size int    `json:"size"` // Size of the file in bytes
	Type string `json:"type"` // MIME type e.g., image/png
}

// This struct is for the overall request body to UploadThing
type UploadThingRequestBody struct {
	Files []UploadThingFile `json:"files"`
}

// UploadThingFileDetail captures the details of a single uploaded file from UploadThing's response.
// It's for objects inside the "data" array in the API response.
type UploadThingFileDetail struct {
	FileUrl  string  `json:"fileUrl"` // This is the actual CDN URL of the uploaded file
	FileName string  `json:"fileName"`
	FileType string  `json:"fileType"`
	// UploadThing might also include an 'error' field per file, add if needed:
	// Error   *string `json:"error,omitempty"` 
}

// UploadThingAPIRealResponse is the top-level structure of the JSON response 
// from the UploadThing /api/uploadFiles endpoint.
type UploadThingAPIRealResponse struct {
	Data  []UploadThingFileDetail `json:"data"`
	Error *string                 `json:"error,omitempty"` // For any top-level error from the API call itself
}

// CreateFirearmHandler handles the creation of a new firearm
func CreateFirearmHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
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

		// Handle image upload if provided
		if requestPayload.ImageBase64 != nil && *requestPayload.ImageBase64 != "" {
			// Prepare the UploadThing API request
			imageBase64Str := *requestPayload.ImageBase64
			
			// TODO: Ideally, the client should send the MIME type.
			// For now, defaulting to image/png. This might need adjustment.
			imageMimeType := "image/png" 

			// Calculate size. Length of base64 string is a proxy. 
			// A more accurate decoded size could be calculated if needed: (len(imageBase64Str) * 3 / 4) - padding
			imageSize := len(imageBase64Str)

			uploadReqBody := UploadThingRequestBody{
				Files: []UploadThingFile{
					{Name: "firearm_image.png", Data: imageBase64Str, Size: imageSize, Type: imageMimeType},
				},
			}
			jsonBody, err := json.Marshal(uploadReqBody)
			if err != nil {
				return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to prepare image upload request", "details": err.Error()})
			}

			// Use UploadthingApiURL from config, with a fallback
			uploadURL := cfg.UploadthingApiURL
			if uploadURL == "" {
				uploadURL = "https://uploadthing.com/api/uploadFiles" // Default if not set in config
			}

			req, err := http.NewRequest("POST", uploadURL, bytes.NewBuffer(jsonBody))
			if err != nil {
				return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create image upload request", "details": err.Error()})
			}
			req.Header.Set("Content-Type", "application/json")
			// Use UploadthingSecret from config for the API Key
			if cfg.UploadthingSecret == "" {
				log.Println("Error: GLOBAL__UPLOADTHING_SECRET is not configured. Cannot upload image.")
				return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Image upload service is not configured (secret missing)"})
			}
			req.Header.Set("X-Uploadthing-Api-Key", cfg.UploadthingSecret)

			client := &http.Client{Timeout: time.Second * 20} // Increased timeout for upload
			resp, err := client.Do(req)
			if err != nil {
				return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to upload image to CDN", "details": err.Error()})
			}
			defer resp.Body.Close()

			bodyBytes, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to read image upload response from CDN", "details": err.Error()})
			}

			if resp.StatusCode != http.StatusOK {
				return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
					"error":   "Image upload to CDN failed",
					"details": string(bodyBytes),
					"cdn_status_code": resp.StatusCode,
				})
			}

			// Parse the UploadThing API response - it's an object containing a 'data' array
			var utApiResponse UploadThingAPIRealResponse
			if err := json.Unmarshal(bodyBytes, &utApiResponse); err != nil {
				return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse image upload response from CDN", "details": err.Error(), "raw_response": string(bodyBytes)})
			}

			// Check for top-level API errors first
			if utApiResponse.Error != nil && *utApiResponse.Error != "" {
				return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "CDN API reported a top-level error", "details": *utApiResponse.Error, "raw_response": string(bodyBytes)})
			}

			// Check for errors in the response and get the URL from the first file
			if len(utApiResponse.Data) > 0 {
				fileDetail := utApiResponse.Data[0] // Assuming we only sent one file
				// Potentially check fileDetail.Error here if UploadThing can return per-file errors not covered by the top-level one

				if fileDetail.FileUrl != "" {
					firearmModel.Image = &fileDetail.FileUrl
				} else {
					return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "CDN response did not contain a fileUrl", "raw_response": string(bodyBytes)})
				}
			} else {
				return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "CDN response data array was empty or malformed", "raw_response": string(bodyBytes)})
			}
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
			log.Println("UpdateFirearmHandler: ImageData received. Processing new image upload.")
			if requestPayload.ImageName != nil { log.Printf("UpdateFirearmHandler: Received ImageName: %s", *requestPayload.ImageName) }
			if requestPayload.ImageType != nil { log.Printf("UpdateFirearmHandler: Received ImageType: %s", *requestPayload.ImageType) }
			if requestPayload.ImageSize != nil { log.Printf("UpdateFirearmHandler: Received ImageSize: %d", *requestPayload.ImageSize) }
			// Log a snippet of ImageData to confirm presence (be careful with very long strings in logs)
			if len(*requestPayload.ImageData) > 50 {
				log.Printf("UpdateFirearmHandler: Received ImageData (first 50 chars): %s...", (*requestPayload.ImageData)[:50])
			} else {
				log.Printf("UpdateFirearmHandler: Received ImageData: %s", *requestPayload.ImageData)
			}

			imageName := "firearm_update_image.png" // Default name
			if requestPayload.ImageName != nil && *requestPayload.ImageName != "" {
				imageName = *requestPayload.ImageName
			}
			imageMimeType := "image/png" // Default MIME type
			if requestPayload.ImageType != nil && *requestPayload.ImageType != "" {
				imageMimeType = *requestPayload.ImageType
			}
			imageSize := len(*requestPayload.ImageData) // Approx size from base64 length
			if requestPayload.ImageSize != nil && *requestPayload.ImageSize > 0 {
				imageSize = *requestPayload.ImageSize
			}

			uploadReqBody := UploadThingRequestBody{
				Files: []UploadThingFile{
					{Name: imageName, Data: *requestPayload.ImageData, Size: imageSize, Type: imageMimeType},
				},
			}
			jsonBody, err := json.Marshal(uploadReqBody)
			if err != nil {
				log.Printf("Error marshaling UploadThing request: %v", err)
				return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to prepare image upload request"})
			}

			req, err := http.NewRequest("POST", cfg.UploadthingApiURL, bytes.NewBuffer(jsonBody))
			if err != nil {
				log.Printf("Error creating UploadThing HTTP request: %v", err)
				return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create image upload request"})
			}
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("X-Uploadthing-Api-Key", cfg.UploadthingSecret)
			req.Header.Set("X-Uploadthing-Version", "6.4.0") // Use a recent or required version

			client := &http.Client{Timeout: time.Second * 10}
			resp, err := client.Do(req)
			if err != nil {
				log.Printf("Error sending request to UploadThing: %v", err)
				return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to upload image to storage"})
			}
			defer resp.Body.Close()

			bodyBytes, _ := ioutil.ReadAll(resp.Body)
			if resp.StatusCode != http.StatusOK {
				log.Printf("UploadThing API error. Status: %s, Body: %s", resp.Status, string(bodyBytes))
				return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Image storage service returned an error"})
			}

			var utResponse UploadThingAPIRealResponse
			if err := json.Unmarshal(bodyBytes, &utResponse); err != nil {
				log.Printf("Error unmarshaling UploadThing response: %v, Body: %s", err, string(bodyBytes))
				return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse image upload response"})
			}

			log.Printf("UpdateFirearmHandler: UploadThing response: %+v", utResponse) // Log the full UploadThing response

			if utResponse.Error != nil {
				log.Printf("UploadThing API reported error: %s", *utResponse.Error)
				return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Image storage service reported an error processing the file"})
			}
			if len(utResponse.Data) > 0 && utResponse.Data[0].FileUrl != "" {
				newImageURL = &utResponse.Data[0].FileUrl
			} else {
				log.Println("UploadThing response did not contain a valid file URL.")
				// Decide if this is a hard error or if we proceed without new image
				// For now, let's treat it as a failure to update image
				return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get new image URL from storage service"})
			}
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
