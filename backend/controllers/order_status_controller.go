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
// REQUEST
// =====================================================

type UpdateOrderStatusRequest struct {
	Status string `json:"status" binding:"required"`
	Note   string `json:"note"`
}

// =====================================================
// UPDATE ORDER STATUS
// =====================================================
//
// PATCH /api/v1/orders/:order_id/status
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
// IMPORTANT:
//
// order_status_histories diperlakukan sebagai
// CURRENT STATUS RECORD.
//
// Jadi:
//
// CONFIRMED
//    ↓
// UPDATE row yang sama
//    ↓
// PREPARING
//
// BUKAN:
//
// INSERT CONFIRMED
// INSERT PREPARING
//
// =====================================================

func UpdateOrderStatus(c *gin.Context) {

	// =================================================
	// DATABASE CHECK
	// =================================================

	if database.DB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Database belum terhubung",
		})
		return
	}

	// =================================================
	// GET ORDER ID
	// =================================================

	orderID := strings.TrimSpace(
		c.Param("order_id"),
	)

	if orderID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "order_id wajib diisi",
		})
		return
	}

	parsedOrderID, err := uuid.Parse(orderID)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "order_id harus berupa UUID yang valid",
		})
		return
	}

	// =================================================
	// REQUEST BODY
	// =================================================

	var req UpdateOrderStatusRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Status wajib diisi",
			"error":   err.Error(),
		})
		return
	}

	req.Status = strings.ToUpper(
		strings.TrimSpace(req.Status),
	)

	req.Note = strings.TrimSpace(
		req.Note,
	)

	if req.Status == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Status wajib diisi",
		})
		return
	}

	// =================================================
	// VALIDATE STATUS
	// =================================================

	switch req.Status {

	case models.OrderStatusConfirmed,
		models.OrderStatusPreparing,
		models.OrderStatusReady,
		models.OrderStatusOnDelivery,
		models.OrderStatusCompleted:

		// valid

	default:

		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Status tidak dapat diproses oleh seller",
			"status":  req.Status,
		})

		return
	}

	// =================================================
	// CHANGED BY
	// =================================================

	changedBy := strings.TrimSpace(
		c.GetHeader("X-Changed-By"),
	)

	if changedBy == "" {
		changedBy = "seller"
	}

	if len(changedBy) > 50 {
		changedBy = changedBy[:50]
	}

	// =================================================
	// TRANSACTION
	// =================================================

	tx := database.DB.Begin()

	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Gagal memulai transaction",
			"error":   tx.Error.Error(),
		})
		return
	}

	// =================================================
	// GET ORDER
	// =================================================

	var order models.Order

	err = tx.
		Set("gorm:query_option", "FOR UPDATE").
		Where(
			"id = ?",
			parsedOrderID,
		).
		First(&order).
		Error

	if err != nil {

		tx.Rollback()

		if errors.Is(
			err,
			gorm.ErrRecordNotFound,
		) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Order tidak ditemukan",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Gagal mengambil order",
			"error":   err.Error(),
		})

		return
	}

	// =================================================
	// SELLER AUTHORIZATION
	// =================================================

	sellerIDFromContext := strings.TrimSpace(
		c.GetString("seller_id"),
	)

	if sellerIDFromContext != "" {

		orderSellerID := strings.TrimSpace(
			order.SellerID,
		)

		if orderSellerID != sellerIDFromContext {

			tx.Rollback()

			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "Kamu tidak memiliki akses ke order ini",
			})

			return
		}
	}

	// =================================================
	// CURRENT ORDER STATUS
	// =================================================

	currentStatus := strings.ToUpper(
		strings.TrimSpace(
			order.Status,
		),
	)

	// =================================================
	// SAME STATUS
	// =================================================

	if currentStatus == req.Status {

		tx.Rollback()

		c.JSON(http.StatusConflict, gin.H{
			"success":          false,
			"message":          "Status order sudah berada pada status tersebut",
			"current_status":   currentStatus,
			"requested_status": req.Status,
		})

		return
	}

	// =================================================
	// COMPLETED
	// =================================================

	if currentStatus == models.OrderStatusCompleted {

		tx.Rollback()

		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Order yang sudah selesai tidak dapat diubah lagi",
			"status":  currentStatus,
		})

		return
	}

	// =================================================
	// CANCELLED
	// =================================================

	if currentStatus == models.OrderStatusCancelled {

		tx.Rollback()

		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Order yang sudah dibatalkan tidak dapat diproses lagi",
			"status":  currentStatus,
		})

		return
	}

	// =================================================
	// PAYMENT CHECK
	// =================================================

	paymentStatus := strings.ToUpper(
		strings.TrimSpace(
			order.PaymentStatus,
		),
	)

	if paymentStatus != models.PaymentStatusPaid {

		tx.Rollback()

		c.JSON(http.StatusBadRequest, gin.H{
			"success":        false,
			"message":        "Pesanan belum dibayar sehingga belum dapat diproses",
			"payment_status": order.PaymentStatus,
			"order_status":   order.Status,
		})

		return
	}

	// =================================================
	// VALIDATE TRANSITION
	// =================================================

	if !isValidSellerOrderStatusTransition(
		currentStatus,
		req.Status,
	) {

		tx.Rollback()

		c.JSON(http.StatusBadRequest, gin.H{
			"success":          false,
			"message":          "Perubahan status order tidak diperbolehkan",
			"current_status":   currentStatus,
			"requested_status": req.Status,
		})

		return
	}

	// =================================================
	// SAVE OLD STATUS
	// =================================================

	oldStatus := currentStatus

	// =================================================
	// UPDATE ORDERS TABLE
	// =================================================

	result := tx.
		Model(&order).
		Updates(map[string]interface{}{
			"status": req.Status,
		})

	if result.Error != nil {

		tx.Rollback()

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Gagal mengubah status order",
			"error":   result.Error.Error(),
		})

		return
	}

	if result.RowsAffected != 1 {

		tx.Rollback()

		c.JSON(http.StatusConflict, gin.H{
			"success": false,
			"message": "Status order gagal diperbarui",
		})

		return
	}

	// =================================================
	// GET EXISTING STATUS HISTORY
	// =================================================
	//
	// PENTING:
	//
	// Kita cari row history berdasarkan order_id.
	//
	// Kalau sudah ada:
	//
	// UPDATE row tersebut.
	//
	// Kalau belum ada:
	//
	// INSERT satu kali.
	//
	// =================================================

	var history models.OrderStatusHistory

	historyErr := tx.
		Where(
			"order_id = ?",
			order.ID,
		).
		Order(
			"created_at ASC",
		).
		First(&history).
		Error

	// =================================================
	// HISTORY BELUM ADA
	// =================================================

	if errors.Is(
		historyErr,
		gorm.ErrRecordNotFound,
	) {

		history = models.OrderStatusHistory{
			ID:        uuid.New().String(),
			OrderID:   order.ID,
			Status:    req.Status,
			Note:      req.Note,
			ChangedBy: changedBy,
		}

		if err := tx.
			Create(&history).
			Error; err != nil {

			tx.Rollback()

			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Gagal membuat status order",
				"error":   err.Error(),
			})

			return
		}

	} else if historyErr != nil {

		// =================================================
		// DATABASE ERROR
		// =================================================

		tx.Rollback()

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Gagal mengambil status order",
			"error":   historyErr.Error(),
		})

		return

	} else {

		// =================================================
		// HISTORY SUDAH ADA
		// =================================================
		//
		// JANGAN CREATE.
		//
		// UPDATE ROW YANG SAMA.
		//
		// ID TETAP SAMA.
		//
		// =================================================

		result = tx.
			Model(&history).
			Updates(map[string]interface{}{
				"status":     req.Status,
				"note":       req.Note,
				"changed_by": changedBy,
			})

		if result.Error != nil {

			tx.Rollback()

			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Gagal memperbarui status history",
				"error":   result.Error.Error(),
			})

			return
		}

		if result.RowsAffected != 1 {

			tx.Rollback()

			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "Status history tidak berhasil diperbarui",
			})

			return
		}
	}

	// =================================================
	// COMMIT
	// =================================================

	if err := tx.Commit().Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Gagal menyimpan perubahan order",
			"error":   err.Error(),
		})

		return
	}

	// =================================================
	// UPDATE LOCAL ORDER
	// =================================================

	order.Status = req.Status

	// =================================================
	// RESPONSE
	// =================================================

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": getOrderStatusUpdateMessage(req.Status),
		"data": gin.H{
			"order_id":       order.ID,
			"order_number":   order.OrderNumber,
			"seller_id":      order.SellerID,
			"user_id":        order.UserID,
			"old_status":     oldStatus,
			"status":         order.Status,
			"payment_status": order.PaymentStatus,
			"total_amount":   order.TotalAmount,
			"payment_method": order.PaymentMethod,
			"created_at":     order.CreatedAt,
			"updated_at":     order.UpdatedAt,
			"history":        history,
		},
	})
}

// =====================================================
// SELLER ORDER STATUS TRANSITION
// =====================================================

func isValidSellerOrderStatusTransition(
	current string,
	next string,
) bool {

	switch current {

	case models.OrderStatusWaitingConfirmation:
		return next == models.OrderStatusConfirmed

	case models.OrderStatusConfirmed:
		return next == models.OrderStatusPreparing

	case models.OrderStatusPreparing:
		return next == models.OrderStatusReady

	case models.OrderStatusReady:
		return next == models.OrderStatusOnDelivery

	case models.OrderStatusOnDelivery:
		return next == models.OrderStatusCompleted

	case models.OrderStatusCompleted:
		return false

	case models.OrderStatusCancelled:
		return false

	default:
		return false
	}
}

// =====================================================
// STATUS MESSAGE
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
