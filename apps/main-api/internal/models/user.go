package models

import "gorm.io/gorm"

// Product defines the structure for product data in the database.
type User struct {
	gorm.Model
	Name     string
	Email    string
	Password string
}
