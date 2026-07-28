package database

import "log"

func CreateOrderTable() {

	query := `
	CREATE TABLE IF NOT EXISTS orders (

		id UUID PRIMARY KEY,

		order_number VARCHAR(50) UNIQUE NOT NULL,

		user_id UUID NOT NULL,

		seller_id VARCHAR(100) NOT NULL,


		-- STATUS PESANAN SELLER
		status VARCHAR(30) NOT NULL DEFAULT 'WAITING_CONFIRMATION',


		-- STATUS PEMBAYARAN CUSTOMER
		payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',


		total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,


		payment_method VARCHAR(50),


		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

	);
	`

	_, err := DB.Exec(query)

	if err != nil {

		log.Fatal(
			"Gagal membuat tabel orders:",
			err,
		)

	}

	log.Println("✅ Tabel orders siap")

}
