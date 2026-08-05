package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/models"
)

// =====================================================
// GET CUSTOMER ORDERS
// =====================================================
//
// GET /api/v1/orders
//
// AUTH REQUIRED
//
// User ID diambil dari JWT.
// Tidak menerima user_id dari frontend.
//
// =====================================================

func GetCustomerOrders(c *gin.Context) {

	// =================================================
	// AMBIL USER ID DARI JWT
	// =================================================

	userID := c.GetString("user_id")

	if userID == "" {

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"message": "User tidak terautentikasi",
			},
		)

		return
	}

	// =================================================
	// VALIDATE UUID
	// =================================================

	if _, err := uuid.Parse(userID); err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "user_id tidak valid",
			},
		)

		return
	}

	// =================================================
	// GET ORDERS
	// =================================================

	var orders []models.Order

	err := database.DB.
		Where("user_id = ?", userID).
		Preload("Items").
		Order("created_at DESC").
		Find(&orders).
		Error

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal mengambil pesanan",
				"error":   err.Error(),
			},
		)

		return
	}

	// =================================================
	// EMPTY ARRAY
	// =================================================

	if orders == nil {
		orders = make([]models.Order, 0)
	}

	// =================================================
	// RESPONSE
	// =================================================

	c.JSON(
		http.StatusOK,
		gin.H{
			"success": true,
			"data":    orders,
		},
	)
}
