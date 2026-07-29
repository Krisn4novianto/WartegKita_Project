package controllers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/models"
)

// GetMenuController godoc
// @Summary      Get Menus
// @Description  Returns all menus. Filter by seller_id query param to get menus for a specific seller.
// @Tags         Menus
// @Produce      json
// @Param        seller_id query int false "Filter by seller ID"
// @Success      200 {array}  models.Menu
// @Failure      500 {object} map[string]string
// @Router       /menus [get]
func GetMenuController(c *gin.Context) {
	sellerID := c.Query("seller_id")

	var menus []models.Menu
	query := database.DB.Order("created_at DESC")
	if sellerID != "" {
		query = query.Where("seller_id = ?", sellerID)
	}

	if err := query.Find(&menus).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, menus)
}

// CreateMenuController godoc
// @Summary      Create Menu
// @Description  Create a new menu item. Accepts multipart/form-data to support image upload.
// @Tags         Menus
// @Accept       multipart/form-data
// @Produce      json
// @Param        seller_id   formData string true  "Seller ID (UUID)"
// @Param        name        formData string true  "Menu name"
// @Param        description formData string false "Menu description"
// @Param        price       formData number true  "Price"
// @Param        stock       formData int    false "Stock quantity"
// @Param        category    formData string true  "Category name"
// @Param        available   formData bool   false "Is available"
// @Param        image       formData file   false "Menu image file"
// @Success      201 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /menus [post]
func CreateMenuController(c *gin.Context) {
	fmt.Println("===== CREATE MENU =====")

	sellerID := c.PostForm("seller_id")
	price := toFloat(c.PostForm("price"))
	stock := toInt(c.PostForm("stock"))
	available := c.PostForm("available") == "true"

	imageURL := ""
	file, err := c.FormFile("image")
	if err == nil {
		uploadPath := "./uploads/" + file.Filename
		if err := c.SaveUploadedFile(file, uploadPath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal upload gambar"})
			return
		}
		imageURL = "uploads/" + file.Filename
	}

	menuIDObj, err := uuid.NewV7()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	menu := models.Menu{
		ID:          menuIDObj.String(),
		SellerID:    sellerID,
		Name:        c.PostForm("name"),
		Description: c.PostForm("description"),
		Price:       price,
		Stock:       stock,
		Category:    c.PostForm("category"),
		Image:       imageURL,
		Available:   available,
	}

	if err := database.DB.Create(&menu).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Menu berhasil ditambahkan"})
}

// UpdateMenuController godoc
// @Summary      Update Menu
// @Description  Update an existing menu item by its ID
// @Tags         Menus
// @Accept       multipart/form-data
// @Produce      json
// @Param        id          path     string true  "Menu ID"
// @Param        name        formData string false "Menu name"
// @Param        description formData string false "Menu description"
// @Param        price       formData number false "Price"
// @Param        stock       formData int    false "Stock quantity"
// @Param        category    formData string false "Category"
// @Param        available   formData bool   false "Is available"
// @Success      200 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /menus/{id} [put]
func UpdateMenuController(c *gin.Context) {
	id := c.Param("id")
	price := toFloat(c.PostForm("price"))
	stock := toInt(c.PostForm("stock"))
	available := c.PostForm("available") == "true"

	updates := map[string]interface{}{
		"name":        c.PostForm("name"),
		"description": c.PostForm("description"),
		"price":       price,
		"stock":       stock,
		"category":    c.PostForm("category"),
		"available":   available,
	}

	if err := database.DB.Model(&models.Menu{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Menu berhasil diperbarui"})
}

// DeleteMenuController godoc
// @Summary      Delete Menu
// @Description  Permanently delete a menu item
// @Tags         Menus
// @Produce      json
// @Param        id path string true "Menu ID"
// @Success      200 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /menus/{id} [delete]
func DeleteMenuController(c *gin.Context) {
	id := c.Param("id")

	if err := database.DB.Where("id = ?", id).Delete(&models.Menu{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Menu berhasil dihapus"})
}

