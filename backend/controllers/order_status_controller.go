package controllers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/models"
)

// =====================================================
// UPDATE ORDER STATUS - SELLER
// =====================================================
//
// PATCH /api/v1/orders/:order_id/status
//
// Seller hanya boleh menjalankan flow:
//
// WAITING_CONFIRMATION
//        ↓
//    CONFIRMED
//        ↓
//    PREPARING
//        ↓
//      READY
//        ↓
//   ON_DELIVERY
//        ↓
//   COMPLETED
//
// SYARAT:
// - Order harus sudah PAID
// - Seller harus memiliki order tersebut
// - Seller tidak dapat CANCELLED
// - Status tidak boleh dilompati
// - COMPLETED adalah status final
//
// =====================================================

func UpdateOrderStatus(c *gin.Context) {

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
	// VALIDATE UUID
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
	// REQUEST BODY
	// =================================================

	var request struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Format request tidak valid",
				"error":   err.Error(),
			},
		)
		return
	}

	// =================================================
	// NORMALIZE REQUEST STATUS
	// =================================================

	requestedStatus := strings.ToUpper(
		strings.TrimSpace(
			request.Status,
		),
	)

	// =================================================
	// SELLER STATUS YANG DIIZINKAN
	// =================================================
	//
	// PENTING:
	// CANCELLED TIDAK ADA DI SINI.
	//
	// Seller tidak boleh menolak order.
	//
	// =================================================

	switch requestedStatus {

	case models.OrderStatusConfirmed:
		// allowed

	case models.OrderStatusPreparing:
		// allowed

	case models.OrderStatusReady:
		// allowed

	case models.OrderStatusOnDelivery:
		// allowed

	case models.OrderStatusCompleted:
		// allowed

	default:

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Status tidak dapat diproses oleh seller",
				"status":  requestedStatus,
			},
		)

		return
	}

	// =================================================
	// FIND ORDER
	// =================================================

	var order models.Order

	err = database.DB.
		Where("id = ?", parsedOrderID).
		First(&order).
		Error

	if err != nil {

		if err == gorm.ErrRecordNotFound {
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
	// SELLER AUTHORIZATION
	// =================================================
	//
	// Seller hanya boleh mengubah order miliknya.
	//
	// Sesuaikan nama context key dengan middleware login
	// kamu jika berbeda.
	//
	// =================================================

	sellerIDFromContext := strings.TrimSpace(
		c.GetString("seller_id"),
	)

	/*
	 * Kalau middleware kamu menyimpan seller ID dengan
	 * key lain, misalnya "user_id", sesuaikan bagian ini.
	 */

	if sellerIDFromContext != "" {

		orderSellerID := strings.TrimSpace(
			order.SellerID,
		)

		if orderSellerID != sellerIDFromContext {

			c.JSON(
				http.StatusForbidden,
				gin.H{
					"success": false,
					"message": "Kamu tidak memiliki akses ke order ini",
				},
			)

			return
		}
	}

	// =================================================
	// NORMALIZE CURRENT STATUS
	// =================================================

	currentStatus := strings.ToUpper(
		strings.TrimSpace(
			order.Status,
		),
	)

	// =================================================
	// ORDER HARUS SUDAH DIBAYAR
	// =================================================
	//
	// Seller tidak boleh memproses order:
	//
	// UNPAID
	// PENDING
	// FAILED
	// EXPIRED
	//
	// Hanya PAID yang boleh masuk proses.
	//
	// =================================================

	paymentStatus := strings.ToUpper(
		strings.TrimSpace(
			order.PaymentStatus,
		),
	)

	if paymentStatus != "PAID" {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success":        false,
				"message":        "Pesanan belum dibayar sehingga belum dapat diproses",
				"payment_status": order.PaymentStatus,
				"order_status":   order.Status,
			},
		)

		return
	}

	// =================================================
	// VALIDATE STATUS TRANSITION
	// =================================================

	if !isValidSellerOrderStatusTransition(
		currentStatus,
		requestedStatus,
	) {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success":          false,
				"message":          "Perubahan status order tidak diperbolehkan",
				"current_status":   currentStatus,
				"requested_status": requestedStatus,
			},
		)

		return
	}

	// =================================================
	// UPDATE STATUS
	// =================================================

	order.Status = requestedStatus

	result := database.DB.
		Model(&order).
		Updates(map[string]interface{}{
			"status": requestedStatus,
		})

	if result.Error != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal mengubah status order",
				"error":   result.Error.Error(),
			},
		)

		return
	}

	// =================================================
	// CHECK AFFECTED ROW
	// =================================================

	if result.RowsAffected == 0 {

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
	// RELOAD ORDER
	// =================================================

	if err := database.DB.
		Where("id = ?", parsedOrderID).
		First(&order).
		Error; err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Status berhasil diubah tetapi gagal mengambil data terbaru",
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
			"message": getOrderStatusUpdateMessage(
				requestedStatus,
			),
			"data": gin.H{
				"id":             order.ID,
				"order_number":   order.OrderNumber,
				"seller_id":      order.SellerID,
				"user_id":        order.UserID,
				"status":         order.Status,
				"payment_status": order.PaymentStatus,
				"total_amount":   order.TotalAmount,
				"payment_method": order.PaymentMethod,
				"created_at":     order.CreatedAt,
				"updated_at":     order.UpdatedAt,
			},
		},
	)
}

// =====================================================
// SELLER ORDER STATUS TRANSITION
// =====================================================
//
// Flow:
//
// WAITING_CONFIRMATION
//        ↓
//    CONFIRMED
//        ↓
//    PREPARING
//        ↓
//      READY
//        ↓
//   ON_DELIVERY
//        ↓
//   COMPLETED
//
// Seller TIDAK bisa:
// - CANCELLED
// - loncat status
// - mundur status
//
// =====================================================

func isValidSellerOrderStatusTransition(
	current string,
	next string,
) bool {

	// =================================================
	// STATUS SAMA
	// =================================================

	if current == next {
		return true
	}

	// =================================================
	// COMPLETED = FINAL
	// =================================================

	if current == models.OrderStatusCompleted {
		return false
	}

	// =================================================
	// CANCELLED = FINAL
	// =================================================
	//
	// Kalau order sudah cancelled dari proses lain,
	// seller tidak boleh mengubahnya lagi.
	//
	// =================================================

	if current == models.OrderStatusCancelled {
		return false
	}

	// =================================================
	// WAITING_CONFIRMATION → CONFIRMED
	// =================================================

	if current == models.OrderStatusWaitingConfirmation {

		return next ==
			models.OrderStatusConfirmed
	}

	// =================================================
	// CONFIRMED → PREPARING
	// =================================================

	if current == models.OrderStatusConfirmed {

		return next ==
			models.OrderStatusPreparing
	}

	// =================================================
	// PREPARING → READY
	// =================================================

	if current == models.OrderStatusPreparing {

		return next ==
			models.OrderStatusReady
	}

	// =================================================
	// READY → ON_DELIVERY
	// =================================================

	if current == models.OrderStatusReady {

		return next ==
			models.OrderStatusOnDelivery
	}

	// =================================================
	// ON_DELIVERY → COMPLETED
	// =================================================

	if current == models.OrderStatusOnDelivery {

		return next ==
			models.OrderStatusCompleted
	}

	return false
}

// =====================================================
// STATUS UPDATE MESSAGE
// =====================================================

func getOrderStatusUpdateMessage(
	status string,
) string {

	switch status {

	case models.OrderStatusConfirmed:
		return "Pesanan berhasil dikonfirmasi"

	case models.OrderStatusPreparing:
		return "Pesanan sedang disiapkan"

	case models.OrderStatusReady:
		return "Pesanan sudah siap"

	case models.OrderStatusOnDelivery:
		return "Pesanan sedang diantar"

	case models.OrderStatusCompleted:
		return "Pesanan berhasil diselesaikan"

	default:
		return "Status order berhasil diperbarui"
	}
}
