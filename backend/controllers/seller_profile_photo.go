package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	sellerdb "github.com/krisn4novianto/wartegkita/backend/database/seller"
)

// =====================================================
// UPLOAD SELLER PROFILE PHOTO
//
// POST /api/v1/sellers/:seller_id/profile/photo
//
// Form-data:
//
// photo = file
//
// File disimpan ke:
//
// ./uploads/sellers/profile/
//
// Database:
//
// seller_profiles.image
//
// Nilai image yang disimpan:
//
// /uploads/sellers/profile/xxxxx.jpg
// =====================================================

func UploadSellerProfilePhoto(c *gin.Context) {

	// =================================================
	// SELLER ID
	// =================================================

	sellerID := strings.TrimSpace(
		c.Param("seller_id"),
	)

	if sellerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Seller ID tidak boleh kosong",
		})
		return
	}

	// =================================================
	// GET FILE
	// =================================================

	file, err := c.FormFile("photo")

	if err != nil {

		// Beberapa frontend mungkin menggunakan
		// nama field "image".
		//
		// Jadi kita support keduanya.

		file, err = c.FormFile("image")

		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Foto tidak ditemukan. Gunakan field 'photo'",
				"error":   err.Error(),
			})
			return
		}
	}

	// =================================================
	// VALIDASI FILE
	// =================================================

	if file == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "File foto tidak ditemukan",
		})
		return
	}

	// =================================================
	// MAX SIZE
	//
	// 5 MB
	// =================================================

	const maxFileSize = 5 * 1024 * 1024

	if file.Size > maxFileSize {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Ukuran foto maksimal 5 MB",
		})
		return
	}

	// =================================================
	// EXTENSION
	// =================================================

	ext := strings.ToLower(
		filepath.Ext(file.Filename),
	)

	allowedExtensions := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".webp": true,
	}

	if !allowedExtensions[ext] {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Format foto harus JPG, JPEG, PNG, atau WEBP",
		})
		return
	}

	// =================================================
	// CEK PROFILE
	// =================================================

	profile, err := sellerdb.GetProfile(sellerID)

	if err != nil {

		// Profile belum ada.
		//
		// Karena SaveProfile() bisa membuat profile,
		// kita buat profile kosong terlebih dahulu.

		profile = sellerdb.SellerProfile{
			SellerID: sellerID,
		}
	}

	// =================================================
	// FOLDER UPLOAD
	// =================================================

	uploadDir := filepath.Join(
		"uploads",
		"sellers",
		"profile",
	)

	if err := os.MkdirAll(
		uploadDir,
		0755,
	); err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Gagal membuat folder upload",
			"error":   err.Error(),
		})
		return
	}

	// =================================================
	// GENERATE FILE NAME
	// =================================================

	fileID := uuid.New().String()

	filename := fmt.Sprintf(
		"%s_%d%s",
		fileID,
		time.Now().UnixNano(),
		ext,
	)

	filePath := filepath.Join(
		uploadDir,
		filename,
	)

	// =================================================
	// SIMPAN FILE
	// =================================================

	if err := c.SaveUploadedFile(
		file,
		filePath,
	); err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Gagal menyimpan file foto",
			"error":   err.Error(),
		})
		return
	}

	// =================================================
	// PATH UNTUK DATABASE
	// =================================================
	//
	// Jangan simpan absolute path.
	//
	// Simpan URL relatif yang bisa diakses frontend:
	//
	// /uploads/sellers/profile/filename.jpg
	//

	imageURL := "/uploads/sellers/profile/" + filename

	// =================================================
	// HAPUS FOTO LAMA
	// =================================================

	oldImage := strings.TrimSpace(
		profile.Image,
	)

	// =================================================
	// UPDATE DATABASE
	// =================================================

	profile.SellerID = sellerID
	profile.Image = imageURL

	if err := sellerdb.SaveProfile(
		sellerID,
		profile,
	); err != nil {

		// Kalau DB gagal, hapus file baru supaya
		// tidak meninggalkan file sampah.

		_ = os.Remove(filePath)

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Foto berhasil di-upload tetapi gagal disimpan ke database",
			"error":   err.Error(),
		})
		return
	}

	// =================================================
	// HAPUS FILE LAMA
	// =================================================

	if oldImage != "" &&
		oldImage != imageURL {

		deleteOldSellerProfileImage(
			oldImage,
		)
	}

	// =================================================
	// RESPONSE
	// =================================================

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Foto profil berhasil di-upload",
		"data": gin.H{
			"seller_id": sellerID,
			"image":     imageURL,
		},
	})
}

// =====================================================
// DELETE SELLER PROFILE PHOTO
//
// DELETE /api/v1/sellers/:seller_id/profile/photo
// =====================================================

func DeleteSellerProfilePhoto(c *gin.Context) {

	sellerID := strings.TrimSpace(
		c.Param("seller_id"),
	)

	if sellerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Seller ID tidak boleh kosong",
		})
		return
	}

	// =================================================
	// GET PROFILE
	// =================================================

	profile, err := sellerdb.GetProfile(
		sellerID,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Profil seller tidak ditemukan",
		})
		return
	}

	// =================================================
	// OLD IMAGE
	// =================================================

	oldImage := strings.TrimSpace(
		profile.Image,
	)

	// =================================================
	// CLEAR DATABASE
	// =================================================

	profile.Image = ""

	if err := sellerdb.SaveProfile(
		sellerID,
		profile,
	); err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Gagal menghapus foto profil",
			"error":   err.Error(),
		})
		return
	}

	// =================================================
	// DELETE FILE
	// =================================================

	if oldImage != "" {
		deleteOldSellerProfileImage(
			oldImage,
		)
	}

	// =================================================
	// RESPONSE
	// =================================================

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Foto profil berhasil dihapus",
		"data": gin.H{
			"seller_id": sellerID,
			"image":     "",
		},
	})
}

// =====================================================
// DELETE OLD IMAGE FILE
// =====================================================

func deleteOldSellerProfileImage(
	imageURL string,
) {

	imageURL = strings.TrimSpace(
		imageURL,
	)

	if imageURL == "" {
		return
	}

	// Hanya izinkan menghapus file yang memang
	// berasal dari folder seller profile.

	const prefix = "/uploads/sellers/profile/"

	if !strings.HasPrefix(
		imageURL,
		prefix,
	) {
		return
	}

	relativePath := strings.TrimPrefix(
		imageURL,
		"/",
	)

	// uploads/sellers/profile/file.jpg

	filePath := filepath.Clean(
		relativePath,
	)

	// Safety check.
	//
	// Jangan pernah menghapus file di luar
	// folder uploads/sellers/profile.

	expectedPrefix := filepath.Join(
		"uploads",
		"sellers",
		"profile",
	) + string(os.PathSeparator)

	if !strings.HasPrefix(
		filePath,
		expectedPrefix,
	) {
		return
	}

	_ = os.Remove(filePath)
}
