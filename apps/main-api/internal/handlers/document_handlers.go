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

// CreateDocumentHandler handles creating a new document entry
func CreateDocumentHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
		}

		var document models.Document
		if err := c.BodyParser(&document); err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
		}

		document.UserID = userID

		if err := db.Create(&document).Error; err != nil {
			log.Printf("Error creating document: %v", err)
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create document"})
		}

		return c.Status(http.StatusCreated).JSON(document)
	}
}

// GetDocumentsHandler handles retrieving all documents for the authenticated user
func GetDocumentsHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
		}

		var documents []models.Document
		if err := db.Where("user_id = ?", userID).Find(&documents).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not retrieve documents"})
		}

		return c.JSON(documents)
	}
}

// GetDocumentByIDHandler handles retrieving a specific document by its ID
func GetDocumentByIDHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
		}

		idStr := c.Params("id")
		documentID, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid document ID"})
		}

		var document models.Document
		if err := db.Where("id = ? AND user_id = ?", uint(documentID), userID).First(&document).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Document not found"})
			}
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not retrieve document"})
		}

		return c.JSON(document)
	}
}

// UpdateDocumentHandler handles updating an existing document entry
func UpdateDocumentHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
		}

		idStr := c.Params("id")
		documentID, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid document ID"})
		}

		var document models.Document
		if err := db.Where("id = ? AND user_id = ?", uint(documentID), userID).First(&document).Error; err != nil {
			return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Document not found"})
		}

		var updateData models.Document
		if err := c.BodyParser(&updateData); err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
		}

		if err := db.Model(&document).Updates(updateData).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not update document"})
		}

		return c.JSON(document)
	}
}

// DeleteDocumentHandler handles deleting a document entry
func DeleteDocumentHandler(db *gorm.DB, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(uint)
		if !ok {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: missing user ID"})
		}

		idStr := c.Params("id")
		documentID, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid document ID"})
		}

		if err := db.Where("id = ? AND user_id = ?", uint(documentID), userID).Delete(&models.Document{}).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Could not delete document"})
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{"message": "Document deleted successfully"})
	}
}
