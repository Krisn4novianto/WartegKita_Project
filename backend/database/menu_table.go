package database

import "log"

func CreateMenuTable() {

	query := `

	CREATE TABLE IF NOT EXISTS menus (
		id VARCHAR(100) PRIMARY KEY,
		seller_id VARCHAR(100) NOT NULL,
		name VARCHAR(100) NOT NULL,
		description TEXT,
		price NUMERIC(12,2) NOT NULL DEFAULT 0,
		stock INT NOT NULL DEFAULT 0,
		category VARCHAR(50) NOT NULL,
		image TEXT,
		available BOOLEAN DEFAULT TRUE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

	);

	`

	_, err := SellerDB.Exec(query)

	if err != nil {

		log.Fatal(
			"Gagal membuat tabel menus:",
			err,
		)

	}

	log.Println(
		"✅ Tabel menus siap",
	)

}
