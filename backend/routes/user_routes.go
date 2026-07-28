package routes

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/middleware"
	"github.com/krisn4novianto/wartegkita/backend/models"
)

// RegisterUserRoutes registers all user-related endpoints.
func RegisterUserRoutes(api *gin.RouterGroup) {

	users := api.Group("/users")

	// Protected routes: STRICT JWT Authentication Middleware
	users.Use(middleware.AuthMiddleware())

	// PROFILE

	users.GET(
		"/profile",
		getUserProfile,
	)

	users.PUT(
		"/profile",
		updateUserProfile,
	)

	// ADDRESS

	users.GET(
		"/address",
		getUserAddress,
	)

	users.POST(
		"/address",
		saveAddress,
	)

}

// getUserProfile godoc
// @Summary      Get User Profile
// @Description  Retrieve user profile for the authenticated user (requires Bearer JWT token)
// @Tags         Users
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} map[string]interface{}
// @Failure      401 {object} map[string]string
// @Failure      404 {object} map[string]string
// @Router       /users/profile [get]
func getUserProfile(c *gin.Context) {

	// STRICT: Only get userID from authenticated JWT token context
	userID := c.GetString("user_id")

	if userID == "" {
		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"error": "User tidak terotentikasi",
			},
		)
		return
	}

	var user models.User

	err := database.DB.QueryRow(
		`
		SELECT
			id,
			name,
			email
		FROM users
		WHERE id=$1
		`,
		userID,
	).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
	)

	if err != nil {

		c.JSON(
			http.StatusNotFound,
			gin.H{
				"error": "User tidak ditemukan",
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"data": user,
		},
	)

}

// updateUserProfile godoc
// @Summary      Update User Profile
// @Description  Update user's name and email (requires Bearer JWT token)
// @Tags         Users
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body routes.UpdateProfileBody true "Profile update payload"
// @Success      200 {object} map[string]string
// @Failure      401 {object} map[string]string
// @Failure      400 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /users/profile [put]
func updateUserProfile(c *gin.Context) {

	// STRICT: Get userID from JWT context
	userID := c.GetString("user_id")

	if userID == "" {
		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"error": "User tidak terotentikasi",
			},
		)
		return
	}

	var body struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"error": err.Error(),
			},
		)

		return
	}

	_, err := database.DB.Exec(
		`
		UPDATE users

		SET
			name=$1,
			email=$2

		WHERE id=$3
		`,
		body.Name,
		body.Email,
		userID,
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
		gin.H{
			"message": "profile updated",
		},
	)

}

// getUserAddress godoc
// @Summary      Get User Address
// @Description  Retrieve saved delivery address for the authenticated user (requires Bearer JWT token)
// @Tags         Users
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} map[string]interface{}
// @Failure      401 {object} map[string]string
// @Router       /users/address [get]
func getUserAddress(c *gin.Context) {

	// STRICT: Get userID from JWT context
	userID := c.GetString("user_id")

	if userID == "" {
		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"error": "User tidak terotentikasi",
			},
		)
		return
	}

	var address models.UserAddress

	err := database.DB.QueryRow(
		`
		SELECT

			id,
			user_id,
			label,
			detail,

			province_id,
			province_name,

			city_id,
			city_name,

			district_id,
			district_name,

			postal_code,
			note,
			latitude,
			longitude

		FROM user_addresses

		WHERE user_id=$1

		`,
		userID,
	).Scan(

		&address.ID,
		&address.UserID,
		&address.Label,
		&address.Detail,

		&address.ProvinceID,
		&address.ProvinceName,

		&address.CityID,
		&address.CityName,

		&address.DistrictID,
		&address.DistrictName,

		&address.PostalCode,
		&address.Note,
		&address.Latitude,
		&address.Longitude,
	)

	if err != nil {

		c.JSON(
			http.StatusOK,
			gin.H{
				"data": nil,
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"data": address,
		},
	)

}

// saveAddress godoc
// @Summary      Save User Address
// @Description  Create or update delivery address for the authenticated user (requires Bearer JWT token)
// @Tags         Users
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        address body models.UserAddress true "User address payload"
// @Success      201 {object} map[string]interface{}
// @Failure      401 {object} map[string]string
// @Failure      400 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /users/address [post]
func saveAddress(c *gin.Context) {

	// STRICT: Get userID from JWT context
	userID := c.GetString("user_id")

	if userID == "" {
		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"error": "User tidak terotentikasi",
			},
		)
		return
	}

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

	// Override userID with authenticated JWT user ID
	address.UserID = userID

	err := database.CreateAddress(address)

	if err != nil {

		log.Println(
			"CreateAddress:",
			err,
		)

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"error": err.Error(),
			},
		)

		return

	}

	c.JSON(
		http.StatusCreated,
		gin.H{

			"message": "address saved",

			"data": address,
		},
	)

}

// UpdateProfileBody is used for swagger docs only
type UpdateProfileBody struct {
	Name  string `json:"name"  example:"Budi Santoso"`
	Email string `json:"email" example:"budi@example.com"`
}
