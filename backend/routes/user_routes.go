package routes

import (
	"errors"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/middleware"
	"github.com/krisn4novianto/wartegkita/backend/models"
)

// =====================================================
// REGISTER USER ROUTES
// =====================================================
//
// Semua endpoint user membutuhkan JWT.
//
// GET  /api/v1/users/profile
// PUT  /api/v1/users/profile
//
// GET  /api/v1/users/address
// POST /api/v1/users/address
//
// =====================================================

func RegisterUserRoutes(api *gin.RouterGroup) {

	users := api.Group("/users")

	// =================================================
	// AUTHENTICATION
	// =================================================

	users.Use(
		middleware.AuthMiddleware(),
	)

	// =================================================
	// PROFILE
	// =================================================

	users.GET(
		"/profile",
		getUserProfile,
	)

	users.PUT(
		"/profile",
		updateUserProfile,
	)

	// =================================================
	// ADDRESS
	// =================================================

	users.GET(
		"/address",
		getUserAddress,
	)

	users.POST(
		"/address",
		saveAddress,
	)
}

// =====================================================
// GET USER PROFILE
// =====================================================
//
// GET /api/v1/users/profile
//
// JWT:
// Authorization: Bearer <token>
//
// User ID diambil dari:
//
// c.GetString("user_id")
//
// =====================================================

func getUserProfile(c *gin.Context) {

	// =================================================
	// GET USER ID DARI JWT
	// =================================================

	userID := strings.TrimSpace(
		c.GetString("user_id"),
	)

	if userID == "" {

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"error":   "User tidak terotentikasi",
			},
		)

		return
	}

	// =================================================
	// GET USER
	// =================================================

	var user models.User

	err := database.DB.
		Where(
			"id = ?",
			userID,
		).
		First(&user).
		Error

	if err != nil {

		if errors.Is(
			err,
			gorm.ErrRecordNotFound,
		) {

			c.JSON(
				http.StatusNotFound,
				gin.H{
					"success": false,
					"error":   "User tidak ditemukan",
				},
			)

			return
		}

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"error":   "Gagal mengambil profile user",
				"detail":  err.Error(),
			},
		)

		return
	}

	// =================================================
	// RESPONSE
	// =================================================

	c.JSON(
		http.StatusOK,
		gin.H{
			"success": true,
			"data":    user,
		},
	)
}

// =====================================================
// UPDATE USER PROFILE
// =====================================================
//
// PUT /api/v1/users/profile
//
// Body:
//
// {
//   "name": "Krisna",
//   "email": "krisna@gmail.com"
// }
//
// RULE:
// 1 akun = 1 email
//
// Email tidak boleh digunakan oleh user lain.
//
// =====================================================

func updateUserProfile(c *gin.Context) {

	// =================================================
	// GET USER ID DARI JWT
	// =================================================

	userID := strings.TrimSpace(
		c.GetString("user_id"),
	)

	if userID == "" {

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"error":   "User tidak terotentikasi",
			},
		)

		return
	}

	// =================================================
	// REQUEST BODY
	// =================================================

	var body UpdateProfileBody

	if err := c.ShouldBindJSON(
		&body,
	); err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"error":   "Format data profile tidak valid",
				"detail":  err.Error(),
			},
		)

		return
	}

	// =================================================
	// NORMALIZE INPUT
	// =================================================

	body.Name = strings.TrimSpace(
		body.Name,
	)

	body.Email = strings.TrimSpace(
		body.Email,
	)

	// Email selalu disimpan lowercase.
	body.Email = strings.ToLower(
		body.Email,
	)

	// =================================================
	// VALIDATE NAME
	// =================================================

	if body.Name == "" {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"error":   "Nama tidak boleh kosong",
			},
		)

		return
	}

	// =================================================
	// VALIDATE EMAIL
	// =================================================

	if body.Email == "" {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"error":   "Email tidak boleh kosong",
			},
		)

		return
	}

	// =================================================
	// GET CURRENT USER
	// =================================================

	var currentUser models.User

	err := database.DB.
		Where(
			"id = ?",
			userID,
		).
		First(&currentUser).
		Error

	if err != nil {

		if errors.Is(
			err,
			gorm.ErrRecordNotFound,
		) {

			c.JSON(
				http.StatusNotFound,
				gin.H{
					"success": false,
					"error":   "User tidak ditemukan",
				},
			)

			return
		}

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"error":   "Gagal mengambil data user",
				"detail":  err.Error(),
			},
		)

		return
	}

	// =================================================
	// CEK EMAIL YANG SAMA DENGAN EMAIL SENDIRI
	// =================================================
	//
	// Kalau user mengirim email miliknya sendiri:
	//
	// krisna@gmail.com
	//
	// maka TIDAK boleh dianggap duplikat.
	//
	// =================================================

	currentEmail := strings.ToLower(
		strings.TrimSpace(
			currentUser.Email,
		),
	)

	// =================================================
	// CEK EMAIL USER LAIN
	// =================================================
	//
	// Cari email yang sama:
	//
	// LOWER(email) = LOWER(body.Email)
	//
	// tetapi ID harus bukan user saat ini:
	//
	// id <> userID
	//
	// =================================================

	if body.Email != currentEmail {

		var existingUser models.User

		err := database.DB.
			Where(
				"LOWER(email) = LOWER(?) AND id <> ?",
				body.Email,
				userID,
			).
			First(&existingUser).
			Error

		// =================================================
		// EMAIL DITEMUKAN
		// =================================================

		if err == nil {

			c.JSON(
				http.StatusConflict,
				gin.H{
					"success": false,
					"error":   "Email sudah digunakan oleh akun lain",
				},
			)

			return
		}

		// =================================================
		// ERROR BUKAN RECORD NOT FOUND
		// =================================================

		if !errors.Is(
			err,
			gorm.ErrRecordNotFound,
		) {

			c.JSON(
				http.StatusInternalServerError,
				gin.H{
					"success": false,
					"error":   "Gagal memeriksa ketersediaan email",
					"detail":  err.Error(),
				},
			)

			return
		}
	}

	// =================================================
	// UPDATE USER
	// =================================================

	result := database.DB.
		Model(&models.User{}).
		Where(
			"id = ?",
			userID,
		).
		Updates(
			map[string]interface{}{
				"name":  body.Name,
				"email": body.Email,
			},
		)

	// =================================================
	// HANDLE DATABASE ERROR
	// =================================================

	if result.Error != nil {

		errorMessage := strings.ToLower(
			result.Error.Error(),
		)

		// =================================================
		// UNIQUE EMAIL CONSTRAINT
		// =================================================
		//
		// Safety net.
		//
		// Walaupun sudah dicek sebelumnya,
		// database tetap menjadi sumber kebenaran terakhir.
		//
		// =================================================

		if strings.Contains(
			errorMessage,
			"idx_users_email",
		) ||
			strings.Contains(
				errorMessage,
				"duplicate key",
			) ||
			strings.Contains(
				errorMessage,
				"23505",
			) {

			c.JSON(
				http.StatusConflict,
				gin.H{
					"success": false,
					"error":   "Email sudah digunakan oleh akun lain",
				},
			)

			return
		}

		// =================================================
		// ERROR DATABASE LAIN
		// =================================================

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"error":   "Gagal memperbarui profile",
				"detail":  result.Error.Error(),
			},
		)

		return
	}

	// =================================================
	// GET USER TERBARU
	// =================================================
	//
	// Supaya response benar-benar berasal dari database.
	//
	// =================================================

	var updatedUser models.User

	err = database.DB.
		Where(
			"id = ?",
			userID,
		).
		First(&updatedUser).
		Error

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"error":   "Profile berhasil diperbarui tetapi gagal mengambil data terbaru",
				"detail":  err.Error(),
			},
		)

		return
	}

	// =================================================
	// SUCCESS
	// =================================================

	c.JSON(
		http.StatusOK,
		gin.H{
			"success": true,
			"message": "Profile berhasil diperbarui",
			"data":    updatedUser,
		},
	)
}

// =====================================================
// GET USER ADDRESS
// =====================================================
//
// GET /api/v1/users/address
//
// =====================================================

func getUserAddress(c *gin.Context) {

	// =================================================
	// USER ID
	// =================================================

	userID := strings.TrimSpace(
		c.GetString("user_id"),
	)

	if userID == "" {

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"error":   "User tidak terotentikasi",
			},
		)

		return
	}

	// =================================================
	// GET ADDRESS
	// =================================================

	var address models.UserAddress

	err := database.DB.
		Where(
			"user_id = ?",
			userID,
		).
		First(&address).
		Error

	// =================================================
	// ADDRESS BELUM ADA
	// =================================================

	if errors.Is(
		err,
		gorm.ErrRecordNotFound,
	) {

		c.JSON(
			http.StatusOK,
			gin.H{
				"success": true,
				"data":    nil,
			},
		)

		return
	}

	// =================================================
	// DATABASE ERROR
	// =================================================

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"error":   "Gagal mengambil alamat",
				"detail":  err.Error(),
			},
		)

		return
	}

	// =================================================
	// SUCCESS
	// =================================================

	c.JSON(
		http.StatusOK,
		gin.H{
			"success": true,
			"data":    address,
		},
	)
}

// =====================================================
// SAVE USER ADDRESS
// =====================================================
//
// POST /api/v1/users/address
//
// =====================================================

func saveAddress(c *gin.Context) {

	// =================================================
	// USER ID
	// =================================================

	userID := strings.TrimSpace(
		c.GetString("user_id"),
	)

	if userID == "" {

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"error":   "User tidak terotentikasi",
			},
		)

		return
	}

	// =================================================
	// REQUEST BODY
	// =================================================

	var address models.UserAddress

	if err := c.ShouldBindJSON(
		&address,
	); err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"error":   "Format alamat tidak valid",
				"detail":  err.Error(),
			},
		)

		return
	}

	// =================================================
	// FORCE USER ID DARI JWT
	// =================================================
	//
	// Jangan percaya user_id dari frontend.
	//
	// User ID harus berasal dari token.
	//
	// =================================================

	address.UserID = userID

	// =================================================
	// SAVE ADDRESS
	// =================================================

	if err := database.CreateAddress(
		address,
	); err != nil {

		log.Println(
			"CreateAddress:",
			err,
		)

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"error":   "Gagal menyimpan alamat",
				"detail":  err.Error(),
			},
		)

		return
	}

	// =================================================
	// SUCCESS
	// =================================================

	c.JSON(
		http.StatusCreated,
		gin.H{
			"success": true,
			"message": "Alamat berhasil disimpan",
			"data":    address,
		},
	)
}

// =====================================================
// UPDATE PROFILE REQUEST
// =====================================================

type UpdateProfileBody struct {
	Name string `json:"name" example:"Budi Santoso"`

	Email string `json:"email" example:"budi@example.com"`
}
