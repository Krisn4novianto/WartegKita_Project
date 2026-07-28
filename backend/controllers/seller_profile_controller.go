package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/krisn4novianto/wartegkita/backend/database/seller"
)

// GetSellerProfile godoc
// @Summary      Get Seller Profile
// @Description  Returns the internal profile data of a seller (nama warteg, pemilik, bank, dll)
// @Tags         Sellers
// @Produce      json
// @Param        seller_id path int true "Seller ID"
// @Success      200 {object} seller.SellerProfile
// @Router       /sellers/{seller_id}/profile [get]
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

// UpdateSellerProfile godoc
// @Summary      Update Seller Profile
// @Description  Create or update the seller's internal profile (upsert by seller_id)
// @Tags         Sellers
// @Accept       json
// @Produce      json
// @Param        seller_id path int                  true "Seller ID"
// @Param        body      body seller.SellerProfile true "Seller profile payload"
// @Success      200 {object} map[string]interface{}
// @Failure      400 {object} map[string]interface{}
// @Failure      500 {object} map[string]interface{}
// @Router       /sellers/{seller_id}/profile [put]
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
