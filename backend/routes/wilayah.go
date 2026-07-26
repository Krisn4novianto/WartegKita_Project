package routes

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/krisn4novianto/wartegkita/backend/database"
)

// ========================================
// REGISTER WILAYAH ROUTES
// ========================================

func CreateWilayahRoutes(api *gin.RouterGroup) {

	wilayah := api.Group("/wilayah")

	wilayah.GET("/provinces", getProvinces)
	wilayah.GET("/cities/:provinceId", getCities)
	wilayah.GET("/districts/:cityId", getDistricts)
}

// ========================================
// GET PROVINCES
// ========================================

func getProvinces(c *gin.Context) {

	data, err := database.GetProvinces()
	if err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})

		return
	}

	c.JSON(http.StatusOK, data)
}

// ========================================
// GET CITIES
// ========================================

func getCities(c *gin.Context) {

	provinceID, err := strconv.Atoi(c.Param("provinceId"))
	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid province id",
		})

		return
	}

	data, err := database.GetCities(provinceID)
	if err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})

		return
	}

	c.JSON(http.StatusOK, data)
}

// ========================================
// GET DISTRICTS
// ========================================

func getDistricts(c *gin.Context) {

	cityID, err := strconv.Atoi(c.Param("cityId"))
	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid city id",
		})

		return
	}

	data, err := database.GetDistricts(cityID)
	if err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})

		return
	}

	c.JSON(http.StatusOK, data)
}
