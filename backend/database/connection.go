package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"

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
// UPLOAD DIRECTORY
// =====================================================
//
// Semua file upload seller disimpan di:
//
// backend/uploads/sellers/id_card
//
// Folder dibuat otomatis ketika backend start.
// =====================================================

const sellerKTPUploadDir = "uploads/sellers/id_card"

// =====================================================
// ENV HELPER
// =====================================================

func getEnv(key, fallback string) string {

	value, exists := os.LookupEnv(key)

	if exists && strings.TrimSpace(value) != "" {
		return value
	}

	return fallback
}

// =====================================================
// CONNECT DATABASE
// =====================================================

func Connect() {

	// =================================================
	// DATABASE CONFIG
	// =================================================

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
		"*******",
	)

	dbName := getEnv(
		"DB_NAME",
		"wartegkita_db",
	)

	// =================================================
	// PREPARE UPLOAD DIRECTORY
	// =================================================

	if err := os.MkdirAll(
		sellerKTPUploadDir,
		0755,
	); err != nil {

		log.Fatal(
			"❌ Gagal membuat folder upload KTP:",
			err,
		)
	}

	fmt.Printf(
		"✅ Folder upload KTP siap: %s\n",
		sellerKTPUploadDir,
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

	// =================================================
	// PING POSTGRES
	// =================================================

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
				`CREATE DATABASE "%s"`,
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

	// =================================================
	// CLOSE ADMIN CONNECTION
	// =================================================

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

	// =====================================================
	// REPAIR DATABASE LAMA
	// =====================================================
	//
	// Fungsi repair hanya bekerja jika tabel sudah ada.
	// Jadi aman dipanggil sebelum AutoMigrate.
	// =====================================================

	repairSellerProfileTimestampColumns()
	repairSellerProfileTimeColumns()

	// =====================================================
	// LEVEL 0
	// SELLER PROFILE
	// =====================================================

	if err := DB.AutoMigrate(
		&models.SellerProfile{},
	); err != nil {

		log.Fatal(
			"❌ AutoMigrate seller_profiles gagal:",
			err,
		)
	}

	// =====================================================
	// SELLER VERIFICATION
	// =====================================================

	if err := DB.AutoMigrate(
		&models.SellerVerification{},
	); err != nil {

		log.Fatal(
			"❌ AutoMigrate seller_verifications gagal:",
			err,
		)
	}

	// =====================================================
	// LEVEL 1
	// USER ADDRESS + MENU
	// =====================================================

	if err := DB.AutoMigrate(
		&models.UserAddress{},
		&models.Menu{},
	); err != nil {

		log.Fatal(
			"❌ AutoMigrate level-1 gagal:",
			err,
		)
	}

	// =====================================================
	// LEVEL 2
	// ORDER + SELLER PENDAPATAN + CHAT ROOM
	// =====================================================

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

	// =====================================================
	// LEVEL 2.5
	// ORDER STATUS HISTORY
	// =====================================================

	if err := DB.AutoMigrate(
		&models.OrderStatusHistory{},
	); err != nil {

		log.Fatal(
			"❌ AutoMigrate order_status_histories gagal:",
			err,
		)
	}

	// =====================================================
	// LEVEL 3
	// ORDER ITEM + BUBBLE CHAT
	// =====================================================

	if err := DB.AutoMigrate(
		&models.OrderItem{},
		&models.BubbleChat{},
	); err != nil {

		log.Fatal(
			"❌ AutoMigrate level-3 gagal:",
			err,
		)
	}

	// =====================================================
	// MENU CATEGORY
	// =====================================================

	if err := DB.AutoMigrate(
		&models.MenuCategory{},
	); err != nil {

		log.Fatal(
			"❌ AutoMigrate menu_categories gagal:",
			err,
		)
	}

	// =====================================================
	// CUSTOMER LOYALTY
	// =====================================================
	//
	// Semua data loyalty berasal dari PostgreSQL.
	//
	// Tabel:
	//
	// user_loyalty_points
	// point_transactions
	// missions
	// user_missions
	// rewards
	// reward_redemptions
	//
	// Mission dan Reward:
	// - Data master Mission dimasukkan dari PostgreSQL / DBeaver
	// - Data master Reward dimasukkan dari PostgreSQL / DBeaver
	// - UserMission dibuat / diperbarui oleh loyalty service
	// - PointTransaction mencatat perubahan poin
	//
	// =====================================================

	if err := DB.AutoMigrate(
		// -----------------------------------------------
		// USER LOYALTY POINT
		// -----------------------------------------------
		&models.UserLoyaltyPoint{},

		// -----------------------------------------------
		// POINT TRANSACTION
		// -----------------------------------------------
		//
		// Digunakan untuk mencatat:
		// + poin dari mission
		// - poin ketika redeem reward
		//
		&models.PointTransaction{},

		// -----------------------------------------------
		// MISSION MASTER
		// -----------------------------------------------
		//
		// Data mission utama.
		// Bisa sudah diinsert melalui DBeaver.
		//
		&models.Mission{},

		// -----------------------------------------------
		// USER MISSION
		// -----------------------------------------------
		//
		// Progress mission masing-masing customer.
		//
		// Contoh:
		//
		// User A
		// Mission "Pesanan Pertama"
		// progress = 0
		//
		// Setelah order COMPLETED:
		// progress = 1
		// completed = true
		//
		&models.UserMission{},

		// -----------------------------------------------
		// REWARD MASTER
		// -----------------------------------------------
		//
		// Data reward utama.
		//
		&models.Reward{},

		// -----------------------------------------------
		// REWARD REDEMPTION
		// -----------------------------------------------
		//
		// Riwayat reward yang ditukar customer.
		//
		&models.RewardRedemption{},
	); err != nil {

		log.Fatal(
			"❌ AutoMigrate customer loyalty gagal:",
			err,
		)
	}

	fmt.Println(
		"✅ Customer loyalty tables siap",
	)

	// =====================================================
	// CAMPAIGN WALLET
	// =====================================================

	autoMigrateCampaignWallet()

	// =====================================================
	// AUTO MIGRATE SELESAI
	// =====================================================

	fmt.Println(
		"✅ GORM AutoMigrate selesai",
	)

	// =====================================================
	// REPAIR / CREATE FOREIGN KEYS
	// =====================================================

	repairForeignKeys()

	// =====================================================
	// SEED
	// =====================================================
	//
	// Menu category masih menggunakan seed.
	//
	// Mission TIDAK lagi di-seed karena data mission
	// sudah dimasukkan langsung ke PostgreSQL.
	//
	// Reward juga TIDAK di-seed karena data reward
	// akan dimasukkan langsung ke PostgreSQL.
	//
	// =====================================================

	SeedMenuCategories()

	fmt.Println(
		"✅ Database initialization selesai",
	)
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
// CHECK TABLE EXISTS
// =====================================================

func tableExists(tableName string) bool {

	if DB == nil {
		return false
	}

	var exists bool

	err := DB.Raw(
		`
		SELECT EXISTS (
			SELECT 1
			FROM information_schema.tables
			WHERE table_schema = 'public'
			  AND table_name = ?
		)
		`,
		tableName,
	).Scan(&exists).Error

	if err != nil {

		log.Printf(
			"⚠️ Gagal mengecek tabel %s: %v",
			tableName,
			err,
		)

		return false
	}

	return exists
}

// =====================================================
// CHECK CONSTRAINT EXISTS
// =====================================================

func constraintExists(constraintName string) bool {

	if DB == nil {
		return false
	}

	var exists bool

	err := DB.Raw(
		`
		SELECT EXISTS (
			SELECT 1
			FROM information_schema.table_constraints
			WHERE constraint_schema = 'public'
			  AND constraint_name = ?
		)
		`,
		constraintName,
	).Scan(&exists).Error

	if err != nil {

		log.Printf(
			"⚠️ Gagal mengecek constraint %s: %v",
			constraintName,
			err,
		)

		return false
	}

	return exists
}

// =====================================================
// CHECK PRIMARY KEY EXISTS
// =====================================================

func primaryKeyExists(tableName string) bool {

	if DB == nil {
		return false
	}

	var exists bool

	err := DB.Raw(
		`
		SELECT EXISTS (
			SELECT 1
			FROM pg_constraint c
			INNER JOIN pg_class t
				ON t.oid = c.conrelid
			INNER JOIN pg_namespace n
				ON n.oid = t.relnamespace
			WHERE c.contype = 'p'
			  AND n.nspname = 'public'
			  AND t.relname = ?
		)
		`,
		tableName,
	).Scan(&exists).Error

	if err != nil {

		log.Printf(
			"⚠️ Gagal mengecek primary key %s: %v",
			tableName,
			err,
		)

		return false
	}

	return exists
}

// =====================================================
// REPAIR SELLER PROFILE TIMESTAMP COLUMNS
// =====================================================

func repairSellerProfileTimestampColumns() {

	if DB == nil {
		return
	}

	if !tableExists("seller_profiles") {
		return
	}

	repairSellerProfileTimestampColumn(
		"created_at",
	)

	repairSellerProfileTimestampColumn(
		"updated_at",
	)
}

// =====================================================
// REPAIR SINGLE TIMESTAMP COLUMN
// =====================================================

func repairSellerProfileTimestampColumn(
	columnName string,
) {

	if columnName != "created_at" &&
		columnName != "updated_at" {

		return
	}

	var dataType string

	err := DB.Raw(
		`
		SELECT data_type
		FROM information_schema.columns
		WHERE table_schema = 'public'
		  AND table_name = 'seller_profiles'
		  AND column_name = ?
		`,
		columnName,
	).Scan(&dataType).Error

	if err != nil {

		log.Printf(
			"⚠️ Gagal mengecek tipe %s: %v",
			columnName,
			err,
		)

		return
	}

	if dataType == "" {
		return
	}

	// =================================================
	// SUDAH BENAR
	// =================================================

	if dataType == "timestamp with time zone" {
		return
	}

	// =================================================
	// TIMESTAMP WITHOUT TIME ZONE
	// -> TIMESTAMPTZ
	// =================================================

	if dataType == "timestamp without time zone" {

		err := DB.Exec(
			fmt.Sprintf(
				`
				ALTER TABLE seller_profiles
				ALTER COLUMN %s
				TYPE timestamptz
				USING %s AT TIME ZONE 'Asia/Jakarta'
				`,
				columnName,
				columnName,
			),
		).Error

		if err != nil {

			log.Printf(
				"⚠️ Gagal mengubah %s menjadi TIMESTAMPTZ: %v",
				columnName,
				err,
			)

			return
		}

		fmt.Printf(
			"✅ Kolom %s diperbaiki menjadi TIMESTAMPTZ\n",
			columnName,
		)

		return
	}

	// =================================================
	// TEXT / VARCHAR
	// -> TIMESTAMPTZ
	// =================================================

	if dataType == "text" ||
		dataType == "character varying" ||
		dataType == "character" {

		cleanupSQL := fmt.Sprintf(
			`
			UPDATE seller_profiles
			SET %s = NULL
			WHERE
				%s IS NOT NULL
				AND BTRIM(%s::text) = ''
			`,
			columnName,
			columnName,
			columnName,
		)

		if err := DB.Exec(
			cleanupSQL,
		).Error; err != nil {

			log.Printf(
				"⚠️ Gagal membersihkan %s kosong: %v",
				columnName,
				err,
			)
		}

		alterSQL := fmt.Sprintf(
			`
			ALTER TABLE seller_profiles
			ALTER COLUMN %s
			TYPE timestamptz
			USING
				NULLIF(
					BTRIM(%s::text),
					''
				)::timestamptz
			`,
			columnName,
			columnName,
		)

		if err := DB.Exec(
			alterSQL,
		).Error; err != nil {

			log.Printf(
				"⚠️ Gagal mengubah %s menjadi TIMESTAMPTZ: %v",
				columnName,
				err,
			)

			return
		}

		fmt.Printf(
			"✅ Kolom %s diperbaiki menjadi TIMESTAMPTZ\n",
			columnName,
		)

		return
	}

	log.Printf(
		"⚠️ Tipe kolom %s tidak dikenali: %s",
		columnName,
		dataType,
	)
}

// =====================================================
// REPAIR SELLER PROFILE TIME COLUMNS
// =====================================================

func repairSellerProfileTimeColumns() {

	if DB == nil {
		return
	}

	if !tableExists("seller_profiles") {
		return
	}

	repairSellerProfileTimeColumn(
		"jam_buka",
	)

	repairSellerProfileTimeColumn(
		"jam_tutup",
	)
}

// =====================================================
// REPAIR SINGLE TIME COLUMN
// =====================================================

func repairSellerProfileTimeColumn(
	columnName string,
) {

	if columnName != "jam_buka" &&
		columnName != "jam_tutup" {

		return
	}

	var dataType string

	err := DB.Raw(
		`
		SELECT data_type
		FROM information_schema.columns
		WHERE table_schema = 'public'
		  AND table_name = 'seller_profiles'
		  AND column_name = ?
		`,
		columnName,
	).Scan(&dataType).Error

	if err != nil {

		log.Printf(
			"⚠️ Gagal mengecek tipe %s: %v",
			columnName,
			err,
		)

		return
	}

	if dataType == "" {
		return
	}

	// =================================================
	// SUDAH BENAR
	// =================================================

	if dataType == "time without time zone" {
		return
	}

	// =================================================
	// TEXT -> TIME
	// =================================================

	if dataType == "text" ||
		dataType == "character varying" ||
		dataType == "character" {

		cleanupSQL := fmt.Sprintf(
			`
			UPDATE seller_profiles
			SET %s = NULL
			WHERE
				%s IS NOT NULL
				AND BTRIM(%s::text) = ''
			`,
			columnName,
			columnName,
			columnName,
		)

		if err := DB.Exec(
			cleanupSQL,
		).Error; err != nil {

			log.Printf(
				"⚠️ Gagal membersihkan %s kosong: %v",
				columnName,
				err,
			)
		}

		alterSQL := fmt.Sprintf(
			`
			ALTER TABLE seller_profiles
			ALTER COLUMN %s
			TYPE time
			USING NULLIF(
				BTRIM(%s::text),
				''
			)::time
			`,
			columnName,
			columnName,
		)

		if err := DB.Exec(
			alterSQL,
		).Error; err != nil {

			log.Printf(
				"⚠️ Gagal mengubah %s menjadi TIME: %v",
				columnName,
				err,
			)

			return
		}

		fmt.Printf(
			"✅ Kolom %s diperbaiki menjadi TIME\n",
			columnName,
		)

		return
	}

	// =================================================
	// TIMESTAMP WITHOUT TIME ZONE -> TIME
	// =================================================

	if dataType == "timestamp without time zone" {

		alterSQL := fmt.Sprintf(
			`
			ALTER TABLE seller_profiles
			ALTER COLUMN %s
			TYPE time
			USING %s::time
			`,
			columnName,
			columnName,
		)

		if err := DB.Exec(
			alterSQL,
		).Error; err != nil {

			log.Printf(
				"⚠️ Gagal mengubah %s menjadi TIME: %v",
				columnName,
				err,
			)

			return
		}

		fmt.Printf(
			"✅ Kolom %s diperbaiki menjadi TIME\n",
			columnName,
		)

		return
	}

	// =================================================
	// TIMESTAMPTZ -> TIME
	// =================================================

	if dataType == "timestamp with time zone" {

		alterSQL := fmt.Sprintf(
			`
			ALTER TABLE seller_profiles
			ALTER COLUMN %s
			TYPE time
			USING (%s AT TIME ZONE 'Asia/Jakarta')::time
			`,
			columnName,
			columnName,
		)

		if err := DB.Exec(
			alterSQL,
		).Error; err != nil {

			log.Printf(
				"⚠️ Gagal mengubah %s menjadi TIME: %v",
				columnName,
				err,
			)

			return
		}

		fmt.Printf(
			"✅ Kolom %s diperbaiki menjadi TIME\n",
			columnName,
		)

		return
	}

	log.Printf(
		"⚠️ Tipe kolom %s tidak dikenali: %s",
		columnName,
		dataType,
	)
}

// =====================================================
// AUTO MIGRATE CAMPAIGN WALLET
// =====================================================

func autoMigrateCampaignWallet() {

	if DB == nil {

		log.Println(
			"⚠️ Database belum tersedia, campaign wallet migration dilewati",
		)

		return
	}

	// =================================================
	// CREATE TABLE
	// =================================================

	createTableSQL := `
	CREATE TABLE IF NOT EXISTS campaign_wallets (
		id UUID PRIMARY KEY,
		seller_id UUID NOT NULL UNIQUE,
		balance BIGINT NOT NULL DEFAULT 0,
		created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
	)
	`

	if err := DB.Exec(
		createTableSQL,
	).Error; err != nil {

		log.Fatal(
			"❌ Gagal membuat campaign_wallets:",
			err,
		)
	}

	// =================================================
	// ENSURE ID COLUMN
	// =================================================

	if err := DB.Exec(`
		ALTER TABLE campaign_wallets
		ADD COLUMN IF NOT EXISTS id UUID
	`).Error; err != nil {

		log.Fatal(
			"❌ Gagal memastikan campaign_wallets.id:",
			err,
		)
	}

	// =================================================
	// ENSURE SELLER ID COLUMN
	// =================================================

	if err := DB.Exec(`
		ALTER TABLE campaign_wallets
		ADD COLUMN IF NOT EXISTS seller_id UUID
	`).Error; err != nil {

		log.Fatal(
			"❌ Gagal memastikan campaign_wallets.seller_id:",
			err,
		)
	}

	// =================================================
	// ENSURE BALANCE COLUMN
	// =================================================

	if err := DB.Exec(`
		ALTER TABLE campaign_wallets
		ADD COLUMN IF NOT EXISTS balance BIGINT
	`).Error; err != nil {

		log.Fatal(
			"❌ Gagal memastikan campaign_wallets.balance:",
			err,
		)
	}

	// =================================================
	// REPAIR NULL BALANCE
	// =================================================

	if err := DB.Exec(`
		UPDATE campaign_wallets
		SET balance = 0
		WHERE balance IS NULL
	`).Error; err != nil {

		log.Printf(
			"⚠️ Gagal memperbaiki balance NULL: %v",
			err,
		)
	}

	if err := DB.Exec(`
		ALTER TABLE campaign_wallets
		ALTER COLUMN balance SET DEFAULT 0
	`).Error; err != nil {

		log.Printf(
			"⚠️ Gagal mengatur default balance: %v",
			err,
		)
	}

	if err := DB.Exec(`
		ALTER TABLE campaign_wallets
		ALTER COLUMN balance SET NOT NULL
	`).Error; err != nil {

		log.Printf(
			"⚠️ Gagal membuat balance NOT NULL: %v",
			err,
		)
	}

	// =================================================
	// ENSURE CREATED AT
	// =================================================

	if err := DB.Exec(`
		ALTER TABLE campaign_wallets
		ADD COLUMN IF NOT EXISTS created_at
		TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
	`).Error; err != nil {

		log.Fatal(
			"❌ Gagal memastikan campaign_wallets.created_at:",
			err,
		)
	}

	if err := DB.Exec(`
		UPDATE campaign_wallets
		SET created_at = CURRENT_TIMESTAMP
		WHERE created_at IS NULL
	`).Error; err != nil {

		log.Printf(
			"⚠️ Gagal memperbaiki created_at NULL: %v",
			err,
		)
	}

	if err := DB.Exec(`
		ALTER TABLE campaign_wallets
		ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP
	`).Error; err != nil {

		log.Printf(
			"⚠️ Gagal mengatur default created_at: %v",
			err,
		)
	}

	if err := DB.Exec(`
		ALTER TABLE campaign_wallets
		ALTER COLUMN created_at SET NOT NULL
	`).Error; err != nil {

		log.Printf(
			"⚠️ Gagal membuat created_at NOT NULL:",
			err,
		)
	}

	// =================================================
	// ENSURE UPDATED AT
	// =================================================

	if err := DB.Exec(`
		ALTER TABLE campaign_wallets
		ADD COLUMN IF NOT EXISTS updated_at
		TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
	`).Error; err != nil {

		log.Fatal(
			"❌ Gagal memastikan campaign_wallets.updated_at:",
			err,
		)
	}

	if err := DB.Exec(`
		UPDATE campaign_wallets
		SET updated_at = CURRENT_TIMESTAMP
		WHERE updated_at IS NULL
	`).Error; err != nil {

		log.Printf(
			"⚠️ Gagal memperbaiki updated_at NULL: %v",
			err,
		)
	}

	if err := DB.Exec(`
		ALTER TABLE campaign_wallets
		ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP
	`).Error; err != nil {

		log.Printf(
			"⚠️ Gagal mengatur default updated_at: %v",
			err,
		)
	}

	if err := DB.Exec(`
		ALTER TABLE campaign_wallets
		ALTER COLUMN updated_at SET NOT NULL
	`).Error; err != nil {

		log.Printf(
			"⚠️ Gagal membuat updated_at NOT NULL:",
			err,
		)
	}

	// =================================================
	// REPAIR NULL ID
	// =================================================

	var walletRows []struct {
		SellerID string
	}

	if err := DB.Raw(`
		SELECT seller_id::text
		FROM campaign_wallets
		WHERE id IS NULL
	`).Scan(&walletRows).Error; err != nil {

		log.Printf(
			"⚠️ Gagal mengambil wallet dengan ID NULL: %v",
			err,
		)

	} else {

		for _, row := range walletRows {

			id := newUUID()

			if err := DB.Exec(
				`
				UPDATE campaign_wallets
				SET id = ?
				WHERE seller_id = ?
				  AND id IS NULL
				`,
				id,
				row.SellerID,
			).Error; err != nil {

				log.Printf(
					"⚠️ Gagal memperbaiki ID wallet seller %s: %v",
					row.SellerID,
					err,
				)
			}
		}
	}

	// =================================================
	// VERIFY NO NULL ID
	// =================================================

	var nullIDCount int64

	if err := DB.Raw(`
		SELECT COUNT(*)
		FROM campaign_wallets
		WHERE id IS NULL
	`).Scan(&nullIDCount).Error; err != nil {

		log.Fatal(
			"❌ Gagal mengecek campaign_wallets.id NULL:",
			err,
		)
	}

	if nullIDCount > 0 {

		log.Fatal(
			"❌ Masih terdapat campaign_wallets dengan id NULL",
		)
	}

	// =================================================
	// ID NOT NULL
	// =================================================

	if err := DB.Exec(`
		ALTER TABLE campaign_wallets
		ALTER COLUMN id SET NOT NULL
	`).Error; err != nil {

		log.Fatal(
			"❌ Gagal membuat campaign_wallets.id NOT NULL:",
			err,
		)
	}

	// =================================================
	// ENSURE PRIMARY KEY
	// =================================================

	if !primaryKeyExists("campaign_wallets") {

		if err := DB.Exec(`
			ALTER TABLE campaign_wallets
			ADD CONSTRAINT pk_campaign_wallets
			PRIMARY KEY (id)
		`).Error; err != nil {

			log.Fatal(
				"❌ Gagal membuat primary key campaign_wallets:",
				err,
			)
		}

		fmt.Println(
			"✅ Primary key campaign_wallets berhasil dibuat",
		)
	}

	// =================================================
	// ENSURE SELLER ID NOT NULL
	// =================================================

	var nullSellerCount int64

	if err := DB.Raw(`
		SELECT COUNT(*)
		FROM campaign_wallets
		WHERE seller_id IS NULL
	`).Scan(&nullSellerCount).Error; err != nil {

		log.Fatal(
			"❌ Gagal mengecek seller_id wallet:",
			err,
		)
	}

	if nullSellerCount > 0 {

		log.Printf(
			"⚠️ Terdapat %d campaign wallet dengan seller_id NULL",
			nullSellerCount,
		)

		log.Println(
			"⚠️ seller_id NOT NULL tidak diterapkan agar database lama tidak rusak",
		)

	} else {

		if err := DB.Exec(`
			ALTER TABLE campaign_wallets
			ALTER COLUMN seller_id SET NOT NULL
		`).Error; err != nil {

			log.Printf(
				"⚠️ Gagal membuat seller_id NOT NULL: %v",
				err,
			)
		}
	}

	// =================================================
	// UNIQUE SELLER ID
	// =================================================

	if err := DB.Exec(`
		CREATE UNIQUE INDEX IF NOT EXISTS
		idx_campaign_wallets_seller_id
		ON campaign_wallets (seller_id)
	`).Error; err != nil {

		log.Fatal(
			"❌ Unique index campaign_wallets.seller_id gagal:",
			err,
		)
	}

	// =================================================
	// BALANCE INDEX
	// =================================================

	if err := DB.Exec(`
		CREATE INDEX IF NOT EXISTS
		idx_campaign_wallets_balance
		ON campaign_wallets (balance)
	`).Error; err != nil {

		log.Printf(
			"⚠️ Index campaign_wallets.balance gagal: %v",
			err,
		)
	}

	// =================================================
	// VERIFY TABLE
	// =================================================

	if !tableExists(
		"campaign_wallets",
	) {

		log.Fatal(
			"❌ campaign_wallets tidak ditemukan setelah migration",
		)
	}

	fmt.Println(
		"✅ campaign_wallets berhasil dibuat/diverifikasi",
	)
}

// =====================================================
// REPAIR FOREIGN KEYS
// =====================================================

func repairForeignKeys() {

	if DB == nil {
		return
	}

	// =================================================
	// FOREIGN KEY DEFINITIONS
	// =================================================

	fkStatements := []struct {
		name   string
		sql    string
		tables []string
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

			tables: []string{
				"user_addresses",
				"users",
			},
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

			tables: []string{
				"password_reset_otps",
				"users",
			},
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

			tables: []string{
				"menus",
				"seller_profiles",
			},
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

			tables: []string{
				"orders",
				"users",
			},
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

			tables: []string{
				"orders",
				"seller_profiles",
			},
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

			tables: []string{
				"order_items",
				"orders",
			},
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

			tables: []string{
				"order_items",
				"menus",
			},
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

			tables: []string{
				"seller_pendapatans",
				"seller_profiles",
			},
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

			tables: []string{
				"chat_rooms",
				"users",
			},
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

			tables: []string{
				"chat_rooms",
				"seller_profiles",
			},
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

			tables: []string{
				"bubble_chats",
				"chat_rooms",
			},
		},

		// =================================================
		// CAMPAIGN PACKAGE → CAMPAIGN
		// =================================================

		{
			name: "fk_campaign_packages_campaign",

			sql: `
			ALTER TABLE campaign_packages
			ADD CONSTRAINT fk_campaign_packages_campaign
			FOREIGN KEY (campaign_id)
			REFERENCES campaigns(id)
			ON DELETE CASCADE
			`,

			tables: []string{
				"campaign_packages",
				"campaigns",
			},
		},

		// =================================================
		// SELLER CAMPAIGN → SELLER
		// =================================================

		{
			name: "fk_seller_campaigns_seller",

			sql: `
			ALTER TABLE seller_campaigns
			ADD CONSTRAINT fk_seller_campaigns_seller
			FOREIGN KEY (seller_id)
			REFERENCES seller_profiles(seller_id)
			ON DELETE CASCADE
			`,

			tables: []string{
				"seller_campaigns",
				"seller_profiles",
			},
		},

		// =================================================
		// SELLER CAMPAIGN → CAMPAIGN
		// =================================================

		{
			name: "fk_seller_campaigns_campaign",

			sql: `
			ALTER TABLE seller_campaigns
			ADD CONSTRAINT fk_seller_campaigns_campaign
			FOREIGN KEY (campaign_id)
			REFERENCES campaigns(id)
			ON DELETE CASCADE
			`,

			tables: []string{
				"seller_campaigns",
				"campaigns",
			},
		},

		// =================================================
		// SELLER CAMPAIGN → PACKAGE
		// =================================================

		{
			name: "fk_seller_campaigns_package",

			sql: `
			ALTER TABLE seller_campaigns
			ADD CONSTRAINT fk_seller_campaigns_package
			FOREIGN KEY (package_id)
			REFERENCES campaign_packages(id)
			ON DELETE RESTRICT
			`,

			tables: []string{
				"seller_campaigns",
				"campaigns",
				"campaign_packages",
			},
		},

		// =================================================
		// CAMPAIGN WALLET → SELLER
		// =================================================

		{
			name: "fk_campaign_wallets_seller",

			sql: `
			ALTER TABLE campaign_wallets
			ADD CONSTRAINT fk_campaign_wallets_seller
			FOREIGN KEY (seller_id)
			REFERENCES seller_profiles(seller_id)
			ON DELETE CASCADE
			`,

			tables: []string{
				"campaign_wallets",
				"seller_profiles",
			},
		},

		// =================================================
		// SELLER VERIFICATION → SELLER PROFILE
		// =================================================

		{
			name: "fk_seller_verifications_seller",

			sql: `
			ALTER TABLE seller_verifications
			ADD CONSTRAINT fk_seller_verifications_seller
			FOREIGN KEY (seller_id)
			REFERENCES seller_profiles(seller_id)
			ON DELETE CASCADE
			`,

			tables: []string{
				"seller_verifications",
				"seller_profiles",
			},
		},

		// =================================================
		// LOYALTY POINT → USER
		// =================================================

		{
			name: "fk_user_loyalty_points_user",

			sql: `
			ALTER TABLE user_loyalty_points
			ADD CONSTRAINT fk_user_loyalty_points_user
			FOREIGN KEY (user_id)
			REFERENCES users(id)
			ON DELETE CASCADE
			`,

			tables: []string{
				"user_loyalty_points",
				"users",
			},
		},

		// =================================================
		// REWARD REDEMPTION → USER
		// =================================================

		{
			name: "fk_reward_redemptions_user",

			sql: `
			ALTER TABLE reward_redemptions
			ADD CONSTRAINT fk_reward_redemptions_user
			FOREIGN KEY (user_id)
			REFERENCES users(id)
			ON DELETE CASCADE
			`,

			tables: []string{
				"reward_redemptions",
				"users",
			},
		},

		// =================================================
		// REWARD REDEMPTION → REWARD
		// =================================================

		{
			name: "fk_reward_redemptions_reward",

			sql: `
			ALTER TABLE reward_redemptions
			ADD CONSTRAINT fk_reward_redemptions_reward
			FOREIGN KEY (reward_id)
			REFERENCES rewards(id)
			ON DELETE RESTRICT
			`,

			tables: []string{
				"reward_redemptions",
				"rewards",
			},
		},
	}

	// =================================================
	// EXECUTE FOREIGN KEYS
	// =================================================

	for _, stmt := range fkStatements {

		// -------------------------------------------------
		// FK SUDAH ADA
		// -------------------------------------------------

		if constraintExists(stmt.name) {

			fmt.Printf(
				"✅ Foreign key sudah ada: %s\n",
				stmt.name,
			)

			continue
		}

		// -------------------------------------------------
		// CEK SEMUA TABLE
		// -------------------------------------------------

		allTablesExist := true

		for _, tableName := range stmt.tables {

			if !tableExists(tableName) {

				allTablesExist = false
				break
			}
		}

		if !allTablesExist {

			log.Printf(
				"⚠️ FK %s dilewati karena tabel dependency belum tersedia",
				stmt.name,
			)

			continue
		}

		// -------------------------------------------------
		// CREATE FK
		// -------------------------------------------------

		if err := DB.Exec(
			stmt.sql,
		).Error; err != nil {

			log.Printf(
				"⚠️ Gagal membuat FK %s: %v",
				stmt.name,
				err,
			)

			continue
		}

		fmt.Printf(
			"✅ Foreign key created: %s\n",
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

	// =================================================
	// CHECK EXISTING DATA
	// =================================================

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

	// =================================================
	// SUDAH ADA
	// =================================================

	if count > 0 {
		return
	}

	// =================================================
	// DEFAULT CATEGORIES
	// =================================================

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

	// =================================================
	// INSERT
	// =================================================

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
