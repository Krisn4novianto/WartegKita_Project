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

type PayOrderRequest struct {
	PaymentMethod string `json:"payment_method"`
}

// =====================================================
// PAY ORDER
//
// PUT /api/v1/orders/:order_id/pay
//
// AUTH REQUIRED
//
// Request:
//
// {
//     "payment_method": "qris"
// }
//
// Flow:
//
// CUSTOMER
//    ↓
// Payment.tsx
//    ↓
// PUT /orders/:order_id/pay
//    ↓
// PayOrder()
//    ↓
// payment_status = PAID
//    ↓
// order status TETAP
//    ↓
// Seller menerima order
//
// =====================================================

func PayOrder(c *gin.Context) {

	// =================================================
	// 1. GET ORDER ID
	// =================================================

	orderIDString := strings.TrimSpace(
		c.Param("order_id"),
	)

	if orderIDString == "" {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"error":   "Order ID wajib diisi.",
			},
		)
		return
	}

	orderID, err := uuid.Parse(orderIDString)

	if err != nil {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"error":   "Order ID tidak valid.",
				"details": err.Error(),
			},
		)
		return
	}

	// =================================================
	// 2. GET USER ID FROM JWT
	// =================================================

	userIDValue, exists := c.Get("user_id")

	if !exists {
		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"error":   "User tidak terautentikasi.",
			},
		)
		return
	}

	userIDString := strings.TrimSpace(
		toString(userIDValue),
	)

	if userIDString == "" {
		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"error":   "User ID tidak ditemukan dari JWT.",
			},
		)
		return
	}

	// =================================================
	// 3. VALIDATE USER UUID
	// =================================================

	if _, err := uuid.Parse(userIDString); err != nil {
		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"error":   "User ID dari JWT tidak valid.",
			},
		)
		return
	}

	// =================================================
	// 4. REQUEST BODY
	// =================================================

	var request PayOrderRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"error":   "Request pembayaran tidak valid.",
				"details": err.Error(),
			},
		)
		return
	}

	// =================================================
	// 5. NORMALIZE PAYMENT METHOD
	// =================================================
	//
	// 🔧 DIUBAH:
	//
	// Payment.tsx bisa mengirim:
	//
	// qris
	// bank_transfer
	// virtual_account
	//
	// Backend kita normalisasi supaya format
	// yang disimpan di database selalu konsisten.
	//
	// =================================================

	paymentMethod := normalizePaymentMethod(
		request.PaymentMethod,
	)

	if paymentMethod == "" {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"error":   "Metode pembayaran tidak valid.",
				"allowed": []string{
					models.PaymentMethodQRIS,
					models.PaymentMethodBankTransfer,
					models.PaymentMethodVirtualAccount,
				},
			},
		)
		return
	}

	// =================================================
	// 6. DATABASE
	// =================================================

	db := database.DB

	if db == nil {
		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"error":   "Database belum terhubung.",
			},
		)
		return
	}

	// =================================================
	// 7. FIND ORDER
	// =================================================

	var order models.Order

	err = db.
		Where("id = ?", orderID).
		First(&order).
		Error

	if err != nil {

		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(
				http.StatusNotFound,
				gin.H{
					"success": false,
					"error":   "Pesanan tidak ditemukan.",
				},
			)
			return
		}

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"error":   "Gagal mengambil data pesanan.",
				"details": err.Error(),
			},
		)
		return
	}

	// =================================================
	// 8. VERIFY ORDER OWNER
	// =================================================
	//
	// 🔧 DIPERTAHANKAN:
	//
	// Customer hanya boleh membayar order miliknya.
	//
	// Jangan sampai customer A bisa memanggil:
	//
	// PUT /orders/{order-customer-B}/pay
	//
	// =================================================

	orderUserID := strings.TrimSpace(
		order.UserID,
	)

	if orderUserID == "" {
		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"error":   "User ID pada pesanan tidak tersedia.",
			},
		)
		return
	}

	if orderUserID != userIDString {
		c.JSON(
			http.StatusForbidden,
			gin.H{
				"success": false,
				"error":   "Kamu tidak memiliki akses ke pesanan ini.",
			},
		)
		return
	}

	// =================================================
	// 9. CHECK PAYMENT STATUS
	// =================================================

	currentPaymentStatus := strings.ToUpper(
		strings.TrimSpace(
			order.PaymentStatus,
		),
	)

	// =================================================
	// 9A. ALREADY PAID
	// =================================================
	//
	// 🔧 DIPERBAIKI:
	//
	// Kalau frontend melakukan request dua kali,
	// jangan melakukan pembayaran ulang.
	//
	// HTTP 409 = Conflict.
	//
	// Payment.tsx kamu sudah menangani 409 dengan
	// reload order.
	//
	// =================================================

	if currentPaymentStatus == models.PaymentStatusPaid ||
		currentPaymentStatus == "SUCCESS" {

		c.JSON(
			http.StatusConflict,
			gin.H{
				"success": false,
				"error":   "Pesanan ini sudah dibayar.",
				"order":   order,
			},
		)
		return
	}

	// =================================================
	// 9B. FAILED PAYMENT
	// =================================================

	if currentPaymentStatus == models.PaymentStatusFailed {

		c.JSON(
			http.StatusConflict,
			gin.H{
				"success": false,
				"error":   "Pembayaran sebelumnya gagal.",
				"order":   order,
			},
		)
		return
	}

	// =================================================
	// 9C. CANCELLED PAYMENT
	// =================================================

	if currentPaymentStatus == "CANCELLED" ||
		currentPaymentStatus == "CANCELED" {

		c.JSON(
			http.StatusConflict,
			gin.H{
				"success": false,
				"error":   "Pembayaran pesanan ini sudah dibatalkan.",
				"order":   order,
			},
		)
		return
	}

	// =================================================
	// 10. CHECK ORDER STATUS
	// =================================================
	//
	// 🔧 DIPERTAHANKAN:
	//
	// Order yang sudah dibatalkan tidak boleh dibayar.
	//
	// =================================================

	currentOrderStatus := strings.ToUpper(
		strings.TrimSpace(
			order.Status,
		),
	)

	if currentOrderStatus == strings.ToUpper(
		models.OrderStatusCancelled,
	) {

		c.JSON(
			http.StatusConflict,
			gin.H{
				"success": false,
				"error":   "Pesanan yang sudah dibatalkan tidak dapat dibayar.",
				"order":   order,
			},
		)
		return
	}

	// =================================================
	// 11. UPDATE PAYMENT
	// =================================================
	//
	// 🔧 BAGIAN PALING PENTING
	//
	// HANYA update:
	//
	// payment_method
	// payment_status
	//
	// JANGAN mengubah:
	//
	// order.Status
	//
	// Karena pembayaran berhasil bukan berarti
	// pesanan sudah selesai.
	//
	// Flow:
	//
	// payment_status = PAID
	//
	// order.Status = status sebelumnya
	//
	// Contoh:
	//
	// payment_status = PAID
	// order.Status    = WAITING_CONFIRMATION
	//
	// Seller kemudian yang memproses order.
	//
	// =================================================

	order.PaymentMethod = paymentMethod

	// Database menyimpan status pembayaran
	// dalam format constant dari models.
	order.PaymentStatus = models.PaymentStatusPaid

	// =================================================
	// 12. SAVE
	// =================================================
	//
	// 🔧 DIPERBAIKI:
	//
	// Kita menggunakan Updates hanya untuk field
	// pembayaran.
	//
	// Ini lebih aman daripada:
	//
	// db.Save(&order)
	//
	// karena Save() menyimpan seluruh object Order.
	//
	// Dengan Updates(), field order lainnya tidak
	// ikut berubah secara tidak sengaja.
	//
	// =================================================

	result := db.
		Model(&models.Order{}).
		Where("id = ?", orderID).
		Updates(map[string]interface{}{
			"payment_method": paymentMethod,
			"payment_status": models.PaymentStatusPaid,
		})

	if result.Error != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"error":   "Gagal menyimpan pembayaran.",
				"details": result.Error.Error(),
			},
		)
		return
	}

	// =================================================
	// 12A. VERIFY UPDATE
	// =================================================
	//
	// 🔧 DITAMBAHKAN:
	//
	// Pastikan benar-benar ada row yang berubah.
	//
	// =================================================

	if result.RowsAffected == 0 {

		c.JSON(
			http.StatusNotFound,
			gin.H{
				"success": false,
				"error":   "Pesanan gagal diperbarui.",
			},
		)
		return
	}

	// =================================================
	// 12B. RELOAD ORDER
	// =================================================
	//
	// 🔧 DITAMBAHKAN:
	//
	// Setelah UPDATE, ambil ulang order dari database.
	//
	// Jadi response ke Payment.tsx benar-benar
	// menggunakan data terbaru.
	//
	// =================================================

	if err := db.
		Where("id = ?", orderID).
		First(&order).
		Error; err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"error":   "Pembayaran berhasil disimpan, tetapi data pesanan gagal dimuat ulang.",
				"details": err.Error(),
			},
		)
		return
	}

	// =================================================
	// 13. RESPONSE
	// =================================================
	//
	// Response:
	//
	// {
	//     "success": true,
	//     "message": "Pembayaran berhasil diproses.",
	//     "order": {
	//         ...
	//         "payment_status": "PAID"
	//     }
	// }
	//
	// Payment.tsx bisa mengambil order terbaru.
	//
	// =================================================

	c.JSON(
		http.StatusOK,
		gin.H{
			"success": true,
			"message": "Pembayaran berhasil diproses.",
			"order":   order,
		},
	)
}

// =====================================================
// NORMALIZE PAYMENT METHOD
// =====================================================
//
// Menerima:
//
// qris
// QRIS
//
// bank_transfer
// bank-transfer
// bank transfer
// transfer_bank
// transfer bank
// banktransfer
//
// virtual_account
// virtual-account
// virtual account
// virtualaccount
// va
//
// =====================================================

func normalizePaymentMethod(
	method string,
) string {

	normalized := strings.ToLower(
		strings.TrimSpace(method),
	)

	normalized = strings.ReplaceAll(
		normalized,
		"-",
		"_",
	)

	switch normalized {

	case models.PaymentMethodQRIS:

		return models.PaymentMethodQRIS

	case models.PaymentMethodBankTransfer,
		"bank transfer",
		"transfer_bank",
		"transfer bank",
		"banktransfer":

		return models.PaymentMethodBankTransfer

	case models.PaymentMethodVirtualAccount,
		"virtual account",
		"virtualaccount",
		"va":

		return models.PaymentMethodVirtualAccount

	default:

		return ""
	}
}

// =====================================================
// STRING HELPER
// =====================================================
//
// Bisa menerima:
//
// - string
// - uuid.UUID
// - *uuid.UUID
// - nil
//
// =====================================================

func toString(
	value interface{},
) string {

	switch v := value.(type) {

	case string:

		return strings.TrimSpace(v)

	case uuid.UUID:

		return v.String()

	case *uuid.UUID:

		if v == nil {
			return ""
		}

		return v.String()

	default:

		return ""
	}
}
