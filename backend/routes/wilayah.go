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

// getProvinces godoc
// @Summary      Get All Provinces
// @Description  Returns a list of all Indonesian provinces
// @Tags         Wilayah
// @Produce      json
// @Success      200 {array}  database.Wilayah
// @Failure      500 {object} map[string]string
// @Router       /wilayah/provinces [get]
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

// getCities godoc
// @Summary      Get Cities by Province
// @Description  Returns all cities/regencies within a given province
// @Tags         Wilayah
// @Produce      json
// @Param        provinceId path int true "Province ID"
// @Success      200 {array}  database.Wilayah
// @Failure      400 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /wilayah/cities/{provinceId} [get]
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

// getDistricts godoc
// @Summary      Get Districts by City
// @Description  Returns all districts (kecamatan) within a given city
// @Tags         Wilayah
// @Produce      json
// @Param        cityId path int true "City ID"
// @Success      200 {array}  database.Wilayah
// @Failure      400 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /wilayah/districts/{cityId} [get]
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
