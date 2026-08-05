package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/models"
)

// =====================================================
// GET MENUS
// =====================================================

func GetMenuController(c *gin.Context) {

	sellerID := c.Query("seller_id")

	if sellerID == "" {
		sellerID = c.Param("seller_id")
	}

	var menus []models.Menu

	query := database.DB.
		Preload("Seller").
		Order("created_at DESC")

	if sellerID != "" {

		if _, err := uuid.Parse(sellerID); err != nil {

			c.JSON(http.StatusBadRequest, gin.H{
				"error": "seller_id harus berupa UUID yang valid",
			})

			return
		}

		query = query.Where(
			"seller_id = ?",
			sellerID,
		)
	}

	if err := query.Find(&menus).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})

		return
	}

	c.JSON(http.StatusOK, menus)
}

// =====================================================
// CREATE MENU
// =====================================================

func CreateMenuController(c *gin.Context) {

	fmt.Println("====================================")
	fmt.Println("CREATE MENU")
	fmt.Println("====================================")

	// =================================================
	// GET FORM DATA
	// =================================================

	sellerID := strings.TrimSpace(
		c.PostForm("seller_id"),
	)

	name := strings.TrimSpace(
		c.PostForm("name"),
	)

	description := strings.TrimSpace(
		c.PostForm("description"),
	)

	priceStr := strings.TrimSpace(
		c.PostForm("price"),
	)

	stockStr := strings.TrimSpace(
		c.PostForm("stock"),
	)

	category := strings.TrimSpace(
		c.PostForm("category"),
	)

	availableStr := strings.TrimSpace(
		c.PostForm("available"),
	)

	fmt.Println("seller_id :", sellerID)
	fmt.Println("name      :", name)
	fmt.Println("price     :", priceStr)
	fmt.Println("stock     :", stockStr)
	fmt.Println("category  :", category)
	fmt.Println("available :", availableStr)

	// =================================================
	// VALIDATE SELLER ID
	// =================================================

	if sellerID == "" {

		c.JSON(http.StatusBadRequest, gin.H{
			"error": "seller_id wajib diisi",
		})

		return
	}

	if _, err := uuid.Parse(sellerID); err != nil {

		c.JSON(http.StatusBadRequest, gin.H{
			"error": "seller_id bukan UUID yang valid",
		})

		return
	}

	// =================================================
	// VALIDATE NAME
	// =================================================

	if name == "" {

		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Nama menu wajib diisi",
		})

		return
	}

	// =================================================
	// VALIDATE CATEGORY
	// =================================================

	if category == "" {

		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Kategori menu wajib diisi",
		})

		return
	}

	// =================================================
	// PARSE PRICE
	// =================================================

	price, err := strconv.ParseFloat(
		priceStr,
		64,
	)

	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "Format harga tidak valid",
			"detail": err.Error(),
		})

		return
	}

	if price <= 0 {

		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Harga harus lebih dari 0",
		})

		return
	}

	// =================================================
	// PARSE STOCK
	// =================================================

	stock, err := strconv.Atoi(
		stockStr,
	)

	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "Format stok tidak valid",
			"detail": err.Error(),
		})

		return
	}

	if stock < 0 {

		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Stok tidak boleh kurang dari 0",
		})

		return
	}

	// =================================================
	// PARSE AVAILABLE
	// =================================================

	available := true

	if availableStr != "" {

		available, err = strconv.ParseBool(
			availableStr,
		)

		if err != nil {

			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Format available tidak valid",
			})

			return
		}
	}

	// =================================================
	// IMAGE UPLOAD
	// =================================================

	imageURL := ""

	file, err := c.FormFile("image")

	if err == nil && file != nil {

		// ---------------------------------------------
		// VALIDATE IMAGE EXTENSION
		// ---------------------------------------------

		extension :=
			strings.ToLower(
				filepath.Ext(file.Filename),
			)

		allowedExtensions :=
			map[string]bool{
				".jpg":  true,
				".jpeg": true,
				".png":  true,
				".webp": true,
			}

		if !allowedExtensions[extension] {

			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Format gambar harus JPG, JPEG, PNG, atau WEBP",
			})

			return
		}

		// ---------------------------------------------
		// CREATE UPLOAD DIRECTORY
		// ---------------------------------------------

		uploadDir := "./uploads"

		if err := os.MkdirAll(
			uploadDir,
			0755,
		); err != nil {

			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Gagal membuat folder upload",
			})

			return
		}

		// ---------------------------------------------
		// GENERATE UNIQUE FILE NAME
		// ---------------------------------------------

		fileName :=
			uuid.New().String() +
				extension

		filePath :=
			filepath.Join(
				uploadDir,
				fileName,
			)

		// ---------------------------------------------
		// SAVE FILE
		// ---------------------------------------------

		if err := c.SaveUploadedFile(
			file,
			filePath,
		); err != nil {

			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Gagal menyimpan gambar",
			})

			return
		}

		imageURL =
			"uploads/" + fileName
	}

	// =================================================
	// GENERATE MENU ID
	// =================================================

	menuID, err :=
		uuid.NewV7()

	if err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal membuat ID menu",
		})

		return
	}

	// =================================================
	// CREATE MENU
	// =================================================

	menu := models.Menu{

		ID: menuID.String(),

		SellerID: sellerID,

		Name: name,

		Description: description,

		Price: price,

		Stock: stock,

		Category: category,

		Image: imageURL,

		Available: available,
	}

	// =================================================
	// SAVE DATABASE
	// =================================================

	if err := database.DB.Create(
		&menu,
	).Error; err != nil {

		// hapus file jika database gagal
		if imageURL != "" {

			_ = os.Remove(
				"./" + imageURL,
			)
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Gagal menyimpan menu",
			"detail": err.Error(),
		})

		return
	}

	// =================================================
	// RESPONSE
	// =================================================

	c.JSON(http.StatusCreated, gin.H{

		"message": "Menu berhasil ditambahkan",

		"id": menu.ID,

		"menu": menu,
	})
}

// =====================================================
// UPDATE MENU
// =====================================================

func UpdateMenuController(c *gin.Context) {

	id := strings.TrimSpace(
		c.Param("id"),
	)

	// =================================================
	// VALIDATE MENU ID
	// =================================================

	if _, err := uuid.Parse(id); err != nil {

		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID menu tidak valid",
		})

		return
	}

	// =================================================
	// FIND MENU
	// =================================================

	var menu models.Menu

	if err := database.DB.
		Where("id = ?", id).
		First(&menu).
		Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{
			"error": "Menu tidak ditemukan",
		})

		return
	}

	// =================================================
	// GET FORM DATA
	// =================================================

	name := strings.TrimSpace(
		c.PostForm("name"),
	)

	description := strings.TrimSpace(
		c.PostForm("description"),
	)

	priceStr := strings.TrimSpace(
		c.PostForm("price"),
	)

	stockStr := strings.TrimSpace(
		c.PostForm("stock"),
	)

	category := strings.TrimSpace(
		c.PostForm("category"),
	)

	availableStr := strings.TrimSpace(
		c.PostForm("available"),
	)

	// =================================================
	// VALIDATE NAME
	// =================================================

	if name == "" {

		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Nama menu wajib diisi",
		})

		return
	}

	// =================================================
	// PARSE PRICE
	// =================================================

	price, err :=
		strconv.ParseFloat(
			priceStr,
			64,
		)

	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Format harga tidak valid",
		})

		return
	}

	if price <= 0 {

		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Harga harus lebih dari 0",
		})

		return
	}

	// =================================================
	// PARSE STOCK
	// =================================================

	stock, err :=
		strconv.Atoi(
			stockStr,
		)

	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Format stok tidak valid",
		})

		return
	}

	if stock < 0 {

		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Stok tidak boleh kurang dari 0",
		})

		return
	}

	// =================================================
	// PARSE AVAILABLE
	// =================================================

	available :=
		menu.Available

	if availableStr != "" {

		available, err =
			strconv.ParseBool(
				availableStr,
			)

		if err != nil {

			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Format available tidak valid",
			})

			return
		}
	}

	// =================================================
	// IMAGE
	// =================================================

	imageURL :=
		menu.Image

	file, err :=
		c.FormFile("image")

	if err == nil && file != nil {

		extension :=
			strings.ToLower(
				filepath.Ext(
					file.Filename,
				),
			)

		allowedExtensions :=
			map[string]bool{
				".jpg":  true,
				".jpeg": true,
				".png":  true,
				".webp": true,
			}

		if !allowedExtensions[extension] {

			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Format gambar harus JPG, JPEG, PNG, atau WEBP",
			})

			return
		}

		uploadDir :=
			"./uploads"

		if err := os.MkdirAll(
			uploadDir,
			0755,
		); err != nil {

			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Gagal membuat folder upload",
			})

			return
		}

		fileName :=
			uuid.New().String() +
				extension

		filePath :=
			filepath.Join(
				uploadDir,
				fileName,
			)

		if err := c.SaveUploadedFile(
			file,
			filePath,
		); err != nil {

			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Gagal menyimpan gambar",
			})

			return
		}

		imageURL =
			"uploads/" + fileName
	}

	// =================================================
	// UPDATE DATABASE
	// =================================================

	updates := map[string]interface{}{

		"name": name,

		"description": description,

		"price": price,

		"stock": stock,

		"category": category,

		"available": available,

		"image": imageURL,

		"updated_at": time.Now(),
	}

	if err := database.DB.
		Model(&models.Menu{}).
		Where("id = ?", id).
		Updates(updates).
		Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Gagal memperbarui menu",
			"detail": err.Error(),
		})

		return
	}

	// =================================================
	// RESPONSE
	// =================================================

	c.JSON(http.StatusOK, gin.H{

		"message": "Menu berhasil diperbarui",

		"id": id,
	})
}

// =====================================================
// DELETE MENU
// =====================================================

func DeleteMenuController(c *gin.Context) {

	id :=
		strings.TrimSpace(
			c.Param("id"),
		)

	if _, err := uuid.Parse(id); err != nil {

		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID menu tidak valid",
		})

		return
	}

	var menu models.Menu

	if err := database.DB.
		Where("id = ?", id).
		First(&menu).
		Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{
			"error": "Menu tidak ditemukan",
		})

		return
	}

	if err := database.DB.
		Delete(&menu).
		Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})

		return
	}

	// optional: hapus file gambar
	if menu.Image != "" {

		_ = os.Remove(
			"./" + menu.Image,
		)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Menu berhasil dihapus",
	})
}
