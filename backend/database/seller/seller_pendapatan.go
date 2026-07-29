package seller

import (
	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/models"
)

func GetPendapatanDashboard(
	unusedDB interface{},
	sellerID string,
) (*models.SellerDashboard, error) {
	var data models.SellerDashboard

	db := database.DB

	// TOTAL PENDAPATAN
	db.Model(&models.SellerPendapatan{}).
		Select("COALESCE(SUM(gross_amount), 0)").
		Where("seller_id = ? AND transaction_status = 'SUCCESS'", sellerID).
		Scan(&data.TotalPendapatan)

	// TOTAL CUSTOMER
	db.Model(&models.SellerPendapatan{}).
		Select("COALESCE(SUM(total_customer), 0)").
		Where("seller_id = ? AND transaction_status = 'SUCCESS'", sellerID).
		Scan(&data.TotalPembeli)

	// TOTAL TRANSAKSI
	db.Model(&models.SellerPendapatan{}).
		Select("COALESCE(SUM(total_transaction), 0)").
		Where("seller_id = ? AND transaction_status = 'SUCCESS'", sellerID).
		Scan(&data.TotalTransaksi)

	// RATA-RATA PENJUALAN HARIAN
	db.Model(&models.SellerPendapatan{}).
		Select("COALESCE(SUM(gross_amount) / NULLIF(COUNT(DISTINCT transaction_date), 0), 0)").
		Where("seller_id = ? AND transaction_status = 'SUCCESS'", sellerID).
		Scan(&data.RataRataHarian)

	return &data, nil
}
