package seller

import (
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/models"
)

// =====================================================
// SELLER PROFILE REPOSITORY
// =====================================================
//
// File ini KHUSUS repository seller profile.
//
// TIDAK BOLEH berisi:
// - DB
// - Connect()
// - migration
// - AutoMigrate()
// - repair database
// - foreign key
// - seed
//
// Database connection berada di:
// database/connection.go
// =====================================================

type SellerProfile = models.SellerProfile

// =====================================================
// GET PROFILE
// =====================================================

func GetProfile(sellerID string) (SellerProfile, error) {
	sellerID = strings.TrimSpace(sellerID)

	if sellerID == "" {
		return SellerProfile{}, errors.New("seller_id tidak boleh kosong")
	}

	var profile SellerProfile

	err := database.DB.
		Where("seller_id = ?", sellerID).
		First(&profile).
		Error

	if err != nil {
		return SellerProfile{}, err
	}

	return profile, nil
}

// =====================================================
// GET PROFILE BY ID
// =====================================================

func GetProfileByID(id string) (SellerProfile, error) {
	id = strings.TrimSpace(id)

	if id == "" {
		return SellerProfile{}, errors.New("id profile tidak boleh kosong")
	}

	var profile SellerProfile

	err := database.DB.
		Where("id = ?", id).
		First(&profile).
		Error

	if err != nil {
		return SellerProfile{}, err
	}

	return profile, nil
}

// =====================================================
// SAVE PROFILE
// =====================================================
//
// SIGNATURE:
//
// SaveProfile(sellerID, profile)
//
// TIDAK menggunakan userID.
//
// =====================================================

func SaveProfile(
	sellerID string,
	profile SellerProfile,
) error {

	sellerID = strings.TrimSpace(sellerID)

	if sellerID == "" {
		return errors.New("seller_id tidak boleh kosong")
	}

	// -------------------------------------------------
	// Seller ID harus berasal dari parameter.
	// -------------------------------------------------

	profile.SellerID = sellerID

	// -------------------------------------------------
	// Normalize string
	// -------------------------------------------------

	profile.NamaWarteg = strings.TrimSpace(profile.NamaWarteg)
	profile.NamaPemilik = strings.TrimSpace(profile.NamaPemilik)
	profile.NomorHP = strings.TrimSpace(profile.NomorHP)
	profile.Alamat = strings.TrimSpace(profile.Alamat)
	profile.Deskripsi = strings.TrimSpace(profile.Deskripsi)

	profile.JamBuka = strings.TrimSpace(profile.JamBuka)
	profile.JamTutup = strings.TrimSpace(profile.JamTutup)

	profile.Image = strings.TrimSpace(profile.Image)

	profile.Bank = strings.TrimSpace(profile.Bank)
	profile.NomorRekening = strings.TrimSpace(profile.NomorRekening)
	profile.NamaRekening = strings.TrimSpace(profile.NamaRekening)

	// =================================================
	// CARI PROFILE EXISTING
	// =================================================

	var existing SellerProfile

	err := database.DB.
		Where("seller_id = ?", sellerID).
		First(&existing).
		Error

	// =================================================
	// PROFILE SUDAH ADA
	// =================================================

	if err == nil {

		updates := map[string]interface{}{
			"nama_warteg":       profile.NamaWarteg,
			"nama_pemilik":      profile.NamaPemilik,
			"nomor_hp":          profile.NomorHP,
			"alamat":            profile.Alamat,
			"deskripsi":         profile.Deskripsi,
			"jam_buka":          profile.JamBuka,
			"jam_tutup":         profile.JamTutup,
			"latitude":          profile.Latitude,
			"longitude":         profile.Longitude,
			"image":             profile.Image,
			"bank":              profile.Bank,
			"nomor_rekening":    profile.NomorRekening,
			"nama_rekening":     profile.NamaRekening,
			"rekening_verified": profile.RekeningVerified,
			"updated_at":        time.Now(),
		}

		return database.DB.
			Model(&SellerProfile{}).
			Where("seller_id = ?", sellerID).
			Updates(updates).
			Error
	}

	// =================================================
	// ERROR SELAIN RECORD NOT FOUND
	// =================================================

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	// =================================================
	// PROFILE BELUM ADA → CREATE
	// =================================================

	if strings.TrimSpace(profile.ID) == "" {
		profile.ID = newSellerProfileUUID()
	}

	now := time.Now()

	if profile.CreatedAt.IsZero() {
		profile.CreatedAt = now
	}

	profile.UpdatedAt = now

	return database.DB.
		Create(&profile).
		Error
}

// =====================================================
// UPDATE PROFILE
// =====================================================

func UpdateProfile(
	sellerID string,
	profile SellerProfile,
) error {
	return SaveProfile(sellerID, profile)
}

// =====================================================
// DELETE PROFILE
// =====================================================

func DeleteProfile(sellerID string) error {
	sellerID = strings.TrimSpace(sellerID)

	if sellerID == "" {
		return errors.New("seller_id tidak boleh kosong")
	}

	return database.DB.
		Where("seller_id = ?", sellerID).
		Delete(&SellerProfile{}).
		Error
}

// =====================================================
// CHECK PROFILE EXISTS
// =====================================================

func ProfileExists(sellerID string) bool {
	sellerID = strings.TrimSpace(sellerID)

	if sellerID == "" {
		return false
	}

	var count int64

	err := database.DB.
		Model(&SellerProfile{}).
		Where("seller_id = ?", sellerID).
		Count(&count).
		Error

	if err != nil {
		return false
	}

	return count > 0
}

// =====================================================
// CREATE PROFILE
// =====================================================

func CreateProfile(profile SellerProfile) error {

	profile.SellerID = strings.TrimSpace(profile.SellerID)

	if profile.SellerID == "" {
		return errors.New("seller_id tidak boleh kosong")
	}

	profile.NamaWarteg = strings.TrimSpace(profile.NamaWarteg)
	profile.NamaPemilik = strings.TrimSpace(profile.NamaPemilik)
	profile.NomorHP = strings.TrimSpace(profile.NomorHP)
	profile.Alamat = strings.TrimSpace(profile.Alamat)
	profile.Deskripsi = strings.TrimSpace(profile.Deskripsi)

	profile.JamBuka = strings.TrimSpace(profile.JamBuka)
	profile.JamTutup = strings.TrimSpace(profile.JamTutup)

	profile.Image = strings.TrimSpace(profile.Image)

	profile.Bank = strings.TrimSpace(profile.Bank)
	profile.NomorRekening = strings.TrimSpace(profile.NomorRekening)
	profile.NamaRekening = strings.TrimSpace(profile.NamaRekening)

	if strings.TrimSpace(profile.ID) == "" {
		profile.ID = newSellerProfileUUID()
	}

	now := time.Now()

	if profile.CreatedAt.IsZero() {
		profile.CreatedAt = now
	}

	profile.UpdatedAt = now

	return database.DB.
		Create(&profile).
		Error
}

// =====================================================
// UUID GENERATOR
// =====================================================

func newSellerProfileUUID() string {

	id, err := uuid.NewV7()

	if err == nil {
		return id.String()
	}

	return uuid.New().String()
}
