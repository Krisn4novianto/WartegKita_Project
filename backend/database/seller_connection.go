package database

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

var SellerDB *sql.DB

func ConnectSellerDB() {

	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5433")
	user := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASSWORD", "Krisn@12345")

	dsnAdmin := fmt.Sprintf("host=%s port=%s user=%s password=%s sslmode=disable", host, port, user, password)

	adminDB, err := sql.Open("postgres", dsnAdmin)

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

	dsnSeller := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=sell_wartegkita sslmode=disable", host, port, user, password)

	SellerDB, err = sql.Open("postgres", dsnSeller)

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

