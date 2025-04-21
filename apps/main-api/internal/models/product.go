package models

import "gorm.io/gorm"

// Product defines the structure for product data in the database.
type Product struct {
	gorm.Model
	Code  string `gorm:"unique"` // Example: Added unique constraint
	Price uint
}
