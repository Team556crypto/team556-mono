package database

import (
	"log"

	"github.com/team556-mono/server/internal/config"
	"github.com/team556-mono/server/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

// InitDatabase connects to the database and performs auto-migration.
func InitDatabase() {
	var err error
	dsn := config.GetEnv("MAIN_API__DB_POOLER", "") // Use pooler by default
	if dsn == "" {
		log.Fatal("Error: MAIN_API__DB_POOLER environment variable not set.")
	}

	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Error connecting to database: %v", err)
	}
	log.Println("Database connection successful!")

	// Auto-migrate models
	err = DB.AutoMigrate(&models.Product{}) // Add other models here
	if err != nil {
		// Log as a warning instead of fatal, as existing tables are expected
		log.Printf("Warning during database migration: %v", err) 
	} else {
	    log.Println("Database migration successful!")
	}
}
