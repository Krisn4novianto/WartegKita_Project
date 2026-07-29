package seed

import (
	"fmt"
	"log"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/google/uuid"
	"github.com/krisn4novianto/wartegkita/backend/models"
)

// ========================================
// FIXED UUIDs  agar konsisten di semua seeder
// ========================================

// Users
var (
	UserCustomer1ID = mustUUID("01970000-0000-7000-8000-000000000001")
	UserCustomer2ID = mustUUID("01970000-0000-7000-8000-000000000002")
	UserSeller1ID   = mustUUID("01970000-0000-7000-8000-000000000010")
	UserSeller2ID   = mustUUID("01970000-0000-7000-8000-000000000011")
)

// Seller Profiles
var (
	SellerProfile1ID       = mustUUID("01970000-0000-7000-8000-000000000020")
	SellerProfile1SellerID = mustUUID("01970000-0000-7000-8000-000000000021") // seller_id FK used by menus/orders
	SellerProfile2ID       = mustUUID("01970000-0000-7000-8000-000000000022")
	SellerProfile2SellerID = mustUUID("01970000-0000-7000-8000-000000000023")
)

func mustUUID(s string) string {
	id, err := uuid.Parse(s)
	if err != nil {
		panic(fmt.Sprintf("invalid UUID in seed: %s  %v", s, err))
	}
	return id.String()
}

func newID() string {
	id, _ := uuid.NewV7()
	return id.String()
}

func hashPassword(raw string) string {
	bytes, err := bcrypt.GenerateFromPassword([]byte(raw), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("seed: gagal hash password: %v", err)
	}
	return string(bytes)
}

// ========================================
// SEED USERS
// ========================================

func seedUsers(db *gorm.DB) {
	var count int64
	db.Model(&models.User{}).Count(&count)
	if count > 0 {
		log.Println("  users: sudah ada data, skip")
		return
	}

	users := []models.User{
		{
			ID:       UserCustomer1ID,
			Name:     "Budi Santoso",
			Email:    "budi@example.com",
			Password: hashPassword("password123"),
		},
		{
			ID:       UserCustomer2ID,
			Name:     "Siti Rahayu",
			Email:    "siti@example.com",
			Password: hashPassword("password123"),
		},
		{
			ID:       UserSeller1ID,
			Name:     "Pak Hendra (Seller)",
			Email:    "hendra@warteg.com",
			Password: hashPassword("seller123"),
		},
		{
			ID:       UserSeller2ID,
			Name:     "Bu Ani (Seller)",
			Email:    "ani@warteg.com",
			Password: hashPassword("seller123"),
		},
	}

	if err := db.Create(&users).Error; err != nil {
		log.Fatalf("seed: gagal insert users: %v", err)
	}
	fmt.Printf(" Seeded %d users\n", len(users))
}

// ========================================
// SEED SELLER PROFILES
// ========================================

func seedSellers(db *gorm.DB) {
	var count int64
	db.Model(&models.SellerProfile{}).Count(&count)
	if count > 0 {
		log.Println("  seller_profiles: sudah ada data, skip")
		return
	}

	sellers := []models.SellerProfile{
		{
			ID:            SellerProfile1ID,
			SellerID:      SellerProfile1SellerID,
			NamaWarteg:    "Warteg Pak Hendra",
			NamaPemilik:   "Hendra Gunawan",
			NomorHP:       "081234567890",
			Alamat:        "Jl. Sudirman No. 12, Jakarta Pusat",
			Deskripsi:     "Warteg legendaris sejak 1995, masakan rumahan otentik Jawa Tengah.",
			Bank:          "BCA",
			NomorRekening: "1234567890",
		},
		{
			ID:            SellerProfile2ID,
			SellerID:      SellerProfile2SellerID,
			NamaWarteg:    "Warteg Bu Ani",
			NamaPemilik:   "Ani Susanti",
			NomorHP:       "082198765432",
			Alamat:        "Jl. Kebon Jeruk No. 7, Jakarta Barat",
			Deskripsi:     "Masakan Sunda segar setiap hari, harga merakyat.",
			Bank:          "Mandiri",
			NomorRekening: "0987654321",
		},
	}

	if err := db.Create(&sellers).Error; err != nil {
		log.Fatalf("seed: gagal insert seller_profiles: %v", err)
	}
	fmt.Printf(" Seeded %d seller_profiles\n", len(sellers))
}

// ========================================
// SEED MENU CATEGORIES
// ========================================

func seedMenuCategories(db *gorm.DB) {
	var count int64
	db.Model(&models.MenuCategory{}).Count(&count)
	if count > 0 {
		log.Println("  menu_categories: sudah ada data, skip")
		return
	}

	categories := []models.MenuCategory{
		{ID: newID(), Name: "Nasi Rames", Emoji: "", IsActive: true},
		{ID: newID(), Name: "Ayam", Emoji: "", IsActive: true},
		{ID: newID(), Name: "Ikan", Emoji: "", IsActive: true},
		{ID: newID(), Name: "Sayur", Emoji: "", IsActive: true},
		{ID: newID(), Name: "Tahu & Tempe", Emoji: "", IsActive: true},
		{ID: newID(), Name: "Minuman", Emoji: "", IsActive: true},
		{ID: newID(), Name: "Camilan", Emoji: "", IsActive: true},
	}

	if err := db.Create(&categories).Error; err != nil {
		log.Fatalf("seed: gagal insert menu_categories: %v", err)
	}
	fmt.Printf(" Seeded %d menu_categories\n", len(categories))
}
