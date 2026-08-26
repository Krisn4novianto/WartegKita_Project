package controllers

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/models"
)

// =====================================================
// GET ORDER STATUS HISTORY
// =====================================================
//
// GET /api/v1/orders/:order_id/status-history
//
// Mengambil seluruh riwayat perubahan status order.
//
// IMPORTANT:
// Endpoint ini HANYA melakukan SELECT.
// Endpoint ini TIDAK melakukan INSERT / UPDATE.
//
// =====================================================

func GetOrderStatusHistory(c *gin.Context) {

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
	// GET ORDER ID
	// =================================================

	orderID := strings.TrimSpace(
		c.Param("order_id"),
	)

	if orderID == "" {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "order_id wajib diisi",
			},
		)
		return
	}

	// =================================================
	// PARSE ORDER UUID
	// =================================================

	parsedOrderID, err := uuid.Parse(orderID)

	if err != nil {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "order_id harus berupa UUID yang valid",
			},
		)
		return
	}

	// =================================================
	// CHECK ORDER EXISTS
	// =================================================

	var order models.Order

	err = database.DB.
		Where(
			"id = ?",
			parsedOrderID,
		).
		First(&order).
		Error

	if err != nil {

		// ---------------------------------------------
		// ORDER NOT FOUND
		// ---------------------------------------------

		if errors.Is(
			err,
			gorm.ErrRecordNotFound,
		) {
			c.JSON(
				http.StatusNotFound,
				gin.H{
					"success": false,
					"message": "Order tidak ditemukan",
				},
			)
			return
		}

		// ---------------------------------------------
		// DATABASE ERROR
		// ---------------------------------------------

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal mengambil order",
				"error":   err.Error(),
			},
		)
		return
	}

	// =================================================
	// GET STATUS HISTORY
	// =================================================

	var histories []models.OrderStatusHistory

	err = database.DB.
		Where(
			"order_id = ?",
			parsedOrderID,
		).
		Order(
			"created_at ASC",
		).
		Find(&histories).
		Error

	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal mengambil riwayat status order",
				"error":   err.Error(),
			},
		)
		return
	}

	// =================================================
	// ENSURE EMPTY ARRAY
	// =================================================

	if histories == nil {
		histories = make(
			[]models.OrderStatusHistory,
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
			"data":    histories,
		},
	)
}
