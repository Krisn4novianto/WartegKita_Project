package database

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

var SellerDB *sql.DB

func ConnectSellerDB() {

	adminDB, err := sql.Open(
		"postgres",
		"host=localhost port=5432 user=postgres password=Krisn@12345 sslmode=disable",
	)

	if err != nil {
		log.Fatal(err)
	}

	if err = adminDB.Ping(); err != nil {
		log.Fatal(err)
	}

	var exists bool

	err = adminDB.QueryRow(`

		SELECT EXISTS(

			SELECT FROM pg_database

			WHERE datname='sell_wartegkita'

		)

	`).Scan(&exists)

	if err != nil {
		log.Fatal(err)
	}

	if !exists {

		_, err = adminDB.Exec(`

			CREATE DATABASE sell_wartegkita

		`)

		if err != nil {

			log.Fatal(
				"Gagal membuat sell_wartegkita:",
				err,
			)

		}

		fmt.Println(
			"✅ Database sell_wartegkita berhasil dibuat",
		)

	}

	adminDB.Close()

	SellerDB, err = sql.Open(
		"postgres",
		"host=localhost port=5432 user=postgres password=Krisn@12345 dbname=sell_wartegkita sslmode=disable",
	)

	if err != nil {
		log.Fatal(err)
	}

	if err = SellerDB.Ping(); err != nil {
		log.Fatal(err)
	}

	fmt.Println(
		"✅ PostgreSQL Connected -> sell_wartegkita",
	)

}
