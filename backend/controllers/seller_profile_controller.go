package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/krisn4novianto/wartegkita/backend/database/seller"
)

// =====================================
// GET SELLER PROFILE
// =====================================

func GetSellerProfile(c *gin.Context) {

	sellerID := c.Param("seller_id")

	profile, err := seller.GetProfile(sellerID)

	if err != nil {

		c.JSON(
			http.StatusOK,
			gin.H{},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		profile,
	)

}

// =====================================
// UPDATE / SAVE SELLER PROFILE
// =====================================

func UpdateSellerProfile(c *gin.Context) {

	sellerID := c.Param("seller_id")

	var profile seller.SellerProfile

	// Ambil JSON dari frontend
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

	// Simpan ke database
	err := seller.SaveProfile(
		sellerID,
		profile,
	)

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal menyimpan data",
				"error":   err.Error(),
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"success": true,
			"message": "Profile usaha berhasil disimpan",
		},
	)

}
