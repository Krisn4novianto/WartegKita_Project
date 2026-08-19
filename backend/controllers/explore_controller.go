package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/krisn4novianto/wartegkita/backend/services"
)

/* =====================================================
   GET POPULAR SELLERS
===================================================== */

func GetPopularSellers(c *gin.Context) {

	sellers, err :=
		services.GetPopularSellers()

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal mengambil data warteg populer",
				"error":   err.Error(),
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"success": true,
			"data":    sellers,
		},
	)
}
