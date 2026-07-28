package database

import "log"

func CreateOrderItemsTable() {

	query := `

	CREATE TABLE IF NOT EXISTS order_items (

		id UUID PRIMARY KEY,

		order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

		menu_id VARCHAR(100) NOT NULL,

		menu_name VARCHAR(100) NOT NULL,

		quantity INT NOT NULL DEFAULT 1,

		price NUMERIC(12,2) NOT NULL DEFAULT 0,

		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

	);

	`

	_, err := DB.Exec(query)

	if err != nil {

		log.Fatal(
			"Gagal membuat tabel order_items:",
			err,
		)

	}

	log.Println("✅ Tabel order_items siap")

}
