package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/models"
)

// createAddress is handled by saveAddress in user_routes.go
func createAddress(c *gin.Context) {

	var address models.UserAddress

	if err := c.ShouldBindJSON(&address); err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"error": err.Error(),
			},
		)

		return
	}

	err := database.CreateAddress(address)

	if err != nil {

		c.JSON(
			500,
			gin.H{
				"error": err.Error(),
			},
		)

		return
	}

	c.JSON(
		201,
		gin.H{

			"message": "Alamat berhasil disimpan",

			"data": address,
		},
	)

}
