package routes

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/models"
)

// =====================================
// USER ROUTES
// =====================================

func CreateUserRoutes(api *gin.RouterGroup) {

	users := api.Group("/users")

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

// =====================================
// GET PROFILE
// =====================================

func getUserProfile(c *gin.Context) {

	userID := c.Query("user_id")

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
				"error": err.Error(),
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

// =====================================
// UPDATE PROFILE
// =====================================

func updateUserProfile(c *gin.Context) {

	var body struct {
		UserID int `json:"user_id"`

		Name string `json:"name"`

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
		body.UserID,
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

// =====================================
// GET ADDRESS
// =====================================

func getUserAddress(c *gin.Context) {

	userID := c.Query("user_id")

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
			note

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

// =====================================
// SAVE ADDRESS
// =====================================

func saveAddress(c *gin.Context) {

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
