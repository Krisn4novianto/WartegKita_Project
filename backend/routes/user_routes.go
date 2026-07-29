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
	users.GET("/profile", getUserProfile)
	users.PUT("/profile", updateUserProfile)

	// ADDRESS
	users.GET("/address", getUserAddress)
	users.POST("/address", saveAddress)
}

func getUserProfile(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User tidak terotentikasi"})
		return
	}

	var user models.User
	if err := database.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": user})
}

func updateUserProfile(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User tidak terotentikasi"})
		return
	}

	var body struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"name":  body.Name,
		"email": body.Email,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "profile updated"})
}

func getUserAddress(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User tidak terotentikasi"})
		return
	}

	var address models.UserAddress
	if err := database.DB.Where("user_id = ?", userID).First(&address).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"data": nil})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": address})
}

func saveAddress(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User tidak terotentikasi"})
		return
	}

	var address models.UserAddress
	if err := c.ShouldBindJSON(&address); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	address.UserID = userID
	if err := database.CreateAddress(address); err != nil {
		log.Println("CreateAddress:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "address saved",
		"data":    address,
	})
}

type UpdateProfileBody struct {
	Name  string `json:"name"  example:"Budi Santoso"`
	Email string `json:"email" example:"budi@example.com"`
}

