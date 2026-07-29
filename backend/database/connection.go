package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/krisn4novianto/wartegkita/backend/models"
)

// DB adalah koneksi database utama aplikasi (GORM)
var DB *gorm.DB

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists && value != "" {
		return value
	}
	return fallback
}

// Connect melakukan:
// 1. Connect ke PostgreSQL server
// 2. Mengecek database wartegkita_db sudah ada atau belum
// 3. Membuat database jika belum ada
// 4. Connect ke database aplikasi menggunakan GORM
// 5. Menjalankan GORM AutoMigrate untuk seluruh model
func Connect() {
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5433")
	user := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASSWORD", "Krisn@12345")
	dbName := getEnv("DB_NAME", "wartegkita_db")

	// =====================================
	// CONNECT KE POSTGRES DEFAULT ADMIN
	// =====================================
	dsnAdmin := fmt.Sprintf("host=%s port=%s user=%s password=%s sslmode=disable", host, port, user, password)
	adminDB, err := sql.Open("postgres", dsnAdmin)
	if err != nil {
		log.Fatal("Gagal membuka koneksi PostgreSQL:", err)
	}

	if err = adminDB.Ping(); err != nil {
		log.Fatal("Gagal koneksi PostgreSQL:", err)
	}

	// =====================================
	// CEK DATABASE APP
	// =====================================
	var exists bool
	err = adminDB.QueryRow(fmt.Sprintf(`
		SELECT EXISTS(
			SELECT FROM pg_database
			WHERE datname = '%s'
		)
	`, dbName)).Scan(&exists)

	if err != nil {
		log.Fatal("Gagal mengecek database:", err)
	}

	if !exists {
		_, err = adminDB.Exec(fmt.Sprintf("CREATE DATABASE %s", dbName))
		if err != nil {
			log.Fatalf("Gagal membuat database %s: %v", dbName, err)
		}
		fmt.Printf("✅ Database %s berhasil dibuat\n", dbName)
	}

	adminDB.Close()

	// =====================================
	// CONNECT GORM KE DATABASE APLIKASI
	// =====================================
	dsnApp := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", host, port, user, password, dbName)
	DB, err = gorm.Open(postgres.Open(dsnApp), &gorm.Config{})
	if err != nil {
		log.Fatal("Gagal membuka database aplikasi dengan GORM:", err)
	}

	fmt.Printf("✅ GORM PostgreSQL Connected -> %s\n", dbName)

	// =====================================
	// AUTO MIGRATE ALL MODELS
	// Split into sequential calls per dependency level
	// so each parent table is fully created before
	// child tables reference it via FK constraints.
	// =====================================

	// Level 0 — root tables (no FK dependencies)
	if err = DB.AutoMigrate(
		&models.User{},
		&models.SellerProfile{},
		&models.MenuCategory{},
	); err != nil {
		log.Fatal("AutoMigrate level-0 gagal:", err)
	}

	// Level 1 — depend on User / SellerProfile
	if err = DB.AutoMigrate(
		&models.UserAddress{},  // FK → users
		&models.Menu{},         // FK → seller_profiles
	); err != nil {
		log.Fatal("AutoMigrate level-1 gagal:", err)
	}

	// Level 2 — depend on User, SellerProfile, Menu
	if err = DB.AutoMigrate(
		&models.Order{},            // FK → users, seller_profiles
		&models.SellerPendapatan{}, // FK → seller_profiles
	); err != nil {
		log.Fatal("AutoMigrate level-2 gagal:", err)
	}

	// Level 3 — depend on Order, Menu
	if err = DB.AutoMigrate(
		&models.OrderItem{}, // FK → orders, menus
	); err != nil {
		log.Fatal("AutoMigrate level-3 gagal:", err)
	}

	fmt.Println("✅ GORM AutoMigrate selesai")

	// Explicitly ensure FK constraints that AutoMigrate may skip
	// on pre-existing tables (idempotent — no-op if already exists).
	ensureForeignKeys()

	// Seed menu categories if empty
	SeedMenuCategories()
}

// ensureForeignKeys guarantees all foreign key constraints are applied in PostgreSQL.
func ensureForeignKeys() {
	fkStatements := []struct {
		name string
		sql  string
	}{
		{
			name: "fk_user_addresses_user",
			sql: `DO $$ BEGIN
				IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_addresses_user') THEN
					ALTER TABLE user_addresses ADD CONSTRAINT fk_user_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
				END IF;
			END $$;`,
		},
		{
			name: "fk_menus_seller",
			sql: `DO $$ BEGIN
				IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_menus_seller') THEN
					ALTER TABLE menus ADD CONSTRAINT fk_menus_seller FOREIGN KEY (seller_id) REFERENCES seller_profiles(seller_id) ON DELETE CASCADE;
				END IF;
			END $$;`,
		},
		{
			name: "fk_orders_user",
			sql: `DO $$ BEGIN
				IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_orders_user') THEN
					ALTER TABLE orders ADD CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
				END IF;
			END $$;`,
		},
		{
			name: "fk_orders_seller",
			sql: `DO $$ BEGIN
				IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_orders_seller') THEN
					ALTER TABLE orders ADD CONSTRAINT fk_orders_seller FOREIGN KEY (seller_id) REFERENCES seller_profiles(seller_id) ON DELETE SET NULL;
				END IF;
			END $$;`,
		},
		{
			name: "fk_order_items_order",
			sql: `DO $$ BEGIN
				IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_order_items_order') THEN
					ALTER TABLE order_items ADD CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
				END IF;
			END $$;`,
		},
		{
			name: "fk_order_items_menu",
			sql: `DO $$ BEGIN
				IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_order_items_menu') THEN
					ALTER TABLE order_items ADD CONSTRAINT fk_order_items_menu FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE RESTRICT;
				END IF;
			END $$;`,
		},
		{
			name: "fk_seller_pendapatans_seller",
			sql: `DO $$ BEGIN
				IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_seller_pendapatans_seller') THEN
					ALTER TABLE seller_pendapatans ADD CONSTRAINT fk_seller_pendapatans_seller FOREIGN KEY (seller_id) REFERENCES seller_profiles(seller_id) ON DELETE CASCADE;
				END IF;
			END $$;`,
		},
	}

	for _, stmt := range fkStatements {
		if err := DB.Exec(stmt.sql).Error; err != nil {
			log.Printf("⚠️  Gagal membuat FK %s: %v\n", stmt.name, err)
		} else {
			fmt.Printf("✅ Foreign key verified/created: %s\n", stmt.name)
		}
	}
}



func newUUID() string {
	id, _ := uuid.NewV7()
	return id.String()
}

func SeedMenuCategories() {
	var count int64
	DB.Model(&models.MenuCategory{}).Count(&count)
	if count == 0 {
		categories := []models.MenuCategory{
			{ID: newUUID(), Name: "Nasi Rames", Emoji: "🍛", IsActive: true},
			{ID: newUUID(), Name: "Ayam", Emoji: "🍗", IsActive: true},
			{ID: newUUID(), Name: "Ikan", Emoji: "🐟", IsActive: true},
			{ID: newUUID(), Name: "Sayur", Emoji: "🥬", IsActive: true},
			{ID: newUUID(), Name: "Minuman", Emoji: "🥤", IsActive: true},
		}
		DB.Create(&categories)
		fmt.Println("✅ Default kategori menu berhasil diderive")
	}
}


