package database

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

// DB adalah koneksi database utama aplikasi
var DB *sql.DB

// Connect melakukan:
// 1. Connect ke PostgreSQL server
// 2. Mengecek database cust_wartegkita sudah ada atau belum
// 3. Membuat database jika belum ada
// 4. Connect ke database aplikasi
func Connect() {

	// =====================================
	// CONNECT KE POSTGRES DEFAULT
	// =====================================

	adminDB, err := sql.Open(
		"postgres",
		"host=localhost port=5432 user=postgres password=Krisn@12345 sslmode=disable",
	)

	if err != nil {
		log.Fatal("Gagal membuka koneksi PostgreSQL:", err)
	}

	if err = adminDB.Ping(); err != nil {
		log.Fatal("Gagal koneksi PostgreSQL:", err)
	}

	// =====================================
	// CEK DATABASE CUST_WARTEGKITA
	// =====================================

	var exists bool

	err = adminDB.QueryRow(`
		SELECT EXISTS(
			SELECT FROM pg_database
			WHERE datname = 'cust_wartegkita'
		)
	`).Scan(&exists)

	if err != nil {
		log.Fatal("Gagal mengecek database:", err)
	}

	// =====================================
	// BUAT DATABASE JIKA BELUM ADA
	// =====================================

	if !exists {

		_, err = adminDB.Exec(`
			CREATE DATABASE cust_wartegkita
		`)

		if err != nil {
			log.Fatal("Gagal membuat database cust_wartegkita:", err)
		}

		fmt.Println("✅ Database cust_wartegkita berhasil dibuat")
	}

	// Tutup koneksi admin
	adminDB.Close()

	// =====================================
	// CONNECT KE DATABASE APLIKASI
	// =====================================

	DB, err = sql.Open(
		"postgres",
		"host=localhost port=5432 user=postgres password=Krisn@12345 dbname=cust_wartegkita sslmode=disable",
	)

	if err != nil {
		log.Fatal("Gagal membuka database aplikasi:", err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatal("Gagal koneksi database cust_wartegkita:", err)
	}

	fmt.Println("✅ PostgreSQL Connected -> cust_wartegkita")
}
