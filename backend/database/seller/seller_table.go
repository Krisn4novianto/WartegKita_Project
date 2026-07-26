package seller

import (
	"database/sql"
	"log"
)

func CreateSellerPendapatanTable(
	db *sql.DB,
) {

	_, err := db.Exec(`

	CREATE TABLE IF NOT EXISTS public.seller_pendapatan (

		id SERIAL PRIMARY KEY,

		transaction_id INT NOT NULL,

		seller_id INT NOT NULL,

		transaction_date DATE NOT NULL,

		gross_amount NUMERIC(12,2)
		DEFAULT 0,

		total_transaction INT
		DEFAULT 0,

		total_customer INT
		DEFAULT 0,

		transaction_status VARCHAR(50)
		NOT NULL,

		created_at TIMESTAMP
		DEFAULT CURRENT_TIMESTAMP,

		last_at TIMESTAMP
		DEFAULT CURRENT_TIMESTAMP

	);

	`)

	if err != nil {

		log.Fatal(
			"Gagal membuat seller_pendapatan:",
			err,
		)

	}

	log.Println(
		"✅ seller_pendapatan table ready",
	)

}
