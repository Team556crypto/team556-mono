package handlers

import (
	"github.com/gofiber/fiber/v2"
	// "github.com/team556-mono/server/internal/database" // Example: Uncomment if needed
	// "github.com/team556-mono/server/internal/models" // Example: Uncomment if needed
)

// HelloWorld handles the request to the root path.
func HelloWorld(c *fiber.Ctx) error {
	// Example database interaction (replace with actual logic):
	// var product models.Product
	// result := database.DB.First(&product, 1) // find product with integer primary key
	// if result.Error != nil {
	// 	 return c.Status(fiber.StatusInternalServerError).SendString("Could not find product")
	// }
	// return c.JSON(product)
	return c.SendString("Hello, World from the new structure!")
}
