package controllers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/models"
)

// =====================================================
// GET SELLER ORDERS
// =====================================================
//
// GET /api/v1/sellers/:seller_id/orders
//
// Mengambil seluruh order milik seller.
// =====================================================

func GetSellerOrders(c *gin.Context) {

	// =================================================
	// DATABASE CHECK
	// =================================================

	if database.DB == nil {
		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Database belum terhubung",
			},
		)
		return
	}

	// =================================================
	// GET SELLER ID
	// =================================================

	sellerID := strings.TrimSpace(
		c.Param("seller_id"),
	)

	if sellerID == "" {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "seller_id wajib diisi",
			},
		)
		return
	}

	// =================================================
	// VALIDATE UUID
	// =================================================

	if _, err := uuid.Parse(sellerID); err != nil {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "seller_id harus berupa UUID yang valid",
			},
		)
		return
	}

	// =================================================
	// GET ORDERS
	// =================================================

	var orders []models.Order

	err := database.DB.
		Where(
			"seller_id = ?",
			sellerID,
		).
		Preload("Items").
		Order("created_at DESC").
		Find(&orders).
		Error

	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal mengambil order seller",
				"error":   err.Error(),
			},
		)
		return
	}

	// =================================================
	// EMPTY ARRAY
	// =================================================

	if orders == nil {
		orders = make(
			[]models.Order,
			0,
		)
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
