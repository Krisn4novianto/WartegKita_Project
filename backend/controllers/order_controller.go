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
// GET USER ORDERS
// =====================================================
//
// GET /api/v1/orders/user/:user_id
//
// Mengambil seluruh order milik customer.
//
// =====================================================

func GetUserOrders(c *gin.Context) {

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
	// GET USER ID
	// =================================================

	userID := strings.TrimSpace(
		c.Param("user_id"),
	)

	if userID == "" {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "user_id wajib diisi",
			},
		)
		return
	}

	// =================================================
	// VALIDATE USER UUID
	// =================================================

	parsedUserID, err := uuid.Parse(userID)

	if err != nil {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "user_id harus berupa UUID yang valid",
			},
		)
		return
	}

	// =================================================
	// GET ORDERS
	// =================================================

	var orders []models.Order

	err = database.DB.
		Where(
			"user_id = ?",
			parsedUserID,
		).
		Preload("Items").
		Preload("Items.Menu").
		Order("created_at DESC").
		Find(&orders).
		Error

	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal mengambil order customer",
				"error":   err.Error(),
			},
		)
		return
	}

	// =================================================
	// ENSURE ARRAY
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

// =====================================================
// GET SELLER ORDERS
// =====================================================
//
// GET /api/v1/sellers/:seller_id/orders
//
// Mengambil seluruh order milik seller.
//
// Include:
// - customer/user
// - order items
// - menu
// - customer note pada order item
//
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
	// SELLER ID
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
	// VALIDATE SELLER UUID
	// =================================================

	parsedSellerID, err := uuid.Parse(sellerID)

	if err != nil {
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
	// GET SELLER ORDERS
	// =================================================

	var orders []models.Order

	err = database.DB.
		Where(
			"seller_id = ?",
			parsedSellerID,
		).
		Preload("User").
		Preload("Items").
		Preload("Items.Menu").
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
	// ENSURE ARRAY
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

// =====================================================
// CANCEL ORDER
// =====================================================
//
// PATCH /api/v1/orders/:order_id/cancel
//
// =====================================================

func CancelOrder(c *gin.Context) {

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
	// ORDER ID
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
	// VALIDATE ORDER UUID
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
	// TRANSACTION
	// =================================================

	tx := database.DB.Begin()

	if tx.Error != nil {
		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal memulai transaction",
				"error":   tx.Error.Error(),
			},
		)
		return
	}

	// =================================================
	// GET ORDER
	// =================================================

	var order models.Order

	err = tx.
		Where(
			"id = ?",
			parsedOrderID,
		).
		First(&order).
		Error

	if err != nil {

		tx.Rollback()

		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(
				http.StatusNotFound,
				gin.H{
					"success": false,
					"message": "Order tidak ditemukan",
				},
			)
			return
		}

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
	// CURRENT STATUS
	// =================================================

	currentStatus := strings.ToUpper(
		strings.TrimSpace(
			order.Status,
		),
	)

	// =================================================
	// ALREADY CANCELLED
	// =================================================

	if currentStatus == models.OrderStatusCancelled {

		tx.Rollback()

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Order sudah dibatalkan",
				"status":  order.Status,
			},
		)

		return
	}

	// =================================================
	// COMPLETED CANNOT CANCEL
	// =================================================

	if currentStatus == models.OrderStatusCompleted {

		tx.Rollback()

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Order yang sudah selesai tidak dapat dibatalkan",
				"status":  order.Status,
			},
		)

		return
	}

	// =================================================
	// OLD STATUS
	// =================================================

	oldStatus := order.Status

	// =================================================
	// UPDATE STATUS
	// =================================================

	result := tx.
		Model(&order).
		Update(
			"status",
			models.OrderStatusCancelled,
		)

	if result.Error != nil {

		tx.Rollback()

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal membatalkan order",
				"error":   result.Error.Error(),
			},
		)

		return
	}

	if result.RowsAffected == 0 {

		tx.Rollback()

		c.JSON(
			http.StatusNotFound,
			gin.H{
				"success": false,
				"message": "Order tidak berhasil diperbarui",
			},
		)

		return
	}

	// =================================================
	// COMMIT
	// =================================================

	if err := tx.Commit().Error; err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal menyimpan pembatalan order",
				"error":   err.Error(),
			},
		)

		return
	}

	// =================================================
	// RELOAD ORDER
	// =================================================

	if err := database.DB.
		Where(
			"id = ?",
			parsedOrderID,
		).
		First(&order).
		Error; err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Order berhasil dibatalkan tetapi gagal mengambil data terbaru",
				"error":   err.Error(),
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
			"message": "Order berhasil dibatalkan",
			"data": gin.H{
				"order_id":       order.ID,
				"order_number":   order.OrderNumber,
				"old_status":     oldStatus,
				"status":         order.Status,
				"payment_status": order.PaymentStatus,
				"total_amount":   order.TotalAmount,
				"updated_at":     order.UpdatedAt,
			},
		},
	)
}
