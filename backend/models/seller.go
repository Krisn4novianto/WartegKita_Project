package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// =====================================================
// SELLER PROFILE
// =====================================================
//
// Tabel:
// seller_profiles
//
// Menyimpan:
// - identitas warteg
// - identitas pemilik
// - dokumen KTP
// - kontak
// - alamat
// - jam operasional
// - lokasi
// - rekening
//
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

	UserID string `json:"user_id" gorm:"column:user_id;type:uuid;index"`

	// =================================================
	// BUSINESS PROFILE
	// =================================================

	NamaWarteg string `json:"nama_warteg" gorm:"column:nama_warteg;size:150"`

	NamaPemilik string `json:"nama_pemilik" gorm:"column:nama_pemilik;size:150"`

	NomorHP string `json:"nomor_hp" gorm:"column:nomor_hp;size:30"`

	Alamat string `json:"alamat" gorm:"column:alamat;type:text"`

	Deskripsi string `json:"deskripsi" gorm:"column:deskripsi;type:text"`

	// =================================================
	// IDENTITY / KTP
	// =================================================

	// Nomor NIK dari KTP.
	//
	// Jangan pernah dikirim pada endpoint
	// public seller/customer.

	KTPNumber string `json:"-" gorm:"column:ktp_number;size:20;index"`

	// Path file KTP yang disimpan di server.
	//
	// Jangan expose sebagai image public.

	KTPImage string `json:"-" gorm:"column:ktp_image;type:text"`

	// Status verifikasi KTP.

	KTPVerified bool `json:"ktp_verified" gorm:"column:ktp_verified;default:false"`

	// pending
	// verified
	// rejected

	VerificationStatus string `json:"verification_status" gorm:"column:verification_status;size:30;default:'pending'"`

	// =================================================
	// JAM OPERASIONAL
	// =================================================

	JamBuka string `json:"jam_buka" gorm:"column:jam_buka"`

	JamTutup string `json:"jam_tutup" gorm:"column:jam_tutup"`

	// =================================================
	// LOKASI
	// =================================================

	Latitude float64 `json:"latitude" gorm:"column:latitude"`

	Longitude float64 `json:"longitude" gorm:"column:longitude"`

	// =================================================
	// IMAGE
	// =================================================

	Image string `json:"image" gorm:"column:image"`

	// =================================================
	// BANK
	// =================================================

	Bank string `json:"bank" gorm:"column:bank"`

	NomorRekening string `json:"nomor_rekening" gorm:"column:nomor_rekening"`

	NamaRekening string `json:"nama_rekening" gorm:"column:nama_rekening"`

	RekeningVerified bool `json:"rekening_verified" gorm:"column:rekening_verified;default:false"`

	// =================================================
	// TIMESTAMP
	// =================================================

	CreatedAt time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`

	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`
}

// =====================================================
// TABLE NAME
// =====================================================

func (SellerProfile) TableName() string {
	return "seller_profiles"
}

// =====================================================
// BEFORE CREATE
// =====================================================

func (s *SellerProfile) BeforeCreate(tx *gorm.DB) error {

	if s.ID == "" {
		s.ID = uuid.New().String()
	}

	if s.VerificationStatus == "" {
		s.VerificationStatus = "pending"
	}

	return nil
}

// =====================================================
// CUSTOMER SELLER
// =====================================================

type CustomerSeller struct {
	ID string `json:"id"`

	SellerID string `json:"seller_id,omitempty"`

	StoreName string `json:"store_name"`

	Description string `json:"description"`

	Address string `json:"address"`

	Owner string `json:"owner"`

	Phone string `json:"phone"`

	Image string `json:"image"`

	OpeningTime string `json:"opening_time"`

	ClosingTime string `json:"closing_time"`

	JamBuka string `json:"jam_buka,omitempty"`

	JamTutup string `json:"jam_tutup,omitempty"`

	IsOpen bool `json:"is_open"`

	Rating float64 `json:"rating"`

	DistanceKM float64 `json:"distance_km"`

	TotalMenu int `json:"total_menu"`
}
