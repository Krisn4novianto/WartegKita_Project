package controllers

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	sellerdb "github.com/krisn4novianto/wartegkita/backend/database/seller"
)

// =====================================================
// GET SELLER PROFILE
//
// GET /api/v1/sellers/:seller_id/profile
// =====================================================

func GetSellerProfile(c *gin.Context) {

	sellerID := strings.TrimSpace(
		c.Param("seller_id"),
	)

	if sellerID == "" {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Seller ID tidak boleh kosong",
			},
		)

		return
	}

	profile, err := sellerdb.GetProfile(
		sellerID,
	)

	if err != nil {
		c.JSON(
			http.StatusOK,
			gin.H{
				"success": true,
				"data": gin.H{
					"seller_id": sellerID,

					"nama_warteg":  "",
					"nama_pemilik": "",
					"nomor_hp":     "",
					"alamat":       "",
					"deskripsi":    "",

					"jam_buka":     "",
					"jam_tutup":    "",
					"opening_time": "",
					"closing_time": "",

					"bank":              "",
					"nomor_rekening":    "",
					"rekening_verified": false,
					"nama_rekening":     "",
				},
			},
		)

		return
	}

	// =================================================
	// NORMALIZE JAM DARI DATABASE
	// =================================================

	profile.JamBuka = normalizeTime(profile.JamBuka)
	profile.JamTutup = normalizeTime(profile.JamTutup)

	c.JSON(
		http.StatusOK,
		gin.H{
			"success": true,
			"data":    profile,
		},
	)
}

// =====================================================
// UPDATE SELLER PROFILE
//
// PUT /api/v1/sellers/:seller_id/profile
// =====================================================

func UpdateSellerProfile(c *gin.Context) {

	sellerID := strings.TrimSpace(
		c.Param("seller_id"),
	)

	if sellerID == "" {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Seller ID tidak boleh kosong",
			},
		)

		return
	}

	// =================================================
	// USER ID DARI AUTH
	// =================================================

	userID := strings.TrimSpace(
		c.GetString("user_id"),
	)

	if userID == "" {
		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"message": "User ID tidak ditemukan dari authentication context",
			},
		)

		return
	}

	// =================================================
	// REQUEST BODY
	// =================================================

	var profile sellerdb.SellerProfile

	if err := c.ShouldBindJSON(&profile); err != nil {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Format data tidak valid",
				"error":   err.Error(),
			},
		)

		return
	}

	// =================================================
	// SELLER ID DARI URL
	// =================================================

	profile.SellerID = sellerID

	// =================================================
	// NORMALIZE JAM
	// =================================================

	profile.JamBuka = normalizeTime(
		profile.JamBuka,
	)

	profile.JamTutup = normalizeTime(
		profile.JamTutup,
	)

	// =================================================
	// VALIDASI JAM BUKA
	// =================================================

	if profile.JamBuka == "" {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Jam buka wajib diisi dengan format HH:mm",
			},
		)

		return
	}

	// =================================================
	// VALIDASI JAM TUTUP
	// =================================================

	if profile.JamTutup == "" {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Jam tutup wajib diisi dengan format HH:mm",
			},
		)

		return
	}

	// =================================================
	// VALIDATE JAM BUKA
	// =================================================

	openMinutes, openOK := parseTimeToMinutes(
		profile.JamBuka,
	)

	if !openOK {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Format jam buka tidak valid. Gunakan HH:mm",
			},
		)

		return
	}

	// =================================================
	// VALIDATE JAM TUTUP
	// =================================================

	closeMinutes, closeOK := parseTimeToMinutes(
		profile.JamTutup,
	)

	if !closeOK {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Format jam tutup tidak valid. Gunakan HH:mm",
			},
		)

		return
	}

	// =================================================
	// JAM SAMA = TUTUP
	// =================================================

	if openMinutes == closeMinutes {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Jam buka dan jam tutup tidak boleh sama",
			},
		)

		return
	}

	// =================================================
	// SAVE PROFILE
	// =================================================

	if err := sellerdb.SaveProfile(
		sellerID,
		userID,
		profile,
	); err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal menyimpan data profil",
				"error":   err.Error(),
			},
		)

		return
	}

	// =================================================
	// GET DATA TERBARU
	// =================================================

	savedProfile, err := sellerdb.GetProfile(
		sellerID,
	)

	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Profil berhasil disimpan tetapi gagal mengambil data terbaru",
				"error":   err.Error(),
			},
		)

		return
	}

	// =================================================
	// NORMALIZE HASIL
	// =================================================

	savedProfile.JamBuka = normalizeTime(
		savedProfile.JamBuka,
	)

	savedProfile.JamTutup = normalizeTime(
		savedProfile.JamTutup,
	)

	// =================================================
	// SUCCESS
	// =================================================

	c.JSON(
		http.StatusOK,
		gin.H{
			"success": true,
			"message": "Profile usaha berhasil disimpan",
			"data":    savedProfile,
		},
	)
}

// =====================================================
// GET CUSTOMER SELLER DETAIL
//
// GET /api/v1/sellers/:seller_id
// =====================================================

func GetCustomerSellerDetail(c *gin.Context) {

	sellerID := strings.TrimSpace(
		c.Param("seller_id"),
	)

	if sellerID == "" {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Seller ID tidak boleh kosong",
			},
		)

		return
	}

	// =================================================
	// GET PROFILE
	// =================================================

	profile, err := sellerdb.GetProfile(
		sellerID,
	)

	if err != nil {
		c.JSON(
			http.StatusNotFound,
			gin.H{
				"success": false,
				"message": "Profil warteg tidak ditemukan",
			},
		)

		return
	}

	// =================================================
	// NORMALIZE PROFILE
	// =================================================

	namaWarteg := strings.TrimSpace(
		profile.NamaWarteg,
	)

	namaPemilik := strings.TrimSpace(
		profile.NamaPemilik,
	)

	nomorHP := strings.TrimSpace(
		profile.NomorHP,
	)

	alamat := strings.TrimSpace(
		profile.Alamat,
	)

	deskripsi := strings.TrimSpace(
		profile.Deskripsi,
	)

	// =================================================
	// NORMALIZE JAM
	// =================================================

	jamBuka := normalizeTime(
		profile.JamBuka,
	)

	jamTutup := normalizeTime(
		profile.JamTutup,
	)

	// =================================================
	// HITUNG STATUS BUKA
	// =================================================

	isOpen := false

	if jamBuka != "" && jamTutup != "" {
		isOpen = isSellerOpen(
			jamBuka,
			jamTutup,
		)
	}

	// =================================================
	// RESPONSE
	// =================================================

	c.JSON(
		http.StatusOK,
		gin.H{
			"success": true,

			"data": gin.H{

				// =====================================
				// IDENTIFIER
				// =====================================

				"id":        sellerID,
				"seller_id": sellerID,

				// =====================================
				// PROFILE
				// =====================================

				"store_name":  namaWarteg,
				"owner":       namaPemilik,
				"phone":       nomorHP,
				"address":     alamat,
				"description": deskripsi,

				// =====================================
				// OPERATING HOURS
				// =====================================

				"opening_time": jamBuka,
				"closing_time": jamTutup,

				// Backward compatibility
				"jam_buka":  jamBuka,
				"jam_tutup": jamTutup,

				// =====================================
				// OPEN STATUS
				// =====================================

				"is_open": isOpen,

				// =====================================
				// CUSTOMER META
				// =====================================

				"rating":      0,
				"distance_km": 0,
				"total_menu":  0,

				// =====================================
				// IMAGE
				// =====================================

				"image": "",
			},
		},
	)
}

// =====================================================
// CHECK SELLER OPEN
//
// SUPPORT:
//
// 07:00 - 23:00
// 18:00 - 02:00
//
// JAM SAMA = TUTUP
// =====================================================

func isSellerOpen(
	openingTime string,
	closingTime string,
) bool {

	openMinutes, openOK := parseTimeToMinutes(
		openingTime,
	)

	closeMinutes, closeOK := parseTimeToMinutes(
		closingTime,
	)

	// =================================================
	// INVALID
	// =================================================

	if !openOK || !closeOK {
		return false
	}

	// =================================================
	// TIMEZONE ASIA/JAKARTA
	// =================================================

	loc, err := time.LoadLocation(
		"Asia/Jakarta",
	)

	if err != nil {
		loc = time.FixedZone(
			"WIB",
			7*60*60,
		)
	}

	now := time.Now().In(loc)

	currentMinutes :=
		now.Hour()*60 +
			now.Minute()

	// =================================================
	// JAM SAMA = TUTUP
	// =================================================

	if openMinutes == closeMinutes {
		return false
	}

	// =================================================
	// NORMAL
	//
	// 07:00 - 23:00
	// =================================================

	if openMinutes < closeMinutes {
		return currentMinutes >= openMinutes &&
			currentMinutes < closeMinutes
	}

	// =================================================
	// OVERNIGHT
	//
	// 18:00 - 02:00
	// =================================================

	return currentMinutes >= openMinutes ||
		currentMinutes < closeMinutes
}

// =====================================================
// NORMALIZE TIME
//
// SUPPORT:
//
// 08:00
// 08:00:00
// " 08:00 "
//
// OUTPUT:
//
// 08:00
// =====================================================

func normalizeTime(
	value string,
) string {

	value = strings.TrimSpace(
		value,
	)

	if value == "" {
		return ""
	}

	// =================================================
	// HH:MM
	// =================================================

	parsed, err := time.Parse(
		"15:04",
		value,
	)

	if err == nil {
		return parsed.Format("15:04")
	}

	// =================================================
	// HH:MM:SS
	// =================================================

	parsed, err = time.Parse(
		"15:04:05",
		value,
	)

	if err == nil {
		return parsed.Format("15:04")
	}

	return ""
}

// =====================================================
// PARSE TIME TO MINUTES
//
// IMPORTANT:
//
// Fungsi ini SATU-SATUNYA di package controllers.
//
// 08:00     -> 480, true
// 08:30     -> 510, true
// 08:00:00  -> 480, true
// kosong    -> 0, false
// invalid   -> 0, false
// =====================================================

func parseTimeToMinutes(
	value string,
) (int, bool) {

	value = strings.TrimSpace(
		value,
	)

	if value == "" {
		return 0, false
	}

	// =================================================
	// HH:MM
	// =================================================

	parsed, err := time.Parse(
		"15:04",
		value,
	)

	if err == nil {
		minutes := parsed.Hour()*60 + parsed.Minute()

		return minutes, true
	}

	// =================================================
	// HH:MM:SS
	// =================================================

	parsed, err = time.Parse(
		"15:04:05",
		value,
	)

	if err == nil {
		minutes := parsed.Hour()*60 + parsed.Minute()

		return minutes, true
	}

	// =================================================
	// INVALID
	// =================================================

	return 0, false
}
