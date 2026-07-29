package database

import (
	"log"

	"github.com/krisn4novianto/wartegkita/backend/models"
)

func CreateOrderItemsTable() {
	if err := DB.AutoMigrate(&models.OrderItem{}); err != nil {
		log.Println("Gagal migrasi tabel order_items:", err)
		return
	}
	log.Println(" Tabel order_items siap")
}

