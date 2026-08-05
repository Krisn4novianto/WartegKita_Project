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

// =====================================================
// DATABASE
// =====================================================

var DB *gorm.DB

// =====================================================
// ENV HELPER
// =====================================================

func getEnv(key, fallback string) string {
	value, exists := os.LookupEnv(key)

	if exists && value != "" {
		return value
	}

	return fallback
}

// =====================================================
// CONNECT DATABASE
// =====================================================

func Connect() {

	host := getEnv(
		"DB_HOST",
		"localhost",
	)

	port := getEnv(
		"DB_PORT",
		"5433",
	)

	user := getEnv(
		"DB_USER",
		"postgres",
	)

	password := getEnv(
		"DB_PASSWORD",
		"Krisn@12345",
	)

	dbName := getEnv(
		"DB_NAME",
		"wartegkita_db",
	)

	// =================================================
	// CONNECT POSTGRES ADMIN
	// =================================================

	dsnAdmin := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s sslmode=disable",
		host,
		port,
		user,
		password,
	)

	adminDB, err := sql.Open(
		"postgres",
		dsnAdmin,
	)

	if err != nil {
		log.Fatal(
			"❌ Gagal membuka koneksi PostgreSQL:",
			err,
		)
	}

	if err := adminDB.Ping(); err != nil {
		adminDB.Close()

		log.Fatal(
			"❌ Gagal koneksi PostgreSQL:",
			err,
		)
	}

	// =================================================
	// CEK DATABASE
	// =================================================

	var exists bool

	err = adminDB.QueryRow(
		`
		SELECT EXISTS(
			SELECT 1
			FROM pg_database
			WHERE datname = $1
		)
		`,
		dbName,
	).Scan(&exists)

	if err != nil {
		adminDB.Close()

		log.Fatal(
			"❌ Gagal mengecek database:",
			err,
		)
	}

	// =================================================
	// CREATE DATABASE JIKA BELUM ADA
	// =================================================

	if !exists {

		if !isSafeIdentifier(dbName) {
			adminDB.Close()

			log.Fatal(
				"❌ Nama database tidak valid:",
				dbName,
			)
		}

		_, err = adminDB.Exec(
			fmt.Sprintf(
				"CREATE DATABASE %s",
				dbName,
			),
		)

		if err != nil {
			adminDB.Close()

			log.Fatalf(
				"❌ Gagal membuat database %s: %v",
				dbName,
				err,
			)
		}

		fmt.Printf(
			"✅ Database %s berhasil dibuat\n",
			dbName,
		)
	}

	adminDB.Close()

	// =================================================
	// CONNECT GORM
	// =================================================

	dsnApp := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host,
		port,
		user,
		password,
		dbName,
	)

	DB, err = gorm.Open(
		postgres.Open(dsnApp),
		&gorm.Config{
			// =================================================
			// PENTING
			// =================================================
			//
			// Jangan biarkan GORM membuat FK berdasarkan
			// association secara otomatis.
			//
			// FK kita buat secara eksplisit di bawah.
			//
			DisableForeignKeyConstraintWhenMigrating: true,
		},
	)

	if err != nil {
		log.Fatal(
			"❌ Gagal membuka database aplikasi dengan GORM:",
			err,
		)
	}

	fmt.Printf(
		"✅ GORM PostgreSQL Connected -> %s\n",
		dbName,
	)

	// =================================================
	// AUTO MIGRATE
	// =================================================

	// -------------------------------------------------
	// LEVEL 0
	// -------------------------------------------------
	//
	// Table utama tanpa dependency FK.
	// -------------------------------------------------

	if err := DB.AutoMigrate(
		&models.User{},
		&models.SellerProfile{},
		&models.MenuCategory{},
		&models.PasswordResetOTP{},
	); err != nil {

		log.Fatal(
			"❌ AutoMigrate level-0 gagal:",
			err,
		)
	}

	// -------------------------------------------------
	// LEVEL 1
	// -------------------------------------------------

	if err := DB.AutoMigrate(
		&models.UserAddress{},
		&models.Menu{},
	); err != nil {

		log.Fatal(
			"❌ AutoMigrate level-1 gagal:",
			err,
		)
	}

	// -------------------------------------------------
	// LEVEL 2
	// -------------------------------------------------

	if err := DB.AutoMigrate(
		&models.Order{},
		&models.SellerPendapatan{},
		&models.ChatRoom{},
	); err != nil {

		log.Fatal(
			"❌ AutoMigrate level-2 gagal:",
			err,
		)
	}

	// -------------------------------------------------
	// LEVEL 3
	// -------------------------------------------------

	if err := DB.AutoMigrate(
		&models.OrderItem{},
		&models.BubbleChat{},
	); err != nil {

		log.Fatal(
			"❌ AutoMigrate level-3 gagal:",
			err,
		)
	}

	fmt.Println(
		"✅ GORM AutoMigrate selesai",
	)

	// =================================================
	// REPAIR EXISTING DATABASE
	// =================================================

	repairSellerProfileTimeColumns()

	// =================================================
	// REPAIR FOREIGN KEYS
	// =================================================

	repairForeignKeys()

	// =================================================
	// SEED
	// =================================================

	SeedMenuCategories()
}

// =====================================================
// SAFE DATABASE IDENTIFIER
// =====================================================

func isSafeIdentifier(value string) bool {

	if value == "" {
		return false
	}

	for _, r := range value {

		if r == '_' {
			continue
		}

		if r >= 'a' && r <= 'z' {
			continue
		}

		if r >= 'A' && r <= 'Z' {
			continue
		}

		if r >= '0' && r <= '9' {
			continue
		}

		return false
	}

	return true
}

// =====================================================
// REPAIR SELLER PROFILE TIME COLUMNS
// =====================================================
//
// Model:
//
// JamBuka  string `gorm:"type:time"`
// JamTutup string `gorm:"type:time"`
//
// Database lama bisa saja mempunyai:
//
// jam_buka  timestamptz
// jam_tutup timestamptz
//
// Kita ubah menjadi:
//
// jam_buka  time
// jam_tutup time
//
// Tanpa DROP TABLE.
// =====================================================

func repairSellerProfileTimeColumns() {

	if DB == nil {
		return
	}

	// =================================================
	// JAM BUKA
	// =================================================

	var jamBukaType string

	err := DB.Raw(
		`
		SELECT data_type
		FROM information_schema.columns
		WHERE table_schema = 'public'
		  AND table_name = 'seller_profiles'
		  AND column_name = 'jam_buka'
		`,
	).Scan(&jamBukaType).Error

	if err != nil {
		log.Printf(
			"⚠️ Gagal mengecek tipe jam_buka: %v",
			err,
		)
	} else if jamBukaType != "" && jamBukaType != "time without time zone" {

		err := DB.Exec(
			`
			ALTER TABLE seller_profiles
			ALTER COLUMN jam_buka
			TYPE time
			USING jam_buka::time
			`,
		).Error

		if err != nil {
			log.Printf(
				"⚠️ Gagal mengubah jam_buka menjadi TIME: %v",
				err,
			)
		} else {
			fmt.Println(
				"✅ Kolom jam_buka diperbaiki menjadi TIME",
			)
		}
	}

	// =================================================
	// JAM TUTUP
	// =================================================

	var jamTutupType string

	err = DB.Raw(
		`
		SELECT data_type
		FROM information_schema.columns
		WHERE table_schema = 'public'
		  AND table_name = 'seller_profiles'
		  AND column_name = 'jam_tutup'
		`,
	).Scan(&jamTutupType).Error

	if err != nil {
		log.Printf(
			"⚠️ Gagal mengecek tipe jam_tutup: %v",
			err,
		)
	} else if jamTutupType != "" && jamTutupType != "time without time zone" {

		err := DB.Exec(
			`
			ALTER TABLE seller_profiles
			ALTER COLUMN jam_tutup
			TYPE time
			USING jam_tutup::time
			`,
		).Error

		if err != nil {
			log.Printf(
				"⚠️ Gagal mengubah jam_tutup menjadi TIME: %v",
				err,
			)
		} else {
			fmt.Println(
				"✅ Kolom jam_tutup diperbaiki menjadi TIME",
			)
		}
	}
}

// =====================================================
// REPAIR FOREIGN KEYS
// =====================================================
//
// RELATIONSHIP YANG BENAR:
//
// users.id
//     ↓
// user_addresses.user_id
//
// seller_profiles.seller_id
//     ↑
// menus.seller_id
//
// seller_profiles.seller_id
//     ↑
// orders.seller_id
//
// seller_profiles.seller_id
//     ↑
// seller_pendapatans.seller_id
//
// seller_profiles.seller_id
//     ↑
// chat_rooms.seller_id
//
// users.id
//     ↑
// orders.user_id
//
// users.id
//     ↑
// chat_rooms.buyer_id
//
// orders.id
//     ↑
// order_items.order_id
//
// menus.id
//     ↑
// order_items.menu_id
//
// chat_rooms.id
//     ↑
// chat_messages.chat_room_id
// =====================================================

func repairForeignKeys() {

	if DB == nil {
		return
	}

	// =================================================
	// DROP FK SALAH / LAMA
	// =================================================

	dropForeignKeys := []string{

		// FK yang pernah salah arah:
		//
		// seller_profiles.seller_id
		//        ↓
		// menus.seller_id
		//
		`ALTER TABLE IF EXISTS seller_profiles
		 DROP CONSTRAINT IF EXISTS fk_menus_seller`,

		// FK benar tetapi mungkin sudah pernah dibuat
		// dengan definisi berbeda.
		//
		// Kita drop supaya bisa dibuat ulang.
		`ALTER TABLE IF EXISTS menus
		 DROP CONSTRAINT IF EXISTS fk_menus_seller`,

		`ALTER TABLE IF EXISTS user_addresses
		 DROP CONSTRAINT IF EXISTS fk_user_addresses_user`,

		`ALTER TABLE IF EXISTS password_reset_otps
		 DROP CONSTRAINT IF EXISTS fk_password_reset_otps_user`,

		`ALTER TABLE IF EXISTS orders
		 DROP CONSTRAINT IF EXISTS fk_orders_user`,

		`ALTER TABLE IF EXISTS orders
		 DROP CONSTRAINT IF EXISTS fk_orders_seller`,

		`ALTER TABLE IF EXISTS order_items
		 DROP CONSTRAINT IF EXISTS fk_order_items_order`,

		`ALTER TABLE IF EXISTS order_items
		 DROP CONSTRAINT IF EXISTS fk_order_items_menu`,

		`ALTER TABLE IF EXISTS seller_pendapatans
		 DROP CONSTRAINT IF EXISTS fk_seller_pendapatans_seller`,

		`ALTER TABLE IF EXISTS chat_rooms
		 DROP CONSTRAINT IF EXISTS fk_chat_rooms_buyer`,

		`ALTER TABLE IF EXISTS chat_rooms
		 DROP CONSTRAINT IF EXISTS fk_chat_rooms_seller`,

		`ALTER TABLE IF EXISTS bubble_chats
		 DROP CONSTRAINT IF EXISTS fk_bubble_chats_room`,
		`ALTER TABLE IF EXISTS chat_messages
		 DROP CONSTRAINT IF EXISTS fk_chat_messages_room`,
	}

	for _, statement := range dropForeignKeys {

		if err := DB.Exec(statement).Error; err != nil {

			log.Printf(
				"⚠️ Gagal membersihkan FK lama: %v",
				err,
			)
		}
	}

	// =================================================
	// CREATE FK
	// =================================================

	fkStatements := []struct {
		name string
		sql  string
	}{

		// =================================================
		// USER ADDRESS → USER
		// =================================================

		{
			name: "fk_user_addresses_user",

			sql: `
			ALTER TABLE user_addresses
			ADD CONSTRAINT fk_user_addresses_user
			FOREIGN KEY (user_id)
			REFERENCES users(id)
			ON DELETE CASCADE
			`,
		},

		// =================================================
		// PASSWORD RESET OTP → USER
		// =================================================

		{
			name: "fk_password_reset_otps_user",

			sql: `
			ALTER TABLE password_reset_otps
			ADD CONSTRAINT fk_password_reset_otps_user
			FOREIGN KEY (user_id)
			REFERENCES users(id)
			ON DELETE CASCADE
			`,
		},

		// =================================================
		// MENU → SELLER PROFILE
		// =================================================

		{
			name: "fk_menus_seller",

			sql: `
			ALTER TABLE menus
			ADD CONSTRAINT fk_menus_seller
			FOREIGN KEY (seller_id)
			REFERENCES seller_profiles(seller_id)
			ON DELETE CASCADE
			`,
		},

		// =================================================
		// ORDER → USER
		// =================================================

		{
			name: "fk_orders_user",

			sql: `
			ALTER TABLE orders
			ADD CONSTRAINT fk_orders_user
			FOREIGN KEY (user_id)
			REFERENCES users(id)
			ON DELETE SET NULL
			`,
		},

		// =================================================
		// ORDER → SELLER
		// =================================================

		{
			name: "fk_orders_seller",

			sql: `
			ALTER TABLE orders
			ADD CONSTRAINT fk_orders_seller
			FOREIGN KEY (seller_id)
			REFERENCES seller_profiles(seller_id)
			ON DELETE SET NULL
			`,
		},

		// =================================================
		// ORDER ITEM → ORDER
		// =================================================

		{
			name: "fk_order_items_order",

			sql: `
			ALTER TABLE order_items
			ADD CONSTRAINT fk_order_items_order
			FOREIGN KEY (order_id)
			REFERENCES orders(id)
			ON DELETE CASCADE
			`,
		},

		// =================================================
		// ORDER ITEM → MENU
		// =================================================

		{
			name: "fk_order_items_menu",

			sql: `
			ALTER TABLE order_items
			ADD CONSTRAINT fk_order_items_menu
			FOREIGN KEY (menu_id)
			REFERENCES menus(id)
			ON DELETE RESTRICT
			`,
		},

		// =================================================
		// SELLER PENDAPATAN → SELLER
		// =================================================

		{
			name: "fk_seller_pendapatans_seller",

			sql: `
			ALTER TABLE seller_pendapatans
			ADD CONSTRAINT fk_seller_pendapatans_seller
			FOREIGN KEY (seller_id)
			REFERENCES seller_profiles(seller_id)
			ON DELETE CASCADE
			`,
		},

		// =================================================
		// CHAT ROOM → USER
		// =================================================

		{
			name: "fk_chat_rooms_buyer",

			sql: `
			ALTER TABLE chat_rooms
			ADD CONSTRAINT fk_chat_rooms_buyer
			FOREIGN KEY (buyer_id)
			REFERENCES users(id)
			ON DELETE CASCADE
			`,
		},

		// =================================================
		// CHAT ROOM → SELLER
		// =================================================

		{
			name: "fk_chat_rooms_seller",

			sql: `
			ALTER TABLE chat_rooms
			ADD CONSTRAINT fk_chat_rooms_seller
			FOREIGN KEY (seller_id)
			REFERENCES seller_profiles(seller_id)
			ON DELETE CASCADE
			`,
		},

		// =================================================
		// BUBBLE CHAT → CHAT ROOM
		// =================================================

		{
			name: "fk_bubble_chats_room",

			sql: `
			ALTER TABLE bubble_chats
			ADD CONSTRAINT fk_bubble_chats_room
			FOREIGN KEY (chat_room_id)
			REFERENCES chat_rooms(id)
			ON DELETE CASCADE
			`,
		},
	}

	// =================================================
	// EXECUTE FK
	// =================================================

	for _, stmt := range fkStatements {

		if err := DB.Exec(stmt.sql).Error; err != nil {

			log.Printf(
				"⚠️ Gagal membuat FK %s: %v",
				stmt.name,
				err,
			)

			continue
		}

		fmt.Printf(
			"✅ Foreign key verified/created: %s\n",
			stmt.name,
		)
	}
}

// =====================================================
// UUID
// =====================================================

func newUUID() string {

	id, err := uuid.NewV7()

	if err != nil {
		return uuid.New().String()
	}

	return id.String()
}

// =====================================================
// SEED MENU CATEGORIES
// =====================================================

func SeedMenuCategories() {

	if DB == nil {

		log.Println(
			"⚠️ Database belum tersedia, seed dilewati",
		)

		return
	}

	var count int64

	if err := DB.
		Model(&models.MenuCategory{}).
		Count(&count).
		Error; err != nil {

		log.Println(
			"⚠️ Gagal mengecek menu categories:",
			err,
		)

		return
	}

	// Sudah ada data.
	if count > 0 {
		return
	}

	categories := []models.MenuCategory{

		{
			ID:       newUUID(),
			Name:     "Nasi Rames",
			Emoji:    "🍛",
			IsActive: true,
		},

		{
			ID:       newUUID(),
			Name:     "Ayam",
			Emoji:    "🍗",
			IsActive: true,
		},

		{
			ID:       newUUID(),
			Name:     "Ikan",
			Emoji:    "🐟",
			IsActive: true,
		},

		{
			ID:       newUUID(),
			Name:     "Sayur",
			Emoji:    "🥬",
			IsActive: true,
		},

		{
			ID:       newUUID(),
			Name:     "Minuman",
			Emoji:    "🥤",
			IsActive: true,
		},
	}

	if err := DB.
		Create(&categories).
		Error; err != nil {

		log.Println(
			"⚠️ Gagal seed menu categories:",
			err,
		)

		return
	}

	fmt.Println(
		"✅ Default kategori menu berhasil dibuat",
	)
}
