package handlers

import (
	"errors"
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/shopspring/decimal"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgconn" // Import for pgError
	"gorm.io/gorm"

	"github.com/team556-mono/server/internal/config"
	"github.com/team556-mono/server/internal/crypto"
	"github.com/team556-mono/server/internal/models"
)

// --- DTOs (Define Request/Response structures) ---

// CreateFirearmRequest defines the structure for creating/updating firearms via API.
// Uses pointers for optional fields. Expects RFC3339 date string.
type CreateFirearmRequest struct {
	Name                 string     `json:"name" binding:"required"`
	Type                 string     `json:"type" binding:"required"`
	SerialNumber         string     `json:"serial_number" binding:"required"`
	Manufacturer         *string    `json:"manufacturer"`
	ModelName            *string    `json:"model_name"`
	Caliber              *string    `json:"caliber"`
	AcquisitionDateRaw   *time.Time `json:"acquisition_date_raw,omitempty"`          // Use Raw for input
	PurchasePrice        *string    `json:"purchase_price,omitempty"`                // String representation of decimal
	BallisticPerformance *string    `json:"ballistic_performance,omitempty"`         // Expects JSON string
	ImageRaw             *string    `json:"image_raw,omitempty"`                     // Use Raw (string path/URL) for input
	RoundCountRaw        *int       `json:"round_count_raw,omitempty"`               // Use Raw for input
	ValueRaw             *float64   `json:"value_raw,omitempty"`                     // Use Raw for input
	StatusRaw            *string    `json:"status_raw,omitempty" validate:"max=255"` // Use Raw for input
}

// FirearmResponse defines the structure returned by the API.
// Uses specific types for date and price.
type FirearmResponse struct {
	ID                   uint       `json:"id"`
	OwnerUserID          uint       `json:"owner_user_id"`
	Name                 string     `json:"name"`
	Type                 string     `json:"type"`
	SerialNumber         string     `json:"serial_number"`
	Manufacturer         *string    `json:"manufacturer"`
	ModelName            *string    `json:"model_name"`
	Caliber              string     `json:"caliber"`
	AcquisitionDate      *string    `json:"acquisition_date,omitempty"`     // Encrypted string
	AcquisitionDateRaw   *time.Time `json:"acquisition_date_raw,omitempty"` // Decrypted date
	PurchasePrice        *string    `json:"purchase_price,omitempty"`       // String representation of decimal
	BallisticPerformance *string    `json:"ballistic_performance"`          // Return decrypted JSON string
	LastFired            *time.Time `json:"last_fired"`
	Image                *string    `json:"image,omitempty"`           // Encrypted string
	ImageRaw             string     `json:"image_raw,omitempty"`       // Decrypted string
	RoundCount           *string    `json:"round_count,omitempty"`     // Encrypted string
	RoundCountRaw        int        `json:"round_count_raw,omitempty"` // Decrypted int
	LastCleaned          *time.Time `json:"last_cleaned"`
	Value                *string    `json:"value,omitempty"`      // Encrypted string
	ValueRaw             float64    `json:"value_raw,omitempty"`  // Decrypted float64
	Status               *string    `json:"status,omitempty"`     // Encrypted string
	StatusRaw            string     `json:"status_raw,omitempty"` // Decrypted string
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
}

// --- Encryption/Decryption Helpers ---

// encryptFirearmData encrypts sensitive fields in the Firearm model *in place*.
// Reads from standard fields (Name, Type, etc.) and Raw fields (Date/Price).
// Writes encrypted strings to standard fields (Name, Type, AcquisitionDate, etc.).
// Clears Raw fields after use.
func encryptFirearmData(firearm *models.Firearm, secret string) error {
	var err error
	var encryptedValue string

	// Encrypt fields that are string in the model
	fieldsToEncrypt := []struct {
		name     string
		fieldPtr *string // Pointer to the string field
	}{
		{"Name", &firearm.Name},
		{"Type", &firearm.Type},
		{"SerialNumber", &firearm.SerialNumber},
		{"Manufacturer", &firearm.Manufacturer},
		{"ModelName", &firearm.ModelName},
		{"Caliber", &firearm.Caliber},
		{"BallisticPerformance", &firearm.BallisticPerformance},
	}
	for _, field := range fieldsToEncrypt {
		// Check if the field pointer is valid and the value is not empty
		if field.fieldPtr != nil && *field.fieldPtr != "" {
			plaintext := *field.fieldPtr
			encryptedValue, err = crypto.EncryptAESGCM(plaintext, secret)
			if err != nil {
				log.Printf("Error encrypting %s for firearm ID %d: %v", field.name, firearm.ID, err)
				// Decide error handling: return err, or set field to empty?
				// For now, setting to empty to avoid partial encryption state
				*field.fieldPtr = ""
			} else {
				*field.fieldPtr = encryptedValue // Assign encrypted value back directly
			}
		} else if field.fieldPtr != nil {
			// If the pointer is valid but the string is empty, ensure it remains empty
			*field.fieldPtr = ""
		} // If fieldPtr is nil, do nothing (shouldn't happen with struct fields)
	}

	// Encrypt AcquisitionDate (from Raw *time.Time -> *string)
	firearm.AcquisitionDate = nil // Ensure it's nil initially
	if firearm.AcquisitionDateRaw != nil {
		dateStr := firearm.AcquisitionDateRaw.Format(time.RFC3339)
		encryptedValue, err = crypto.EncryptAESGCM(dateStr, secret)
		if err != nil {
			return fmt.Errorf("failed to encrypt AcquisitionDate: %w", err)
		}
		firearm.AcquisitionDate = &encryptedValue
	} else {
		firearm.AcquisitionDate = nil
	}

	// Encrypt PurchasePrice (Raw decimal.Decimal -> *string)
	firearm.PurchasePrice = nil
	if firearm.PurchasePriceRaw != nil {
		priceStr := firearm.PurchasePriceRaw.StringFixed(2) // Format to 2 decimal places
		encryptedValue, err = crypto.EncryptAESGCM(priceStr, secret)
		if err != nil {
			return fmt.Errorf("failed to encrypt PurchasePrice: %w", err)
		}
		firearm.PurchasePrice = &encryptedValue
	}

	// Encrypt Image (Raw string -> *string)
	firearm.Image = nil
	if firearm.ImageRaw != "" {
		encryptedValue, err = crypto.EncryptAESGCM(firearm.ImageRaw, secret)
		if err != nil {
			return fmt.Errorf("failed to encrypt Image: %w", err)
		}
		firearm.Image = &encryptedValue
	}

	// Encrypt RoundCount (Raw int -> *string)
	firearm.RoundCount = nil
	if firearm.RoundCountRaw != 0 { // Assuming 0 is not a valid encrypted state
		countStr := strconv.Itoa(firearm.RoundCountRaw)
		encryptedValue, err = crypto.EncryptAESGCM(countStr, secret)
		if err != nil {
			return fmt.Errorf("failed to encrypt RoundCount: %w", err)
		}
		firearm.RoundCount = &encryptedValue
	}

	// Encrypt Value (Raw float64 -> *string)
	firearm.Value = nil
	if firearm.ValueRaw != 0.0 { // Assuming 0.0 is not a valid encrypted state
		valueStr := strconv.FormatFloat(firearm.ValueRaw, 'f', -1, 64)
		encryptedValue, err = crypto.EncryptAESGCM(valueStr, secret)
		if err != nil {
			return fmt.Errorf("failed to encrypt Value: %w", err)
		}
		firearm.Value = &encryptedValue
	}

	// Encrypt Status (Raw string -> *string)
	firearm.Status = nil
	if firearm.StatusRaw != "" {
		encryptedValue, err = crypto.EncryptAESGCM(firearm.StatusRaw, secret)
		if err != nil {
			return fmt.Errorf("failed to encrypt Status: %w", err)
		}
		firearm.Status = &encryptedValue
	}

	// Clear Raw fields after encryption
	firearm.AcquisitionDateRaw = nil
	firearm.PurchasePriceRaw = nil
	firearm.ImageRaw = ""
	firearm.RoundCountRaw = 0
	firearm.ValueRaw = 0.0
	firearm.StatusRaw = ""

	return nil
}

// decryptFirearmData decrypts sensitive fields in the Firearm model.
// Reads encrypted strings from standard fields (Name, Type, AcquisitionDate, etc.).
// Writes decrypted simple strings back to standard fields (Name, Type, etc.).
// Parses decrypted date/price strings and stores them in Raw fields.
func decryptFirearmData(firearm *models.Firearm, secret string) error {
	var err error
	var decryptedValue string

	// Decrypt fields that are string in the model
	stringFields := []struct {
		name     string
		fieldPtr *string // Pointer to the actual string field
	}{
		{"Name", &firearm.Name},
		{"Type", &firearm.Type},
		{"SerialNumber", &firearm.SerialNumber},
		{"Manufacturer", &firearm.Manufacturer},
		{"ModelName", &firearm.ModelName},
		{"Caliber", &firearm.Caliber},
		{"BallisticPerformance", &firearm.BallisticPerformance},
	}
	for _, field := range stringFields {
		if field.fieldPtr == nil || *field.fieldPtr == "" {
			continue
		}
		decryptedValue, err = crypto.DecryptAESGCM(*field.fieldPtr, secret)
		if err != nil {
			log.Printf("Warning: Failed to decrypt %s for firearm ID %d: %v", field.name, firearm.ID, err)
			*field.fieldPtr = "" // Set to empty on error
		} else {
			*field.fieldPtr = decryptedValue
		}
	}

	// Decrypt AcquisitionDate (from *string -> Raw *time.Time)
	firearm.AcquisitionDateRaw = nil // Reset raw field
	if firearm.AcquisitionDate != nil && *firearm.AcquisitionDate != "" {
		decryptedDateStr, err := crypto.DecryptAESGCM(*firearm.AcquisitionDate, secret)
		if err != nil {
			log.Printf("Warning: Failed to decrypt AcquisitionDate string for firearm ID %d: %v", firearm.ID, err)
		} else {
			t, err := time.Parse(time.RFC3339, decryptedDateStr)
			if err == nil {
				firearm.AcquisitionDateRaw = &t
			} else {
				log.Printf("Warning: Failed to parse decrypted AcquisitionDate string '%s' for firearm ID %d: %v", decryptedDateStr, firearm.ID, err)
			}
		}
	}

	// Decrypt PurchasePrice (from *string -> Raw decimal.Decimal)
	firearm.PurchasePriceRaw = nil
	if firearm.PurchasePrice != nil && *firearm.PurchasePrice != "" {
		decryptedPriceStr, err := crypto.DecryptAESGCM(*firearm.PurchasePrice, secret)
		if err != nil {
			log.Printf("Warning: Failed to decrypt PurchasePrice string for firearm ID %d: %v", firearm.ID, err)
		} else {
			price, err := decimal.NewFromString(decryptedPriceStr)
			if err != nil {
				log.Printf("Warning: Failed to convert decrypted PurchasePrice string to decimal for firearm ID %d: %v", firearm.ID, err)
			} else {
				firearm.PurchasePriceRaw = &price
			}
		}
	}

	// Decrypt Image (*string -> Raw string)
	firearm.ImageRaw = ""
	if firearm.Image != nil && *firearm.Image != "" {
		decryptedValue, err = crypto.DecryptAESGCM(*firearm.Image, secret)
		if err != nil {
			log.Printf("Warning: Failed to decrypt Image for firearm ID %d: %v", firearm.ID, err)
		} else {
			firearm.ImageRaw = decryptedValue
		}
	}

	// Decrypt RoundCount (*string -> Raw int)
	firearm.RoundCountRaw = 0
	if firearm.RoundCount != nil && *firearm.RoundCount != "" {
		decryptedValue, err = crypto.DecryptAESGCM(*firearm.RoundCount, secret)
		if err != nil {
			log.Printf("Warning: Failed to decrypt RoundCount for firearm ID %d: %v", firearm.ID, err)
		} else {
			count, convErr := strconv.Atoi(decryptedValue)
			if convErr != nil {
				log.Printf("Warning: Failed to convert decrypted RoundCount '%s' to int for firearm ID %d: %v", decryptedValue, firearm.ID, convErr)
			} else {
				firearm.RoundCountRaw = count
			}
		}
	}

	// Decrypt Value (*string -> Raw float64)
	firearm.ValueRaw = 0.0
	if firearm.Value != nil && *firearm.Value != "" {
		decryptedValue, err = crypto.DecryptAESGCM(*firearm.Value, secret)
		if err != nil {
			log.Printf("Warning: Failed to decrypt Value for firearm ID %d: %v", firearm.ID, err)
		} else {
			val, convErr := strconv.ParseFloat(decryptedValue, 64)
			if convErr != nil {
				log.Printf("Warning: Failed to convert decrypted Value '%s' to float64 for firearm ID %d: %v", decryptedValue, firearm.ID, convErr)
			} else {
				firearm.ValueRaw = val
			}
		}
	}

	// Decrypt Status (*string -> Raw string)
	firearm.StatusRaw = ""
	if firearm.Status != nil && *firearm.Status != "" {
		decryptedValue, err = crypto.DecryptAESGCM(*firearm.Status, secret)
		if err != nil {
			log.Printf("Warning: Failed to decrypt Status for firearm ID %d: %v", firearm.ID, err)
		} else {
			firearm.StatusRaw = decryptedValue
		}
	}

	return nil // Logged errors internally, return success overall
}

// --- Utility Functions ---

// Helper function to safely dereference a string pointer, returning empty string if nil
func derefStringPtr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// Helper function to create a string pointer from a string, returning nil if the string is empty
func ptrToStringIfNotBlank(s string) *string {
	if s == "" {
		return nil
	}
	return &s // Return address of the input string (safe within this context or use a copy)
	// Alternative: Create a copy to be safer if s source is mutable/temporary
	// copy := s
	// return &copy
}

// Helper function to safely dereference an int pointer
func derefIntPtr(i *int) int {
	if i == nil {
		return 0 // Or decide on appropriate default
	}
	return *i
}

// Helper function to safely dereference a float64 pointer
func derefFloat64Ptr(f *float64) float64 {
	if f == nil {
		return 0.0 // Or decide on appropriate default
	}
	return *f
}

// Helper function to safely dereference a decimal.Decimal pointer
func derefDecimalPtr(d *decimal.Decimal) decimal.Decimal {
	if d == nil {
		return decimal.Zero // Or decide on appropriate default
	}
	return *d
}

// newFirearmResponse converts a decrypted models.Firearm (with Raw fields populated) to a FirearmResponse DTO.
func newFirearmResponse(firearm *models.Firearm) FirearmResponse {
	// Assumes decryptFirearmData has been called and populated Raw fields and standard string fields
	var acqDate *time.Time
	if firearm.AcquisitionDateRaw != nil {
		// Create a copy to avoid returning pointer to internal struct field if firearm is reused
		t := *firearm.AcquisitionDateRaw
		acqDate = &t
	}

	response := FirearmResponse{
		ID:                   firearm.ID,
		OwnerUserID:          firearm.UserID, // Corrected field name from OwnerUserID
		Name:                 firearm.Name,
		Type:                 firearm.Type,
		SerialNumber:         firearm.SerialNumber,
		Manufacturer:         ptrToStringIfNotBlank(firearm.Manufacturer), // Use helper
		ModelName:            ptrToStringIfNotBlank(firearm.ModelName),    // Use helper
		Caliber:              firearm.Caliber,
		AcquisitionDate:      firearm.AcquisitionDate,                             // Encrypted string
		AcquisitionDateRaw:   acqDate,                                             // Decrypted date (pointer to copy)
		PurchasePrice:        nil,                                                 // Will be set below based on PurchasePriceRaw
		BallisticPerformance: ptrToStringIfNotBlank(firearm.BallisticPerformance), // Use helper
		LastFired:            firearm.LastFired,                                   // Not encrypted
		Image:                firearm.Image,                                       // Encrypted string
		ImageRaw:             firearm.ImageRaw,                                    // Decrypted string
		RoundCount:           firearm.RoundCount,                                  // Encrypted string
		RoundCountRaw:        firearm.RoundCountRaw,                               // Decrypted int
		LastCleaned:          firearm.LastCleaned,                                 // Not encrypted
		Value:                firearm.Value,                                       // Encrypted string
		ValueRaw:             firearm.ValueRaw,                                    // Decrypted float64
		Status:               firearm.Status,                                      // Encrypted string
		StatusRaw:            firearm.StatusRaw,                                   // Decrypted string
		CreatedAt:            firearm.CreatedAt,
		UpdatedAt:            firearm.UpdatedAt,
	}

	// Convert PurchasePriceRaw (*decimal.Decimal) to *string for response.PurchasePrice
	if firearm.PurchasePriceRaw != nil {
		priceStr := firearm.PurchasePriceRaw.StringFixed(2) // Format to 2 decimal places
		response.PurchasePrice = &priceStr
	} else if firearm.PurchasePrice != nil {
		// Optional: If raw is nil but encrypted exists, include encrypted string? Maybe not needed if raw is primary.
		// Consider if we should *always* prefer the Raw value if it exists, even if Price exists.
		// For now, only setting based on Raw.
		// response.PurchasePrice = firearm.PurchasePrice
	}

	return response
}

// --- Handlers ---

// CreateFirearmHandler godoc
// @Summary Create a new firearm (Encrypted storage)
// @Description Create a new firearm record. Sensitive fields are encrypted before saving.
// @Tags firearms
// @Accept json
// @Produce json
// @Param firearm body CreateFirearmRequest true "Firearm details"
// @Success 201 {object} FirearmResponse
// @Failure 400 {object} map[string]string "Bad request (e.g., validation, date/price parsing, encryption failure)"
// @Failure 500 {object} map[string]string "Internal server error (e.g., database failure)"
// @Router /api/firearms [post]
func CreateFirearmHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// 1. Parse Request Body into DTO
		req := new(CreateFirearmRequest)
		if err := c.BodyParser(req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON: " + err.Error()})
		}

		// Get UserID from auth middleware context
		userID, ok := c.Locals("userID").(uint)
		if !ok || userID == 0 {
			log.Println("Error: UserID not found or invalid in context")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: User ID missing or invalid"})
		}

		// 2. Map DTO to Model (populate Raw fields, leave encrypted fields blank initially)
		firearm := models.Firearm{
			UserID:               userID, // Use userID from context
			Name:                 req.Name,
			Type:                 req.Type,
			SerialNumber:         req.SerialNumber,
			Manufacturer:         derefStringPtr(req.Manufacturer), // Dereference DTO *string -> model string
			ModelName:            derefStringPtr(req.ModelName),    // Dereference DTO *string -> model string
			Caliber:              derefStringPtr(req.Caliber),
			BallisticPerformance: derefStringPtr(req.BallisticPerformance), // Dereference DTO *string -> model string
			// Populate Raw fields for date/price/others based on request
			AcquisitionDateRaw: req.AcquisitionDateRaw, // Assign directly from DTO
			PurchasePriceRaw:   nil,                    // Initialize to nil, handle below
			ImageRaw:           derefStringPtr(req.ImageRaw),
			RoundCountRaw:      derefIntPtr(req.RoundCountRaw),
			ValueRaw:           derefFloat64Ptr(req.ValueRaw),
			StatusRaw:          derefStringPtr(req.StatusRaw),
			// LastFired, LastCleaned might be set separately or have defaults?
		}

		// Handle PurchasePrice (string -> *decimal.Decimal) - Moved outside struct literal
		if req.PurchasePrice != nil && *req.PurchasePrice != "" {
			price, err := decimal.NewFromString(*req.PurchasePrice)
			if err != nil {
				log.Printf("Error parsing PurchasePrice string '%s' to decimal: %v", *req.PurchasePrice, err)
				return fiber.NewError(fiber.StatusBadRequest, fmt.Sprintf("Invalid PurchasePrice format: %s", *req.PurchasePrice))
			}
			firearm.PurchasePriceRaw = &price // Store pointer to the decimal
		}

		// 4. Encrypt sensitive data IN PLACE (reads from Raw fields, writes to encrypted fields)
		if err := encryptFirearmData(&firearm, cfg.ArmorySecret); err != nil {
			log.Printf("Encryption failed during firearm creation: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to process firearm data (encryption)"})
		}

		// 5. Create record in DB (Raw fields are ignored by GORM due to `gorm:"-"`)
		result := db.Create(&firearm)
		if result.Error != nil {
			log.Printf("Database error during firearm creation: %v", result.Error)
			// Check for unique constraint violation (PostgreSQL specific code '23505')
			var pgErr *pgconn.PgError
			if errors.As(result.Error, &pgErr) && pgErr.Code == "23505" {
				// You might want to check pgErr.ConstraintName if needed, but checking the code is often enough
				log.Printf("Unique constraint violation on serial number: %s", firearm.SerialNumber)
				return c.Status(fiber.StatusConflict).JSON(fiber.Map{
					"error": fmt.Sprintf("Firearm with serial number '%s' already exists.", firearm.SerialNumber),
				})
			}
			// Generic error if it's not a unique constraint violation we handled
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save firearm"})
		}

		// 6. Decrypt the created firearm data *before* converting to response DTO
		// GORM populates ID, CreatedAt etc. Decryption populates Raw fields.
		if err := decryptFirearmData(&firearm, cfg.ArmorySecret); err != nil {
			log.Printf("Decryption failed after creating firearm ID %d: %v. Response data might be incomplete.", firearm.ID, err)
			// Decide if error should be returned or just logged. For now, log and proceed.
		}

		// 7. Convert to Response DTO and return
		response := newFirearmResponse(&firearm)
		return c.Status(fiber.StatusCreated).JSON(response)
	}
}

// UpdateFirearmHandler godoc
// @Summary Update an existing firearm (Encrypted storage)
// @Description Update an existing firearm record by ID. Sensitive fields are re-encrypted before saving.
// @Tags firearms
// @Accept json
// @Produce json
// @Param id path int true "Firearm ID"
// @Param firearm body CreateFirearmRequest true "Updated firearm details"
// @Success 200 {object} FirearmResponse
// @Failure 400 {object} map[string]string "Bad request (e.g., validation, ID format, encryption failure)"
// @Failure 404 {object} map[string]string "Firearm not found"
// @Failure 500 {object} map[string]string "Internal server error (e.g., database failure)"
// @Router /api/firearms/{id} [put]
func UpdateFirearmHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// 1. Get ID and check format
		id, err := strconv.Atoi(c.Params("id"))
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID format"})
		}

		// Get UserID from auth context
		userID, ok := c.Locals("userID").(uint)
		if !ok || userID == 0 {
			log.Println("Error: UserID not found or invalid in context during update")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: User ID missing or invalid"})
		}

		// 2. Find existing firearm *for the authenticated user*
		var existingFirearm models.Firearm
		result := db.Where("user_id = ?", userID).First(&existingFirearm, id)
		if result.Error != nil {
			if errors.Is(result.Error, gorm.ErrRecordNotFound) {
				// More specific error: Not found OR not authorized
				return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": fmt.Sprintf("Firearm with ID %d not found or does not belong to user", id)})
			}
			log.Printf("Database error finding firearm ID %d for update: %v", id, result.Error)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error finding firearm"})
		}

		// 3. Parse Request Body into DTO
		req := new(CreateFirearmRequest)
		if err := c.BodyParser(req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON: " + err.Error()})
		}

		// 4. Update fields of the existing model instance using data from request DTO
		// We overwrite the existingFirearm's fields with potentially new unencrypted data
		// before re-encrypting everything.
		// existingFirearm.UserID = userID // Usually don't allow changing owner
		existingFirearm.Name = req.Name
		existingFirearm.Type = req.Type
		existingFirearm.SerialNumber = req.SerialNumber                 // Should changing SN be allowed?
		existingFirearm.Manufacturer = derefStringPtr(req.Manufacturer) // Deref DTO *string -> model string
		existingFirearm.ModelName = derefStringPtr(req.ModelName)       // Deref DTO *string -> model string
		existingFirearm.Caliber = derefStringPtr(req.Caliber)
		existingFirearm.BallisticPerformance = derefStringPtr(req.BallisticPerformance) // Deref DTO *string -> model string
		// Update Raw fields for date/price/others based on request
		existingFirearm.AcquisitionDateRaw = req.AcquisitionDateRaw           // Assign directly from DTO
		// Handle PurchasePrice (string -> *decimal.Decimal)
		if req.PurchasePrice != nil {
			if *req.PurchasePrice == "" {
				// Explicitly clear if an empty string is sent
				existingFirearm.PurchasePriceRaw = nil
			} else {
				price, err := decimal.NewFromString(*req.PurchasePrice)
				if err != nil {
					log.Printf("Error parsing PurchasePrice string '%s' to decimal: %v", *req.PurchasePrice, err)
					return fiber.NewError(fiber.StatusBadRequest, fmt.Sprintf("Invalid PurchasePrice format: %s", *req.PurchasePrice))
				}
				existingFirearm.PurchasePriceRaw = &price // Store pointer to the decimal
			}
		} // If req.PurchasePrice is nil, we ignore it and leave existingFirearm.PurchasePriceRaw as is
		existingFirearm.ImageRaw = derefStringPtr(req.ImageRaw)
		existingFirearm.RoundCountRaw = derefIntPtr(req.RoundCountRaw)
		existingFirearm.ValueRaw = derefFloat64Ptr(req.ValueRaw)
		existingFirearm.StatusRaw = derefStringPtr(req.StatusRaw)
		// Handle LastFired, LastCleaned updates if included in DTO

		// 5. Re-encrypt all sensitive fields IN PLACE before saving
		if err := encryptFirearmData(&existingFirearm, cfg.ArmorySecret); err != nil {
			log.Printf("Encryption failed during firearm update for ID %d: %v", id, err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to process firearm data for update (encryption)"})
		}

		// 6. Save updated record (GORM automatically updates UpdatedAt)
		result = db.Save(&existingFirearm)
		if result.Error != nil {
			log.Printf("Database error updating firearm ID %d: %v", id, result.Error)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update firearm"})
		}

		// 7. Decrypt the updated firearm data *before* converting to response DTO
		if err := decryptFirearmData(&existingFirearm, cfg.ArmorySecret); err != nil {
			log.Printf("Decryption failed after updating firearm ID %d: %v. Response data might be incomplete.", existingFirearm.ID, err)
			// Log and proceed
		}

		// 8. Convert to Response DTO and return
		response := newFirearmResponse(&existingFirearm)
		return c.JSON(response)
	}
}

// GetFirearmsHandler godoc
// @Summary Retrieve all firearms (Decrypted)
// @Description Retrieve a list of all firearms for the authenticated user. Sensitive fields are decrypted.
// @Tags firearms
// @Produce json
// @Success 200 {array} FirearmResponse
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 500 {object} map[string]string "Internal server error or decryption failed"
// @Security BearerAuth
// @Router /firearms [get]
func GetFirearmsHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID := c.Locals("userID").(uint)
		var firearms []models.Firearm

		result := db.Where("user_id = ?", userID).Find(&firearms)
		if result.Error != nil {
			log.Printf("Database error retrieving firearms for user %d: %v", userID, result.Error)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve firearms"})
		}

		responses := make([]FirearmResponse, len(firearms))
		for i := range firearms {
			f := &firearms[i] // Get pointer to the item in the slice
			if err := decryptFirearmData(f, cfg.ArmorySecret); err != nil {
				log.Printf("Decryption failed for firearm ID %d: %v. Response data might be incomplete.", f.ID, err)
				// Continue processing others, response for this one will have nil sensitive fields where decryption failed
			}
			responses[i] = newFirearmResponse(f)
		}

		return c.JSON(responses)
	}
}

// GetFirearmByIDHandler godoc
// @Summary Retrieve a specific firearm by ID (Decrypted)
// @Description Retrieve details of a specific firearm by its ID for the authenticated user. Sensitive fields are decrypted.
// @Tags firearms
// @Produce json
// @Param id path int true "Firearm ID"
// @Success 200 {object} FirearmResponse
// @Failure 400 {object} map[string]string "Invalid ID format"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 404 {object} map[string]string "Firearm not found"
// @Failure 500 {object} map[string]string "Internal server error or decryption failed"
// @Security BearerAuth
// @Router /firearms/{id} [get]
func GetFirearmByIDHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID := c.Locals("userID").(uint)
		id, err := strconv.ParseUint(c.Params("id"), 10, 64)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid firearm ID format"})
		}

		var firearm models.Firearm
		result := db.Where("id = ? AND user_id = ?", id, userID).First(&firearm)
		if result.Error != nil {
			if errors.Is(result.Error, gorm.ErrRecordNotFound) {
				return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Firearm not found"})
			}
			log.Printf("Database error retrieving firearm ID %d for user %d: %v", id, userID, result.Error)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve firearm"})
		}

		// Decrypt the firearm data
		if err := decryptFirearmData(&firearm, cfg.ArmorySecret); err != nil {
			log.Printf("Decryption failed for firearm ID %d: %v. Response data might be incomplete.", firearm.ID, err)
			// Log and proceed, data will be partially returned
		}

		// Convert to Response DTO and return
		response := newFirearmResponse(&firearm)
		return c.JSON(response)
	}
}

// DeleteFirearmHandler godoc
// @Summary Delete a firearm
// @Description Remove a firearm record by its ID for the authenticated user.
// @Tags firearms
// @Produce json
// @Param id path int true "Firearm ID"
// @Success 200 {object} map[string]string "Success message"
// @Failure 400 {object} map[string]string "Invalid ID format"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 404 {object} map[string]string "Firearm not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Security BearerAuth
// @Router /firearms/{id} [delete]
func DeleteFirearmHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID := c.Locals("userID").(uint)
		id, err := strconv.ParseUint(c.Params("id"), 10, 64)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid firearm ID format"})
		}

		// Use unscoped delete if you want to bypass soft delete, otherwise standard Delete
		// First check if the firearm belongs to the user
		var firearm models.Firearm
		if err := db.Where("id = ? AND user_id = ?", id, userID).First(&firearm).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Firearm not found"})
			}
			log.Printf("Database error checking firearm ID %d for user %d before delete: %v", id, userID, err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to verify firearm before deletion"})
		}

		// Proceed with delete
		result := db.Delete(&models.Firearm{}, id)

		if result.Error != nil {
			log.Printf("Database error deleting firearm ID %d: %v", id, result.Error)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete firearm"})
		}

		if result.RowsAffected == 0 {
			// Should not happen if we found it above, but handle defensively
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Firearm not found or already deleted"})
		}

		return c.JSON(fiber.Map{"message": "Firearm deleted successfully"})
	}
}
