package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/krisn4novianto/wartegkita/backend/database"
	sellerDB "github.com/krisn4novianto/wartegkita/backend/database/seller"
)

// =====================================================
// SELLER DASHBOARD
// =====================================================

// SellerDashboard godoc
//
//	@Summary		Seller Dashboard
//	@Description	Returns seller dashboard analytics
//	@Tags			Sellers
//	@Produce		json
//	@Param			seller_id	path		string	true	"Seller ID (UUID)"
//	@Param			start_date	query		string	false	"Start Date (YYYY-MM-DD)"
//	@Param			end_date	query		string	false	"End Date (YYYY-MM-DD)"
//	@Param			search		query		string	false	"Search customer/menu/order"
//	@Success		200			{object}	seller.DashboardAnalytics
//	@Failure		400			{object}	map[string]string
//	@Failure		500			{object}	map[string]string
//	@Router			/sellers/dashboard/{seller_id} [get]
func SellerDashboard(c *gin.Context) {

	sellerID := c.Param("seller_id")

	if sellerID == "" {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "seller_id tidak valid",
			},
		)

		return
	}

	filter := sellerDB.DashboardFilter{
		StartDate: c.Query("start_date"),
		EndDate:   c.Query("end_date"),
	}

	search := c.Query("search")

	result, err := sellerDB.GetDashboardAnalytics(
		database.DB,
		sellerID,
		filter,
		search,
	)

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": err.Error(),
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"success": true,
			"data":    result,
		},
	)
}
