package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/krisn4novianto/wartegkita/backend/database"

	sellerDB "github.com/krisn4novianto/wartegkita/backend/database/seller"
)

func SellerDashboard(c *gin.Context) {

	sellerID, err := strconv.Atoi(
		c.Param("seller_id"),
	)

	if err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"error": "seller id tidak valid",
			},
		)

		return
	}

	result, err := sellerDB.GetPendapatanDashboard(
		database.SellerDB,
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
