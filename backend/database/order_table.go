package database

import (
	"log"

	"github.com/krisn4novianto/wartegkita/backend/models"
)

func CreateOrderTable() {
	if err := DB.AutoMigrate(&models.Order{}); err != nil {
		log.Println("Gagal migrasi tabel orders:", err)
		return
	}
	log.Println("✅ Tabel orders siap")
}

