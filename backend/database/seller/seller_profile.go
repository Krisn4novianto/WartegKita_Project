package seller

import (
	"errors"
	"log"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/models"
)

// =====================================================
// TYPE ALIAS
// =====================================================

type SellerProfile = models.SellerProfile
type CustomerSeller = models.CustomerSeller

// =====================================================
// CONSTANT
// =====================================================

const jakartaTimezone = "Asia/Jakarta"

// =====================================================
// CREATE / MIGRATE SELLER PROFILE TABLE
// =====================================================

func CreateSellerProfileTable() {

	if database.DB == nil {
		log.Println("❌ Database belum terhubung")
		return
	}

	if err := database.DB.AutoMigrate(
		&models.SellerProfile{},
	); err != nil {

		log.Println(
			"❌ Gagal migrate tabel seller_profiles:",
			err,
		)

		return
	}

	log.Println(
		"✅ Tabel seller_profiles berhasil dibuat / dimigrasikan",
	)
}

// =====================================================
// GET SELLER PROFILE
// =====================================================

func GetProfile(
	sellerID string,
) (SellerProfile, error) {

	var profile SellerProfile

	if database.DB == nil {
		return profile, errors.New(
			"database belum terhubung",
		)
	}

	sellerID = strings.TrimSpace(sellerID)

	if sellerID == "" {
		return profile, errors.New(
			"seller ID tidak boleh kosong",
		)
	}

	err := database.DB.
		Where(
			"seller_id = ?",
			sellerID,
		).
		First(&profile).
		Error

	if err != nil {
		return profile, err
	}

	profile.UserID = strings.TrimSpace(profile.UserID)

	profile.JamBuka =
		normalizeOperationalTime(profile.JamBuka)

	profile.JamTutup =
		normalizeOperationalTime(profile.JamTutup)

	return profile, nil
}

// =====================================================
// SAVE / UPDATE SELLER PROFILE
// =====================================================

func SaveProfile(
	sellerID string,
	userID string,
	data SellerProfile,
) error {

	if database.DB == nil {
		return errors.New(
			"database belum terhubung",
		)
	}

	sellerID = strings.TrimSpace(sellerID)
	userID = strings.TrimSpace(userID)

	if sellerID == "" {
		return errors.New(
			"seller ID tidak boleh kosong",
		)
	}

	if userID == "" {
		return errors.New(
			"user ID tidak boleh kosong",
		)
	}

	// =================================================
	// FORCE OWNERSHIP
	// =================================================

	data.SellerID = sellerID
	data.UserID = userID

	// =================================================
	// NORMALIZE BASIC DATA
	// =================================================

	data.NamaWarteg = strings.TrimSpace(data.NamaWarteg)
	data.NamaPemilik = strings.TrimSpace(data.NamaPemilik)
	data.NomorHP = strings.TrimSpace(data.NomorHP)
	data.Alamat = strings.TrimSpace(data.Alamat)
	data.Deskripsi = strings.TrimSpace(data.Deskripsi)

	// =================================================
	// NORMALIZE JAM
	// =================================================

	data.JamBuka =
		normalizeOperationalTime(data.JamBuka)

	data.JamTutup =
		normalizeOperationalTime(data.JamTutup)

	// =================================================
	// NORMALIZE BANK
	// =================================================

	data.Bank = strings.TrimSpace(data.Bank)
	data.NomorRekening = strings.TrimSpace(data.NomorRekening)
	data.NamaRekening = strings.TrimSpace(data.NamaRekening)

	// =================================================
	// CEK EXISTING
	// =================================================

	var existing SellerProfile

	err := database.DB.
		Where(
			"seller_id = ?",
			sellerID,
		).
		First(&existing).
		Error

	// =================================================
	// UPDATE
	// =================================================

	if err == nil {

		updateData := map[string]interface{}{

			"user_id": userID,

			"nama_warteg":  data.NamaWarteg,
			"nama_pemilik": data.NamaPemilik,
			"nomor_hp":     data.NomorHP,
			"alamat":       data.Alamat,
			"deskripsi":    data.Deskripsi,

			"jam_buka":  data.JamBuka,
			"jam_tutup": data.JamTutup,

			"latitude":  data.Latitude,
			"longitude": data.Longitude,

			"bank":              data.Bank,
			"nomor_rekening":    data.NomorRekening,
			"rekening_verified": data.RekeningVerified,
			"nama_rekening":     data.NamaRekening,
		}

		return database.DB.
			Model(&existing).
			Updates(updateData).
			Error
	}

	// =================================================
	// DATABASE ERROR
	// =================================================

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	// =================================================
	// CREATE
	// =================================================

	data.SellerID = sellerID
	data.UserID = userID

	return database.DB.
		Create(&data).
		Error
}

// =====================================================
// NORMALIZE OPERATIONAL TIME
// =====================================================

func normalizeOperationalTime(
	value string,
) string {

	value = strings.TrimSpace(value)

	if value == "" {
		return ""
	}

	location, err := time.LoadLocation(
		jakartaTimezone,
	)

	if err != nil {
		return value
	}

	parsed, err := parseOperationalTime(
		value,
		location,
	)

	if err != nil {
		return value
	}

	return parsed.Format("15:04")
}

// =====================================================
// PARSE OPERATIONAL TIME
// =====================================================

func parseOperationalTime(
	value string,
	location *time.Location,
) (time.Time, error) {

	value = strings.TrimSpace(value)

	if value == "" {
		return time.Time{}, errors.New(
			"jam kosong",
		)
	}

	formats := []string{
		"15:04",
		"15:04:05",
	}

	for _, format := range formats {

		parsed, err := time.ParseInLocation(
			format,
			value,
			location,
		)

		if err == nil {
			return parsed, nil
		}
	}

	return time.Time{}, errors.New(
		"format jam tidak valid",
	)
}

// =====================================================
// CALCULATE SELLER OPEN STATUS
// =====================================================

func CalculateIsOpen(
	openingTime string,
	closingTime string,
) bool {

	openingTime = strings.TrimSpace(openingTime)
	closingTime = strings.TrimSpace(closingTime)

	if openingTime == "" ||
		closingTime == "" {
		return false
	}

	location, err := time.LoadLocation(
		jakartaTimezone,
	)

	if err != nil {
		return false
	}

	now := time.Now().In(location)

	open, err := parseOperationalTime(
		openingTime,
		location,
	)

	if err != nil {
		return false
	}

	closeTime, err := parseOperationalTime(
		closingTime,
		location,
	)

	if err != nil {
		return false
	}

	currentMinutes :=
		now.Hour()*60 +
			now.Minute()

	openingMinutes :=
		open.Hour()*60 +
			open.Minute()

	closingMinutes :=
		closeTime.Hour()*60 +
			closeTime.Minute()

	if openingMinutes == closingMinutes {
		return false
	}

	if openingMinutes < closingMinutes {

		return currentMinutes >= openingMinutes &&
			currentMinutes < closingMinutes
	}

	return currentMinutes >= openingMinutes ||
		currentMinutes < closingMinutes
}

// =====================================================
// ENSURE SELLER PROFILE
// =====================================================

func EnsureProfile(
	sellerID string,
	userID string,
	sellerName string,
) (SellerProfile, error) {

	if database.DB == nil {
		return SellerProfile{}, errors.New(
			"database belum terhubung",
		)
	}

	sellerID = strings.TrimSpace(sellerID)
	userID = strings.TrimSpace(userID)
	sellerName = strings.TrimSpace(sellerName)

	if sellerID == "" {
		return SellerProfile{}, errors.New(
			"seller ID tidak boleh kosong",
		)
	}

	if userID == "" {
		return SellerProfile{}, errors.New(
			"user ID tidak boleh kosong",
		)
	}

	profile, err := GetProfile(sellerID)

	if err == nil {

		// =================================================
		// REPAIR OWNERSHIP
		// =================================================

		if strings.TrimSpace(profile.UserID) != userID {

			if err := database.DB.
				Model(&SellerProfile{}).
				Where(
					"seller_id = ?",
					sellerID,
				).
				Update(
					"user_id",
					userID,
				).
				Error; err != nil {

				return SellerProfile{}, err
			}

			profile.UserID = userID
		}

		return profile, nil
	}

	if !errors.Is(
		err,
		gorm.ErrRecordNotFound,
	) {
		return SellerProfile{}, err
	}

	profile = SellerProfile{

		SellerID: sellerID,
		UserID:   userID,

		NamaWarteg:  sellerName,
		NamaPemilik: sellerName,

		NomorHP:   "",
		Alamat:    "",
		Deskripsi: "",

		JamBuka:  "",
		JamTutup: "",

		Latitude:  0,
		Longitude: 0,

		Bank:             "",
		NomorRekening:    "",
		RekeningVerified: false,
		NamaRekening:     "",
	}

	if err := SaveProfile(
		sellerID,
		userID,
		profile,
	); err != nil {
		return SellerProfile{}, err
	}

	return GetProfile(sellerID)
}

// =====================================================
// GET ALL SELLER PROFILES
// =====================================================

func GetAllProfiles() (
	[]CustomerSeller,
	error,
) {

	if database.DB == nil {
		return nil, errors.New(
			"database belum terhubung",
		)
	}

	var profiles []SellerProfile

	err := database.DB.
		Order("nama_warteg ASC").
		Find(&profiles).
		Error

	if err != nil {
		return nil, err
	}

	sellers := make(
		[]CustomerSeller,
		0,
		len(profiles),
	)

	for _, p := range profiles {

		openingTime :=
			normalizeOperationalTime(p.JamBuka)

		closingTime :=
			normalizeOperationalTime(p.JamTutup)

		isOpen := CalculateIsOpen(
			openingTime,
			closingTime,
		)

		sellers = append(
			sellers,
			CustomerSeller{

				ID: p.SellerID,

				StoreName:   p.NamaWarteg,
				Description: p.Deskripsi,
				Address:     p.Alamat,
				Owner:       p.NamaPemilik,
				Phone:       p.NomorHP,

				OpeningTime: openingTime,
				ClosingTime: closingTime,

				IsOpen: isOpen,
			},
		)
	}

	return sellers, nil
}
