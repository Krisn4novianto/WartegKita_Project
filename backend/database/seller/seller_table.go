package seller

import (
	"log"

	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/models"
)

func CreateSellerPendapatanTable(db ...interface{}) {
	if err := database.DB.AutoMigrate(&models.SellerPendapatan{}); err != nil {
		log.Println("Gagal membuat seller_pendapatan:", err)
		return
	}
	log.Println("✅ seller_pendapatan table ready")
}

