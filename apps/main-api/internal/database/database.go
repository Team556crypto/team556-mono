package database

import (
	"log"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/team556-mono/server/internal/models"
)

// InitDB initializes the database connection using the provided URL.
func InitDB(databaseURL string) (*gorm.DB, error) {
	var err error
	logLevel := logger.Info // Default log level

	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		Logger:                                   logger.Default.LogMode(logLevel),
		DisableForeignKeyConstraintWhenMigrating: false, // Prevent GORM from managing constraints
	})

	if err != nil {
		log.Printf("Failed to connect to database: %v", err)
		return nil, err // Return error
	}

	log.Println("Database connection established successfully.")

	// Configure connection pool settings (optional)
	sqlDB, err := db.DB()
	if err != nil {
		log.Printf("Failed to get underlying sql.DB: %v", err)
		return nil, err // Return error
	}
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	log.Println("Running database migrations...")
	// Perform migrations
	err = db.AutoMigrate(
		&models.User{},
		&models.Wallet{},
		&models.PresaleCode{},
	)
	if err != nil {
		// Log migration errors but don't necessarily make it fatal
		// unless schema integrity is absolutely critical for startup.
		log.Printf("Warning: AutoMigrate failed for some models: %v", err)
		// Decide if this should return an error or just log a warning
		// For development, logging might be sufficient.
		// return nil, err // Optionally return error if migration failure is critical
	}
	log.Println("Database migrations completed (or attempted).")

	return db, nil // Return the db instance and nil error
}
