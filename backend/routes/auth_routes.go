package routes

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/middleware"
)

// =====================================================
// REGISTER AUTH ROUTES
// =====================================================
//
// POST /api/v1/auth/login
// POST /api/v1/auth/forgot-password
//
// =====================================================

func RegisterAuthRoutes(api *gin.RouterGroup) {

	auth := api.Group("/auth")

	// =================================================
	// LOGIN
	// =================================================

	auth.POST(
		"/login",
		loginUser,
	)

	// =================================================
	// FORGOT PASSWORD
	// =================================================

	auth.POST(
		"/forgot-password",
		forgotPassword,
	)
}

// =====================================================
// LOGIN REQUEST
// =====================================================

type LoginBody struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// =====================================================
// LOGIN USER
// =====================================================
//
// POST /api/v1/auth/login
//
// Body:
//
// {
//     "email": "user@gmail.com",
//     "password": "Password123!"
// }
//
// =====================================================

func loginUser(c *gin.Context) {

	// =================================================
	// REQUEST BODY
	// =================================================

	var body LoginBody

	if err := c.ShouldBindJSON(&body); err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"error":   "Email dan password wajib diisi",
			},
		)

		return
	}

	// =================================================
	// NORMALIZE INPUT
	// =================================================

	body.Email = strings.ToLower(
		strings.TrimSpace(body.Email),
	)

	body.Password = strings.TrimSpace(
		body.Password,
	)

	// =================================================
	// VALIDATE EMAIL
	// =================================================

	if body.Email == "" {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"error":   "Email wajib diisi",
			},
		)

		return
	}

	// =================================================
	// VALIDATE PASSWORD
	// =================================================

	if body.Password == "" {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"error":   "Password wajib diisi",
			},
		)

		return
	}

	// =================================================
	// AUTHENTICATE USER
	// =================================================

	user, err := database.AuthenticateUser(
		body.Email,
		body.Password,
	)

	if err != nil {

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"error":   err.Error(),
			},
		)

		return
	}

	// =================================================
	// GENERATE JWT
	// =================================================

	token, err := middleware.GenerateToken(
		user.ID,
	)

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"error":   "Gagal membuat token",
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
			"message": "Login berhasil",

			// JWT
			"token": token,

			// User
			"user": gin.H{
				"id":    user.ID,
				"name":  user.Name,
				"email": user.Email,
				"role":  user.Role,
			},
		},
	)
}
