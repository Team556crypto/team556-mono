package main

import (
	"log"
	"path/filepath"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables from root .env
	rootEnvPath := filepath.Join("..", "..", ".env")
	err := godotenv.Load(rootEnvPath)
	if err != nil {
		log.Printf("Warning: could not load root .env file: %v", err)
	}
	app := fiber.New()

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Hello, World!")
	})

	app.Listen(":3000")
}
