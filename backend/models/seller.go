package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// =====================================================
// SELLER PROFILE
// =====================================================

type SellerProfile struct {
	// =================================================
	// PRIMARY KEY
	// =================================================

	ID string `json:"id" gorm:"column:id;type:uuid;primaryKey"`

	// =================================================
	// RELATION
	// =================================================

	SellerID string `json:"seller_id" gorm:"column:seller_id;type:uuid;uniqueIndex;not null"`

	UserID string `json:"user_id" gorm:"column:user_id;type:uuid"`

	// =================================================
	// PROFILE
	// =================================================

	NamaWarteg string `json:"nama_warteg" gorm:"column:nama_warteg"`

	NamaPemilik string `json:"nama_pemilik" gorm:"column:nama_pemilik"`

	NomorHP string `json:"nomor_hp" gorm:"column:nomor_hp"`

	Alamat string `json:"alamat" gorm:"column:alamat"`

	Deskripsi string `json:"deskripsi" gorm:"column:deskripsi"`

	// =================================================
	// JAM OPERASIONAL
	// =================================================

	JamBuka string `json:"jam_buka" gorm:"column:jam_buka"`

	JamTutup string `json:"jam_tutup" gorm:"column:jam_tutup"`

	// =================================================
	// LOKASI WARTEG
	// =================================================

	Latitude float64 `json:"latitude" gorm:"column:latitude"`

	Longitude float64 `json:"longitude" gorm:"column:longitude"`

	// =================================================
	// BANK
	// =================================================

	Bank string `json:"bank" gorm:"column:bank"`

	NomorRekening string `json:"nomor_rekening" gorm:"column:nomor_rekening"`

	NamaRekening string `json:"nama_rekening" gorm:"column:nama_rekening"`

	RekeningVerified bool `json:"rekening_verified" gorm:"column:rekening_verified"`

	// =================================================
	// TIMESTAMP
	// =================================================

	CreatedAt string `json:"created_at" gorm:"column:created_at"`

	UpdatedAt string `json:"updated_at" gorm:"column:updated_at"`
}

// =====================================================
// GENERATE SELLER PROFILE ID
// =====================================================
//
// PostgreSQL:
//
// seller_profiles.id = UUID
//
// Kalau ID belum diberikan ketika Create(),
// otomatis generate UUID.
//

func (s *SellerProfile) BeforeCreate(tx *gorm.DB) error {

	if s.ID == "" {
		s.ID = uuid.New().String()
	}

	return nil
}

// =====================================================
// CUSTOMER SELLER
// =====================================================
//
// Data seller yang dikirim ke customer / Explore page.
//

type CustomerSeller struct {

	// =================================================
	// IDENTIFIER
	// =================================================

	ID string `json:"id"`

	// =================================================
	// PROFILE
	// =================================================

	StoreName string `json:"store_name"`

	Description string `json:"description"`

	Address string `json:"address"`

	Owner string `json:"owner"`

	Phone string `json:"phone"`

	// =================================================
	// JAM OPERASIONAL
	// =================================================

	OpeningTime string `json:"opening_time"`

	ClosingTime string `json:"closing_time"`

	IsOpen bool `json:"is_open"`

	// =================================================
	// DATA DINAMIS CUSTOMER
	// =================================================

	Rating float64 `json:"rating"`

	DistanceKM float64 `json:"distance_km"`

	TotalMenu int `json:"total_menu"`
}
