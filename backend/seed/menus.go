package seed

import (
	"fmt"
	"log"

	"gorm.io/gorm"

	"github.com/krisn4novianto/wartegkita/backend/models"
)

// ========================================
// Fixed Menu IDs  digunakan di orders seeder
// ========================================
var (
	// Warteg Pak Hendra
	MenuNasiRamesID  = mustUUID("01970000-0000-7000-8000-000000000030")
	MenuAyamGorengID = mustUUID("01970000-0000-7000-8000-000000000031")
	MenuTempeMendoanID = mustUUID("01970000-0000-7000-8000-000000000032")
	MenuSayurAsemID  = mustUUID("01970000-0000-7000-8000-000000000033")
	MenuEsTehID      = mustUUID("01970000-0000-7000-8000-000000000034")

	// Warteg Bu Ani
	MenuNasiSundaID  = mustUUID("01970000-0000-7000-8000-000000000040")
	MenuIkanBakarID  = mustUUID("01970000-0000-7000-8000-000000000041")
	MenuPecelID      = mustUUID("01970000-0000-7000-8000-000000000042")
	MenuTahuGorengID = mustUUID("01970000-0000-7000-8000-000000000043")
	MenuEsJerukID    = mustUUID("01970000-0000-7000-8000-000000000044")
)

// ========================================
// SEED MENUS
// ========================================

func seedMenus(db *gorm.DB) {
	var count int64
	db.Model(&models.Menu{}).Count(&count)
	if count > 0 {
		log.Println("  menus: sudah ada data, skip")
		return
	}

	menus := []models.Menu{
		//  Warteg Pak Hendra 
		{
			ID:          MenuNasiRamesID,
			SellerID:    SellerProfile1SellerID,
			Name:        "Nasi Rames Komplit",
			Description: "Nasi putih dengan lauk pilihan: ayam, tahu, tempe, dan sayur. Porsi kenyang!",
			Price:       20000,
			Stock:       50,
			Category:    "Nasi Rames",
			Image:       "",
			Available:   true,
		},
		{
			ID:          MenuAyamGorengID,
			SellerID:    SellerProfile1SellerID,
			Name:        "Ayam Goreng Crispy",
			Description: "Ayam goreng dengan tepung renyah, bumbu rempah khas Jawa.",
			Price:       18000,
			Stock:       30,
			Category:    "Ayam",
			Image:       "",
			Available:   true,
		},
		{
			ID:          MenuTempeMendoanID,
			SellerID:    SellerProfile1SellerID,
			Name:        "Tempe Mendoan",
			Description: "Tempe tipis dibalut tepung bumbu, digoreng setengah matang. Gurih dan lezat.",
			Price:       5000,
			Stock:       100,
			Category:    "Tahu & Tempe",
			Image:       "",
			Available:   true,
		},
		{
			ID:          MenuSayurAsemID,
			SellerID:    SellerProfile1SellerID,
			Name:        "Sayur Asem",
			Description: "Sayur asem segar dengan jagung, kacang panjang, labu siam, dan daun salam.",
			Price:       8000,
			Stock:       40,
			Category:    "Sayur",
			Image:       "",
			Available:   true,
		},
		{
			ID:          MenuEsTehID,
			SellerID:    SellerProfile1SellerID,
			Name:        "Es Teh Manis",
			Description: "Teh manis segar dengan es batu yang menyejukkan.",
			Price:       5000,
			Stock:       200,
			Category:    "Minuman",
			Image:       "",
			Available:   true,
		},

		//  Warteg Bu Ani 
		{
			ID:          MenuNasiSundaID,
			SellerID:    SellerProfile2SellerID,
			Name:        "Nasi Sunda Lengkap",
			Description: "Nasi putih dengan ikan asin, lalapan segar, sambal, dan tahu goreng.",
			Price:       22000,
			Stock:       40,
			Category:    "Nasi Rames",
			Image:       "",
			Available:   true,
		},
		{
			ID:          MenuIkanBakarID,
			SellerID:    SellerProfile2SellerID,
			Name:        "Ikan Bakar Bumbu Kecap",
			Description: "Ikan kembung segar dibakar dengan bumbu kecap manis dan bawang.",
			Price:       25000,
			Stock:       20,
			Category:    "Ikan",
			Image:       "",
			Available:   true,
		},
		{
			ID:          MenuPecelID,
			SellerID:    SellerProfile2SellerID,
			Name:        "Pecel Sayur",
			Description: "Aneka sayuran rebus dengan siraman bumbu kacang khas Sunda.",
			Price:       12000,
			Stock:       35,
			Category:    "Sayur",
			Image:       "",
			Available:   true,
		},
		{
			ID:          MenuTahuGorengID,
			SellerID:    SellerProfile2SellerID,
			Name:        "Tahu Goreng Crispy",
			Description: "Tahu putih digoreng garing, disajikan dengan kecap dan cabai rawit.",
			Price:       4000,
			Stock:       80,
			Category:    "Tahu & Tempe",
			Image:       "",
			Available:   true,
		},
		{
			ID:          MenuEsJerukID,
			SellerID:    SellerProfile2SellerID,
			Name:        "Es Jeruk Peras",
			Description: "Jeruk peras segar dengan es batu, manis alami tanpa pemanis buatan.",
			Price:       7000,
			Stock:       150,
			Category:    "Minuman",
			Image:       "",
			Available:   true,
		},
	}

	if err := db.Create(&menus).Error; err != nil {
		log.Fatalf("seed: gagal insert menus: %v", err)
	}
	fmt.Printf(" Seeded %d menus\n", len(menus))
}
