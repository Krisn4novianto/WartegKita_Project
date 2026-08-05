package controllers

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/models"
)

// =====================================================
// GET ALL SELLERS
// =====================================================
//
// Endpoint:
//
// GET /api/v1/sellers
//
// Dipakai oleh:
//
// Customer Explore / Home
//
// =====================================================

func GetSellers(c *gin.Context) {

	var sellers []models.SellerProfile

	// =================================================
	// VALIDASI DATABASE
	// =================================================

	if database.DB == nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Database belum terhubung",
			},
		)

		return
	}

	// =================================================
	// AMBIL SEMUA SELLER
	// =================================================

	if err := database.DB.
		Find(&sellers).
		Error; err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal mengambil data warteg",
				"error":   err.Error(),
			},
		)

		return
	}

	// =================================================
	// TIMEZONE INDONESIA
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

	currentTime :=
		now.Hour()*60 +
			now.Minute()

	// =================================================
	// RESULT
	// =================================================

	result := make(
		[]models.CustomerSeller,
		0,
		len(sellers),
	)

	// =================================================
	// LOOP SELLER
	// =================================================

	for _, seller := range sellers {

		// =================================================
		// NORMALIZE JAM
		// =================================================

		openingTime :=
			strings.TrimSpace(
				seller.JamBuka,
			)

		closingTime :=
			strings.TrimSpace(
				seller.JamTutup,
			)

		// =================================================
		// HITUNG STATUS BUKA
		// =================================================

		isOpen := false

		if openingTime != "" &&
			closingTime != "" {

			openMinutes,
				openOK :=
				parseSellerTimeToMinutes(
					openingTime,
				)

			closeMinutes,
				closeOK :=
				parseSellerTimeToMinutes(
					closingTime,
				)

			if openOK &&
				closeOK {

				// =========================================
				// JAM BUKA = JAM TUTUP
				//
				// Untuk halaman customer:
				// dianggap TUTUP.
				// =========================================

				if openMinutes == closeMinutes {

					isOpen = false

				} else if openMinutes < closeMinutes {

					// =====================================
					// NORMAL
					//
					// 08:00 - 21:00
					// =====================================

					isOpen =
						currentTime >= openMinutes &&
							currentTime < closeMinutes

				} else {

					// =====================================
					// OVERNIGHT
					//
					// 22:00 - 02:00
					// =====================================

					isOpen =
						currentTime >= openMinutes ||
							currentTime < closeMinutes
				}
			}
		}

		// =================================================
		// FORMAT JAM CUSTOMER
		// =================================================

		openingDisplay :=
			formatSellerTimeForCustomer(
				openingTime,
			)

		closingDisplay :=
			formatSellerTimeForCustomer(
				closingTime,
			)

		// =================================================
		// BUILD CUSTOMER SELLER
		// =================================================

		result = append(
			result,
			models.CustomerSeller{

				ID: seller.SellerID,

				StoreName: seller.NamaWarteg,

				Description: seller.Deskripsi,

				Address: seller.Alamat,

				Owner: seller.NamaPemilik,

				Phone: seller.NomorHP,

				OpeningTime: openingDisplay,

				ClosingTime: closingDisplay,

				IsOpen: isOpen,

				// =====================================
				// BELUM ADA SUMBER DATA
				// =====================================
				//
				// Jangan menggunakan data palsu.
				//

				Rating: 0,

				DistanceKM: 0,

				TotalMenu: 0,
			},
		)
	}

	// =================================================
	// RESPONSE
	// =================================================

	c.JSON(
		http.StatusOK,
		result,
	)
}

// =====================================================
// PARSE JAM SELLER -> MENIT
// =====================================================
//
// Fungsi ini sengaja menggunakan nama:
//
// parseSellerTimeToMinutes
//
// Karena package controllers sudah memiliki:
//
// parseTimeToMinutes
//
// di seller_profile_controller.go.
//
// Jadi tidak boleh menggunakan nama yang sama.
//
// Support:
//
// 08:00
// 08:00:00
// 13:30
// 13:30:00
//
// Return:
//
// minutes
// success
//
// =====================================================

func parseSellerTimeToMinutes(
	value string,
) (int, bool) {

	value = strings.TrimSpace(
		value,
	)

	if value == "" {
		return 0, false
	}

	// =================================================
	// HH:MM:SS
	// =================================================

	parsed, err :=
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

	// =================================================
	// HH:MM
	// =================================================

	parsed, err =
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
	// INVALID
	// =================================================

	return 0, false
}

// =====================================================
// FORMAT JAM CUSTOMER
// =====================================================
//
// Database bisa:
//
// 08:00
// 08:00:00
//
// Customer mendapatkan:
//
// 08:00
//
// =====================================================

func formatSellerTimeForCustomer(
	value string,
) string {

	value = strings.TrimSpace(
		value,
	)

	if value == "" {
		return ""
	}

	// =================================================
	// HH:MM:SS
	// =================================================

	parsed, err :=
		time.Parse(
			"15:04:05",
			value,
		)

	if err == nil {

		return parsed.Format(
			"15:04",
		)
	}

	// =================================================
	// HH:MM
	// =================================================

	parsed, err =
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
	// FORMAT LAIN
	// =================================================

	return value
}
