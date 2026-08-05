package database

import (
	"log"

	"github.com/krisn4novianto/wartegkita/backend/models"
)

func CreateMenuTable() {
	if err := DB.AutoMigrate(&models.Menu{}); err != nil {
		log.Println("Gagal migrasi tabel menus:", err)
		return
	}
	log.Println("✅ Tabel menus siap")
}

