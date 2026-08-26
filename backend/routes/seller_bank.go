package routes

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	sellerdb "github.com/krisn4novianto/wartegkita/backend/database/seller"
)

// =====================================================
// VERIFY SELLER BANK
//
// PUT /api/v1/sellers/:seller_id/bank/verify
// =====================================================
//
// Flow:
//
// JWT middleware
//      ↓
// user_id dari authentication context
//      ↓
// seller_id dari URL
//      ↓
// cek ownership seller
//      ↓
// update data rekening
//      ↓
// SaveProfile(sellerID, profile)
//
// =====================================================

func verifySellerBank(c *gin.Context) {

	// =================================================
	// SELLER ID
	// =================================================

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
	// USER ID DARI AUTHENTICATION CONTEXT
	// =================================================
	//
	// user_id harus berasal dari JWT middleware.
	//
	// Jangan mengambil user_id dari request body.
	//
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

	var request struct {
		Bank          string `json:"bank"`
		NomorRekening string `json:"nomor_rekening"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Format data rekening tidak valid",
				"error":   err.Error(),
			},
		)
		return
	}

	// =================================================
	// NORMALIZE REQUEST
	// =================================================

	request.Bank = strings.TrimSpace(
		request.Bank,
	)

	request.NomorRekening = strings.TrimSpace(
		request.NomorRekening,
	)

	// =================================================
	// VALIDATION BANK
	// =================================================

	if request.Bank == "" {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Bank wajib dipilih",
			},
		)
		return
	}

	// =================================================
	// VALIDATION NOMOR REKENING
	// =================================================

	if request.NomorRekening == "" {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Nomor rekening wajib diisi",
			},
		)
		return
	}

	// =================================================
	// GET EXISTING PROFILE
	// =================================================

	profile, err := sellerdb.GetProfile(
		sellerID,
	)

	// =================================================
	// PROFILE BELUM ADA
	// =================================================
	//
	// Tidak menggunakan EnsureProfile().
	//
	// Kita buat object profile baru di memory.
	// SaveProfile() akan melakukan INSERT jika
	// profile belum ada di database.
	//
	// =================================================

	if err != nil {
		profile = sellerdb.SellerProfile{
			SellerID: sellerID,
			UserID:   userID,
		}
	}

	// =================================================
	// SECURITY / OWNERSHIP
	// =================================================
	//
	// Jika profile sudah memiliki UserID, pastikan
	// user yang login memang pemilik profile tersebut.
	//
	// =================================================

	profileUserID := strings.TrimSpace(
		profile.UserID,
	)

	if profileUserID != "" &&
		profileUserID != userID {

		c.JSON(
			http.StatusForbidden,
			gin.H{
				"success": false,
				"message": "Anda tidak memiliki akses ke seller ini",
			},
		)
		return
	}

	// =================================================
	// FORCE OWNERSHIP
	// =================================================
	//
	// SellerID berasal dari URL.
	// UserID berasal dari authentication context.
	//
	// Jangan percaya kedua nilai tersebut dari body.
	//
	// =================================================

	profile.SellerID = sellerID
	profile.UserID = userID

	// =================================================
	// UPDATE BANK
	// =================================================

	profile.Bank = request.Bank

	profile.NomorRekening = request.NomorRekening

	// =================================================
	// VERIFICATION
	// =================================================
	//
	// Sementara sistem menganggap rekening valid
	// setelah data berhasil disimpan.
	//
	// Nantinya bisa diganti dengan API verifikasi
	// rekening bank sungguhan.
	//
	// =================================================

	profile.RekeningVerified = true

	// =================================================
	// NAMA REKENING
	// =================================================
	//
	// Jika nama rekening belum tersedia, gunakan
	// nama pemilik seller sebagai fallback.
	//
	// =================================================

	if strings.TrimSpace(
		profile.NamaRekening,
	) == "" {

		profile.NamaRekening = strings.TrimSpace(
			profile.NamaPemilik,
		)
	}

	// =================================================
	// SAVE PROFILE
	// =================================================
	//
	// Repository:
	//
	// SaveProfile(sellerID, profile)
	//
	// BUKAN:
	//
	// SaveProfile(sellerID, userID, profile)
	//
	// =================================================

	if err := sellerdb.SaveProfile(
		sellerID,
		profile,
	); err != nil {

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

	savedProfile, err := sellerdb.GetProfile(
		sellerID,
	)

	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Rekening berhasil disimpan tetapi gagal mengambil data terbaru",
				"error":   err.Error(),
			},
		)
		return
	}

	// =================================================
	// RESPONSE
	// =================================================

	c.JSON(
		http.StatusOK,
		gin.H{
			"success": true,
			"message": "Rekening berhasil diverifikasi",

			"data": gin.H{
				"bank": savedProfile.Bank,

				"nomor_rekening": savedProfile.NomorRekening,

				"rekening_verified": savedProfile.RekeningVerified,

				"nama_rekening": savedProfile.NamaRekening,
			},
		},
	)
}
