package database

import (
	"log"
	"time"

	"github.com/krisn4novianto/wartegkita/backend/models"
)

func DeleteExpiredOrders() {
	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
	err := DB.Where("created_at <= ?", thirtyDaysAgo).Delete(&models.Order{}).Error
	if err != nil {
		log.Println("Gagal menghapus history order:", err)
		return
	}

	log.Println("✅ History order lebih dari 30 hari berhasil dibersihkan")
}

