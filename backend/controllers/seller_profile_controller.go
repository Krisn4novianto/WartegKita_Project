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
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Seller ID tidak boleh kosong",
		})
		return
	}

	profile, err := sellerdb.GetProfile(
		sellerID,
	)

	if err != nil {

		// Profile belum ada.
		// Tetap return 200 supaya frontend
		// bisa membuka form profile baru.

		c.JSON(http.StatusOK, gin.H{
			"success": true,

			"data": gin.H{
				"id":        "",
				"seller_id": sellerID,

				"nama_warteg":  "",
				"nama_pemilik": "",
				"nomor_hp":     "",

				"alamat":    "",
				"deskripsi": "",

				"jam_buka":     "",
				"jam_tutup":    "",
				"opening_time": "",
				"closing_time": "",

				"latitude":  0,
				"longitude": 0,

				"image": "",

				"bank":              "",
				"nomor_rekening":    "",
				"rekening_verified": false,
				"nama_rekening":     "",

				"created_at": "",
				"updated_at": "",
			},
		})

		return
	}

	// =================================================
	// NORMALIZE TIME
	// =================================================

	profile.JamBuka =
		normalizeTime(
			profile.JamBuka,
		)

	profile.JamTutup =
		normalizeTime(
			profile.JamTutup,
		)

	// =================================================
	// RESPONSE
	// =================================================

	c.JSON(http.StatusOK, gin.H{

		"success": true,

		"data": gin.H{

			"id": profile.ID,

			"seller_id": profile.SellerID,

			"nama_warteg": profile.NamaWarteg,

			"nama_pemilik": profile.NamaPemilik,

			"nomor_hp": profile.NomorHP,

			"alamat": profile.Alamat,

			"deskripsi": profile.Deskripsi,

			"jam_buka": profile.JamBuka,

			"jam_tutup": profile.JamTutup,

			"opening_time": profile.JamBuka,

			"closing_time": profile.JamTutup,

			"latitude": profile.Latitude,

			"longitude": profile.Longitude,

			"image": strings.TrimSpace(
				profile.Image,
			),

			"bank": profile.Bank,

			"nomor_rekening": profile.NomorRekening,

			"rekening_verified": profile.RekeningVerified,

			"nama_rekening": profile.NamaRekening,

			"created_at": profile.CreatedAt,

			"updated_at": profile.UpdatedAt,
		},
	})
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

		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Seller ID tidak boleh kosong",
		})

		return
	}

	// =================================================
	// REQUEST BODY
	// =================================================

	var profile sellerdb.SellerProfile

	if err := c.ShouldBindJSON(
		&profile,
	); err != nil {

		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Format data tidak valid",
			"error":   err.Error(),
		})

		return
	}

	// =================================================
	// SELLER ID DARI URL
	// =================================================

	profile.SellerID = sellerID

	// =================================================
	// NORMALIZE TEXT
	// =================================================

	profile.NamaWarteg =
		strings.TrimSpace(
			profile.NamaWarteg,
		)

	profile.NamaPemilik =
		strings.TrimSpace(
			profile.NamaPemilik,
		)

	profile.NomorHP =
		strings.TrimSpace(
			profile.NomorHP,
		)

	profile.Alamat =
		strings.TrimSpace(
			profile.Alamat,
		)

	profile.Deskripsi =
		strings.TrimSpace(
			profile.Deskripsi,
		)

	profile.Bank =
		strings.TrimSpace(
			profile.Bank,
		)

	profile.NomorRekening =
		strings.TrimSpace(
			profile.NomorRekening,
		)

	profile.NamaRekening =
		strings.TrimSpace(
			profile.NamaRekening,
		)

	profile.Image =
		strings.TrimSpace(
			profile.Image,
		)

	// =================================================
	// NORMALIZE TIME
	// =================================================

	profile.JamBuka =
		normalizeTime(
			profile.JamBuka,
		)

	profile.JamTutup =
		normalizeTime(
			profile.JamTutup,
		)

	// =================================================
	// VALIDASI NAMA WARTEG
	// =================================================

	if profile.NamaWarteg == "" {

		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Nama warteg wajib diisi",
		})

		return
	}

	// =================================================
	// VALIDASI ALAMAT
	// =================================================

	if profile.Alamat == "" {

		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Alamat warteg wajib diisi",
		})

		return
	}

	// =================================================
	// VALIDASI JAM BUKA
	// =================================================

	if profile.JamBuka == "" {

		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Jam buka wajib diisi dengan format HH:mm",
		})

		return
	}

	// =================================================
	// VALIDASI JAM TUTUP
	// =================================================

	if profile.JamTutup == "" {

		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Jam tutup wajib diisi dengan format HH:mm",
		})

		return
	}

	// =================================================
	// PARSE JAM BUKA
	// =================================================

	openMinutes,
		openOK :=
		parseTimeToMinutes(
			profile.JamBuka,
		)

	if !openOK {

		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Format jam buka tidak valid. Gunakan HH:mm",
		})

		return
	}

	// =================================================
	// PARSE JAM TUTUP
	// =================================================

	closeMinutes,
		closeOK :=
		parseTimeToMinutes(
			profile.JamTutup,
		)

	if !closeOK {

		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Format jam tutup tidak valid. Gunakan HH:mm",
		})

		return
	}

	// =================================================
	// JAM SAMA
	// =================================================

	if openMinutes == closeMinutes {

		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Jam buka dan jam tutup tidak boleh sama",
		})

		return
	}

	// =================================================
	// SAVE PROFILE
	// =================================================

	err := sellerdb.SaveProfile(
		sellerID,
		profile,
	)

	if err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Gagal menyimpan data profil",
			"error":   err.Error(),
		})

		return
	}

	// =================================================
	// GET DATA TERBARU
	// =================================================

	savedProfile,
		err :=
		sellerdb.GetProfile(
			sellerID,
		)

	if err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Profil berhasil disimpan tetapi gagal mengambil data terbaru",
			"error":   err.Error(),
		})

		return
	}

	// =================================================
	// NORMALIZE HASIL
	// =================================================

	savedProfile.JamBuka =
		normalizeTime(
			savedProfile.JamBuka,
		)

	savedProfile.JamTutup =
		normalizeTime(
			savedProfile.JamTutup,
		)

	// =================================================
	// SUCCESS
	// =================================================

	c.JSON(http.StatusOK, gin.H{

		"success": true,

		"message": "Profile usaha berhasil disimpan",

		"data": savedProfile,
	})
}

// =====================================================
// VERIFY SELLER BANK
//
// POST /api/v1/sellers/:seller_id/verify-bank
// =====================================================

func VerifySellerBank(c *gin.Context) {

	sellerID := strings.TrimSpace(
		c.Param("seller_id"),
	)

	if sellerID == "" {

		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Seller ID tidak boleh kosong",
		})

		return
	}

	// =================================================
	// REQUEST BODY
	// =================================================

	var request struct {
		Bank string `json:"bank"`

		NomorRekening string `json:"nomor_rekening"`
	}

	if err := c.ShouldBindJSON(
		&request,
	); err != nil {

		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Format data tidak valid",
			"error":   err.Error(),
		})

		return
	}

	// =================================================
	// NORMALIZE
	// =================================================

	bank := strings.TrimSpace(
		request.Bank,
	)

	nomorRekening :=
		strings.TrimSpace(
			request.NomorRekening,
		)

	// =================================================
	// VALIDASI BANK
	// =================================================

	if bank == "" {

		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Bank wajib dipilih",
		})

		return
	}

	// =================================================
	// NORMALIZE NOMOR REKENING
	// =================================================

	nomorRekening =
		strings.Map(
			func(r rune) rune {

				if r >= '0' &&
					r <= '9' {

					return r
				}

				return -1
			},
			nomorRekening,
		)

	// =================================================
	// VALIDASI NOMOR REKENING
	// =================================================

	if nomorRekening == "" {

		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Nomor rekening wajib diisi",
		})

		return
	}

	if len(nomorRekening) < 5 {

		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Nomor rekening tidak valid",
		})

		return
	}

	// =================================================
	// GET PROFILE
	// =================================================

	profile,
		err :=
		sellerdb.GetProfile(
			sellerID,
		)

	if err != nil {

		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Profil seller tidak ditemukan",
		})

		return
	}

	// =================================================
	// UPDATE REKENING
	// =================================================

	profile.SellerID =
		sellerID

	profile.Bank =
		bank

	profile.NomorRekening =
		nomorRekening

	/*
	 * Untuk sementara proses verifikasi
	 * dilakukan berdasarkan validasi input.
	 *
	 * Nantinya bagian ini dapat diganti
	 * dengan integrasi API bank/payment gateway.
	 */

	profile.RekeningVerified =
		true

	// =================================================
	// NAMA REKENING
	// =================================================
	//
	// Kalau belum ada nama rekening dari
	// provider bank, gunakan nama pemilik
	// sebagai fallback.
	//

	if strings.TrimSpace(
		profile.NamaRekening,
	) == "" {

		profile.NamaRekening =
			profile.NamaPemilik
	}

	// =================================================
	// SAVE PROFILE
	// =================================================

	err =
		sellerdb.SaveProfile(
			sellerID,
			profile,
		)

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal menyimpan rekening",
				"error":   err.Error(),
			},
		)

		return
	}

	// =================================================
	// GET DATA TERBARU
	// =================================================

	savedProfile,
		err :=
		sellerdb.GetProfile(
			sellerID,
		)

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Rekening berhasil disimpan tetapi data terbaru gagal diambil",
				"error":   err.Error(),
			},
		)

		return
	}

	// =================================================
	// SUCCESS
	// =================================================

	c.JSON(
		http.StatusOK,
		gin.H{

			"success": true,

			"message": "Rekening berhasil diverifikasi",

			"data": gin.H{

				"seller_id": sellerID,

				"bank": savedProfile.Bank,

				"nomor_rekening": savedProfile.NomorRekening,

				"rekening_verified": savedProfile.RekeningVerified,

				"nama_rekening": savedProfile.NamaRekening,
			},
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

		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Seller ID tidak boleh kosong",
		})

		return
	}

	// =================================================
	// GET PROFILE
	// =================================================

	profile,
		err :=
		sellerdb.GetProfile(
			sellerID,
		)

	if err != nil {

		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Profil warteg tidak ditemukan",
		})

		return
	}

	// =================================================
	// NORMALIZE
	// =================================================

	namaWarteg :=
		strings.TrimSpace(
			profile.NamaWarteg,
		)

	namaPemilik :=
		strings.TrimSpace(
			profile.NamaPemilik,
		)

	nomorHP :=
		strings.TrimSpace(
			profile.NomorHP,
		)

	alamat :=
		strings.TrimSpace(
			profile.Alamat,
		)

	deskripsi :=
		strings.TrimSpace(
			profile.Deskripsi,
		)

	jamBuka :=
		normalizeTime(
			profile.JamBuka,
		)

	jamTutup :=
		normalizeTime(
			profile.JamTutup,
		)

	// =================================================
	// OPEN STATUS
	// =================================================

	isOpen := false

	if jamBuka != "" &&
		jamTutup != "" {

		isOpen =
			isSellerOpen(
				jamBuka,
				jamTutup,
			)
	}

	// =================================================
	// RESPONSE
	// =================================================

	c.JSON(http.StatusOK, gin.H{

		"success": true,

		"data": gin.H{

			"id": sellerID,

			"seller_id": sellerID,

			"store_name": namaWarteg,

			"owner": namaPemilik,

			"phone": nomorHP,

			"address": alamat,

			"description": deskripsi,

			"image": strings.TrimSpace(
				profile.Image,
			),

			"latitude": profile.Latitude,

			"longitude": profile.Longitude,

			"opening_time": jamBuka,

			"closing_time": jamTutup,

			"jam_buka": jamBuka,

			"jam_tutup": jamTutup,

			"is_open": isOpen,

			"rating": 0,

			"distance_km": 0,

			"total_menu": 0,
		},
	})
}

// =====================================================
// SELLER OPEN STATUS
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

	openMinutes,
		openOK :=
		parseTimeToMinutes(
			openingTime,
		)

	closeMinutes,
		closeOK :=
		parseTimeToMinutes(
			closingTime,
		)

	if !openOK ||
		!closeOK {

		return false
	}

	if openMinutes ==
		closeMinutes {

		return false
	}

	// =================================================
	// ASIA/JAKARTA
	// =================================================

	loc,
		err :=
		time.LoadLocation(
			"Asia/Jakarta",
		)

	if err != nil {

		loc =
			time.FixedZone(
				"WIB",
				7*60*60,
			)
	}

	now :=
		time.Now().In(loc)

	currentMinutes :=
		now.Hour()*60 +
			now.Minute()

	// =================================================
	// NORMAL
	//
	// 07:00 - 23:00
	// =================================================

	if openMinutes <
		closeMinutes {

		return currentMinutes >=
			openMinutes &&
			currentMinutes <
				closeMinutes
	}

	// =================================================
	// OVERNIGHT
	//
	// 18:00 - 02:00
	// =================================================

	return currentMinutes >=
		openMinutes ||
		currentMinutes <
			closeMinutes
}

// =====================================================
// NORMALIZE TIME
//
// SUPPORT:
//
// 08:00
// 08:00:00
//
// OUTPUT:
//
// 08:00
// =====================================================

func normalizeTime(
	value string,
) string {

	value =
		strings.TrimSpace(
			value,
		)

	if value == "" {
		return ""
	}

	// =================================================
	// HH:MM
	// =================================================

	parsed,
		err :=
		time.Parse(
			"15:04",
			value,
		)

	if err == nil {

		return parsed.Format(
			"15:04",
		)
	}

	// =================================================
	// HH:MM:SS
	// =================================================

	parsed,
		err =
		time.Parse(
			"15:04:05",
			value,
		)

	if err == nil {

		return parsed.Format(
			"15:04",
		)
	}

	return ""
}

// =====================================================
// PARSE TIME TO MINUTES
//
// 08:00 -> 480, true
// 08:30 -> 510, true
// kosong -> 0, false
// invalid -> 0, false
// =====================================================

func parseTimeToMinutes(
	value string,
) (int, bool) {

	value =
		strings.TrimSpace(
			value,
		)

	if value == "" {
		return 0, false
	}

	// =================================================
	// HH:MM
	// =================================================

	parsed,
		err :=
		time.Parse(
			"15:04",
			value,
		)

	if err == nil {

		minutes :=
			parsed.Hour()*60 +
				parsed.Minute()

		return minutes, true
	}

	// =================================================
	// HH:MM:SS
	// =================================================

	parsed,
		err =
		time.Parse(
			"15:04:05",
			value,
		)

	if err == nil {

		minutes :=
			parsed.Hour()*60 +
				parsed.Minute()

		return minutes, true
	}

	return 0, false
}
