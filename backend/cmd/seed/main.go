// cmd/seed/main.go  jalankan seeder secara standalone:
//
//	go run ./cmd/seed/main.go
package main

import (
	"log"

	"github.com/joho/godotenv"

	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/seed"
)

func main() {
	// Load .env (optional  tidak fatal jika tidak ada)
	if err := godotenv.Load("../../.env"); err != nil {
		log.Println("  .env tidak ditemukan, pakai default env")
	}

	// Koneksi + AutoMigrate
	database.Connect()

	// Jalankan semua seeder
	seed.Run(database.DB)
}
