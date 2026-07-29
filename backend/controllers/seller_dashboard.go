package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	sellerDB "github.com/krisn4novianto/wartegkita/backend/database/seller"
)

// SellerDashboard godoc
// @Summary      Seller Dashboard
// @Description  Returns revenue and transaction summary for a seller
// @Tags         Sellers
// @Produce      json
// @Param        seller_id path string true "Seller ID (UUID)"
// @Success      200 {object} models.SellerDashboard
// @Failure      400 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /sellers/dashboard/{seller_id} [get]
func SellerDashboard(c *gin.Context) {

	sellerID := c.Param("seller_id")

	if sellerID == "" {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"error": "seller id tidak valid",
			},
		)

		return
	}

	result, err := sellerDB.GetPendapatanDashboard(
		nil,
		sellerID,
	)


	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"error": err.Error(),
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		result,
	)

}
