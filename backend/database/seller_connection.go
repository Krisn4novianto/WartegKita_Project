package database

import (
	"log"
)

// ConnectSellerDB is deprecated. All models now share the unified database.DB connection via GORM.
func ConnectSellerDB() {
	log.Println("ℹ️ ConnectSellerDB: Using single unified database.DB connection.")
}


