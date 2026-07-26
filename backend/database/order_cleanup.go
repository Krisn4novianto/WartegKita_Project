package database

import "log"

func DeleteExpiredOrders() {

	query := `
	DELETE FROM orders
	WHERE created_at <= NOW() - INTERVAL '30 days';
	`

	_, err := DB.Exec(query)

	if err != nil {
		log.Println("Gagal menghapus history order:", err)
		return
	}

	log.Println("✅ History order lebih dari 30 hari berhasil dibersihkan")
}
