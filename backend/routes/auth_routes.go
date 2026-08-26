package routes

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/krisn4novianto/wartegkita/backend/database"
	sellerdb "github.com/krisn4novianto/wartegkita/backend/database/seller"
	"github.com/krisn4novianto/wartegkita/backend/middleware"
)

func RegisterAuthRoutes(api *gin.RouterGroup) {

	auth := api.Group("/auth")

	auth.POST("/register", registerUser)
	auth.POST("/login", loginUser)

	// HANYA daftarkan function ini.
	// Implementasinya berada di auth_forgot_password.go.
	auth.POST("/forgot-password", forgotPassword)
}

type RegisterBody struct {
	Name     string `json:"name" form:"name"`
	Email    string `json:"email" form:"email"`
	Password string `json:"password" form:"password"`
	Role     string `json:"role" form:"role"`

	NamaWarteg string `json:"nama_warteg" form:"nama_warteg"`
	NomorHP    string `json:"nomor_hp" form:"nomor_hp"`
	Alamat     string `json:"alamat" form:"alamat"`
	KTPNumber  string `json:"ktp_number" form:"ktp_number"`
}

func registerUser(c *gin.Context) {

	var body RegisterBody

	contentType := c.ContentType()

	if strings.Contains(contentType, "application/json") {

		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "Format data tidak valid",
				"details": err.Error(),
			})
			return
		}

	} else if strings.Contains(contentType, "multipart/form-data") {

		body.Name = c.PostForm("name")
		body.Email = c.PostForm("email")
		body.Password = c.PostForm("password")
		body.Role = c.PostForm("role")

		body.NamaWarteg = c.PostForm("nama_warteg")
		body.NomorHP = c.PostForm("nomor_hp")
		body.Alamat = c.PostForm("alamat")
		body.KTPNumber = c.PostForm("ktp_number")

	} else {

		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Content-Type tidak didukung",
		})
		return
	}

	body.Name = strings.TrimSpace(body.Name)
	body.Email = strings.ToLower(strings.TrimSpace(body.Email))
	body.Password = strings.TrimSpace(body.Password)
	body.Role = strings.ToLower(strings.TrimSpace(body.Role))

	body.NamaWarteg = strings.TrimSpace(body.NamaWarteg)
	body.NomorHP = strings.TrimSpace(body.NomorHP)
	body.Alamat = strings.TrimSpace(body.Alamat)

	body.KTPNumber = strings.Map(func(r rune) rune {
		if r >= '0' && r <= '9' {
			return r
		}
		return -1
	}, body.KTPNumber)

	if body.Role == "" {
		body.Role = "customer"
	}

	if body.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Nama lengkap wajib diisi",
		})
		return
	}

	if body.Email == "" || !strings.Contains(body.Email, "@") {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Format email tidak valid",
		})
		return
	}

	if len(body.Password) < 8 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Password minimal 8 karakter",
		})
		return
	}

	if body.Role != "customer" && body.Role != "seller" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Role tidak valid",
		})
		return
	}

	// =================================================
	// CUSTOMER
	// =================================================

	if body.Role == "customer" {

		user, err := database.CreateUser(
			body.Name,
			body.Email,
			body.Password,
			"customer",
		)

		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   err.Error(),
			})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"success": true,
			"message": "Registrasi customer berhasil",
			"data":    user,
		})

		return
	}

	// =================================================
	// SELLER VALIDATION
	// =================================================

	if body.NamaWarteg == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Nama usaha / warteg wajib diisi",
		})
		return
	}

	if body.NomorHP == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Nomor HP wajib diisi",
		})
		return
	}

	phoneNumber := strings.Map(func(r rune) rune {
		if r >= '0' && r <= '9' {
			return r
		}
		return -1
	}, body.NomorHP)

	if len(phoneNumber) < 10 || len(phoneNumber) > 15 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Nomor HP tidak valid",
		})
		return
	}

	if body.Alamat == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Alamat usaha wajib diisi",
		})
		return
	}

	if len(body.KTPNumber) != 16 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "NIK KTP harus terdiri dari 16 digit",
		})
		return
	}

	// =================================================
	// KTP
	// =================================================

	ktpFile, err := c.FormFile("ktp_image")

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Foto KTP wajib diunggah",
		})
		return
	}

	allowedKTPTypes := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/webp": true,
	}

	if !allowedKTPTypes[ktpFile.Header.Get("Content-Type")] {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Foto KTP harus JPG, PNG, atau WEBP",
		})
		return
	}

	const maxKTPSize = 5 * 1024 * 1024

	if ktpFile.Size > maxKTPSize {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Ukuran foto KTP maksimal 5 MB",
		})
		return
	}

	// =================================================
	// CREATE USER
	// =================================================

	user, err := database.CreateUser(
		body.Name,
		body.Email,
		body.Password,
		"seller",
	)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	userID := strings.TrimSpace(user.ID)

	if userID == "" {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "User ID gagal dibuat",
		})
		return
	}

	// =================================================
	// IMPORTANT
	// =================================================
	//
	// Untuk sementara jika project kamu memang
	// menggunakan user.ID sebagai seller.ID,
	// kita tetap gunakan ID tersebut.
	//
	// Tetapi USER_ID tetap wajib diisi.
	//
	// =================================================

	sellerID := userID

	// =================================================
	// UPLOAD KTP
	// =================================================

	uploadDir := "./uploads/ktp"

	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Gagal membuat folder upload KTP",
		})
		return
	}

	extension := strings.ToLower(
		filepath.Ext(ktpFile.Filename),
	)

	if extension == "" {
		extension = ".jpg"
	}

	fileName := fmt.Sprintf(
		"%s_%d%s",
		sellerID,
		time.Now().UnixNano(),
		extension,
	)

	ktpPath := filepath.Join(
		uploadDir,
		fileName,
	)

	if err := c.SaveUploadedFile(
		ktpFile,
		ktpPath,
	); err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Gagal menyimpan foto KTP",
		})
		return
	}

	ktpURL := "/uploads/ktp/" + fileName

	// =================================================
	// CREATE SELLER PROFILE
	// =================================================

	profile := sellerdb.SellerProfile{

		SellerID: sellerID,

		// =================================================
		// INI YANG SEBELUMNYA HILANG
		// =================================================
		UserID: userID,

		NamaWarteg:  body.NamaWarteg,
		NamaPemilik: body.Name,
		NomorHP:     phoneNumber,
		Alamat:      body.Alamat,

		Deskripsi: "",

		KTPNumber: body.KTPNumber,
		KTPImage:  ktpURL,

		KTPVerified:        false,
		VerificationStatus: "pending",

		JamBuka:  "",
		JamTutup: "",

		Latitude:  0,
		Longitude: 0,

		Image: "",

		Bank:             "",
		NomorRekening:    "",
		NamaRekening:     "",
		RekeningVerified: false,
	}

	if err := sellerdb.SaveProfile(
		sellerID,
		profile,
	); err != nil {

		_ = os.Remove(ktpPath)

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Gagal membuat profil seller",
			"details": err.Error(),
		})
		return
	}

	// =================================================
	// SUCCESS
	// =================================================

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Registrasi seller berhasil",

		"data": gin.H{
			"id":                  user.ID,
			"name":                user.Name,
			"email":               user.Email,
			"role":                user.Role,
			"seller_id":           sellerID,
			"user_id":             userID,
			"nama_warteg":         body.NamaWarteg,
			"nomor_hp":            phoneNumber,
			"alamat":              body.Alamat,
			"ktp_number":          body.KTPNumber,
			"ktp_image":           ktpURL,
			"verification_status": "pending",
		},
	})
}

// =====================================================
// LOGIN
// =====================================================

func loginUser(c *gin.Context) {

	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Format data tidak valid",
		})
		return
	}

	body.Email = strings.ToLower(
		strings.TrimSpace(body.Email),
	)

	body.Password = strings.TrimSpace(
		body.Password,
	)

	if body.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Email wajib diisi",
		})
		return
	}

	if body.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Password wajib diisi",
		})
		return
	}

	user, err := database.AuthenticateUser(
		body.Email,
		body.Password,
	)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	token, err := middleware.GenerateToken(user.ID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Gagal membuat token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Login berhasil",
		"token":   token,
		"data":    user,
	})
}
