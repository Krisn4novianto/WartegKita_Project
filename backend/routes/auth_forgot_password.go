package routes

import (
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/email"
	"github.com/krisn4novianto/wartegkita/backend/utils"
)

// =====================================
// FORGOT PASSWORD
// POST /api/v1/auth/forgot-password
// =====================================

func forgotPassword(c *gin.Context) {

	var request struct {
		Email string `json:"email"`
	}

	// ==========================
	// VALIDATE REQUEST
	// ==========================

	if err := c.ShouldBindJSON(&request); err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"error": "email wajib diisi",
			},
		)

		return
	}

	// ==========================
	// NORMALIZE EMAIL
	// ==========================

	request.Email =
		strings.ToLower(
			strings.TrimSpace(
				request.Email,
			),
		)

	if request.Email == "" {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"error": "email wajib diisi",
			},
		)

		return
	}

	// ==========================
	// GET USER
	// ==========================

	user, err :=
		database.GetUserByEmail(
			request.Email,
		)

	// SECURITY:
	// jangan bocorkan email terdaftar atau tidak

	if err != nil {

		c.JSON(
			http.StatusOK,
			gin.H{
				"message": "Jika email terdaftar, OTP akan dikirim",
			},
		)

		return
	}

	// ==========================
	// GENERATE OTP
	// ==========================

	otp :=
		utils.GenerateOTP()

	if otp == "" {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"error": "gagal membuat OTP",
			},
		)

		return
	}

	// ==========================
	// SAVE OTP TO DATABASE
	// ==========================

	err =
		database.CreatePasswordResetOTP(
			user.ID,
			otp,
		)

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"error": "gagal menyimpan OTP",
			},
		)

		return
	}

	// ==========================
	// SEND OTP EMAIL
	// ==========================
	err = email.SendOTP(user.Email, otp)
	if err != nil {

		log.Printf("SendOTP error: %v\n", err)

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})

		return
	}

	// ==========================
	// SUCCESS
	// ==========================

	c.JSON(
		http.StatusOK,
		gin.H{
			"message": "OTP berhasil dikirim ke email",
		},
	)

}
