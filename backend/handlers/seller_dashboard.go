package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	sellerdb "WartegKita/backend/database/seller"
)

type SellerDashboardHandler struct {
	DB *gorm.DB
}

/* =====================================================
   GET DASHBOARD
===================================================== */

func (h *SellerDashboardHandler) GetDashboard(
	c *gin.Context,
) {

	sellerID := c.Param("seller_id")

	if sellerID == "" {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "seller_id wajib diisi",
			},
		)

		return
	}

	filter := sellerdb.DashboardFilter{

		StartDate: c.Query("start_date"),

		EndDate: c.Query("end_date"),
	}

	search := c.Query("search")

	data, err := sellerdb.GetDashboardAnalytics(
		h.DB,
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

	/*
		=====================================================
		   RESPONSE BARU
		=====================================================
	*/

	c.JSON(
		http.StatusOK,
		gin.H{
			"success": true,
			"data":    data,
		},
	)
}
