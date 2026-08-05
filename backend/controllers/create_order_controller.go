package controllers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/models"
)

/* =====================================================
   REQUEST
===================================================== */

type CreateOrderItemRequest struct {
	MenuID   string `json:"menu_id" binding:"required"`
	Quantity int    `json:"quantity" binding:"required,min=1"`
}

type CreateOrderRequest struct {
	// user_id sengaja tetap diterima agar kompatibel dengan
	// frontend lama, tetapi TIDAK dipercaya.
	UserID string `json:"user_id"`

	SellerID      string                   `json:"seller_id" binding:"required"`
	PaymentMethod string                   `json:"payment_method" binding:"required"`
	Items         []CreateOrderItemRequest `json:"items" binding:"required,min=1"`
}

/* =====================================================
   CREATE CUSTOMER ORDER
===================================================== */

// POST /api/v1/orders
//
// AUTH REQUIRED
//
// User ID utama diambil dari JWT middleware.
//
// =====================================================

func CreateOrder(c *gin.Context) {

	/* =================================================
	   USER ID FROM JWT
	================================================= */

	userID := strings.TrimSpace(
		c.GetString("user_id"),
	)

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

	/* =================================================
	   VALIDATE USER UUID
	================================================= */

	if _, err := uuid.Parse(userID); err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "user_id dari token tidak valid",
			},
		)

		return
	}

	/* =================================================
	   REQUEST BODY
	================================================= */

	var req CreateOrderRequest

	if err := c.ShouldBindJSON(&req); err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Data order tidak valid",
				"error":   err.Error(),
			},
		)

		return
	}

	/* =================================================
	   SELLER UUID
	================================================= */

	req.SellerID = strings.TrimSpace(req.SellerID)

	if _, err := uuid.Parse(req.SellerID); err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "seller_id harus berupa UUID yang valid",
			},
		)

		return
	}

	/* =================================================
	   PAYMENT METHOD
	================================================= */

	paymentMethod := strings.ToLower(
		strings.TrimSpace(req.PaymentMethod),
	)

	switch paymentMethod {

	case models.PaymentMethodQRIS:
	case models.PaymentMethodBankTransfer:
	case models.PaymentMethodVirtualAccount:

	default:

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Metode pembayaran tidak valid",
				"details": "Gunakan qris, bank_transfer, atau virtual_account",
			},
		)

		return
	}

	/* =================================================
	   ITEMS
	================================================= */

	if len(req.Items) == 0 {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Order harus memiliki minimal satu menu",
			},
		)

		return
	}

	/* =================================================
	   DATABASE TRANSACTION
	================================================= */

	tx := database.DB.Begin()

	if tx.Error != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal memulai transaksi database",
				"error":   tx.Error.Error(),
			},
		)

		return
	}

	/* =================================================
	   VERIFY SELLER
	================================================= */

	var seller models.SellerProfile

	if err := tx.
		Where("seller_id = ?", req.SellerID).
		First(&seller).
		Error; err != nil {

		tx.Rollback()

		c.JSON(
			http.StatusNotFound,
			gin.H{
				"success": false,
				"message": "Seller tidak ditemukan",
				"error":   err.Error(),
			},
		)

		return
	}

	/* =================================================
	   CREATE ORDER ID
	================================================= */

	orderID := uuid.New().String()

	/* =================================================
	   ORDER NUMBER
	================================================= */

	orderNumber := fmt.Sprintf(
		"ORD-%s-%s",
		time.Now().Format("20060102150405"),
		strings.ToUpper(
			strings.ReplaceAll(
				orderID[:8],
				"-",
				"",
			),
		),
	)

	/* =================================================
	   CREATE ORDER
	================================================= */

	order := models.Order{
		ID:            orderID,
		OrderNumber:   orderNumber,
		UserID:        userID,
		SellerID:      req.SellerID,
		Status:        models.OrderStatusWaitingConfirmation,
		PaymentStatus: models.PaymentStatusPending,
		PaymentMethod: paymentMethod,
		TotalAmount:   0,
	}

	if err := tx.Create(&order).Error; err != nil {

		tx.Rollback()

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal membuat order",
				"error":   err.Error(),
			},
		)

		return
	}

	/* =================================================
	   CREATE ORDER ITEMS
	================================================= */

	var totalAmount float64

	for _, item := range req.Items {

		menuID := strings.TrimSpace(item.MenuID)

		if _, err := uuid.Parse(menuID); err != nil {

			tx.Rollback()

			c.JSON(
				http.StatusBadRequest,
				gin.H{
					"success": false,
					"message": "menu_id harus berupa UUID yang valid",
					"details": menuID,
				},
			)

			return
		}

		if item.Quantity <= 0 {

			tx.Rollback()

			c.JSON(
				http.StatusBadRequest,
				gin.H{
					"success": false,
					"message": "Quantity menu harus lebih dari 0",
				},
			)

			return
		}

		/* =============================================
		   GET MENU
		============================================= */

		var menu models.Menu

		if err := tx.
			Where(
				"id = ? AND seller_id = ?",
				menuID,
				req.SellerID,
			).
			First(&menu).
			Error; err != nil {

			tx.Rollback()

			c.JSON(
				http.StatusNotFound,
				gin.H{
					"success": false,
					"message": "Menu tidak ditemukan",
					"details": menuID,
				},
			)

			return
		}

		/* =============================================
		   PRICE
		============================================= */

		price := float64(menu.Price)

		itemTotal :=
			price * float64(item.Quantity)

		totalAmount += itemTotal

		/* =============================================
		   ORDER ITEM
		============================================= */

		orderItem := models.OrderItem{
			ID:       uuid.New().String(),
			OrderID:  order.ID,
			MenuID:   menuID,
			MenuName: menu.Name,
			Quantity: item.Quantity,
			Price:    price,
		}

		if err := tx.Create(&orderItem).Error; err != nil {

			tx.Rollback()

			c.JSON(
				http.StatusInternalServerError,
				gin.H{
					"success": false,
					"message": "Gagal membuat item order",
					"error":   err.Error(),
				},
			)

			return
		}
	}

	/* =================================================
	   UPDATE TOTAL
	================================================= */

	if err := tx.
		Model(&order).
		Update("total_amount", totalAmount).
		Error; err != nil {

		tx.Rollback()

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal menghitung total order",
				"error":   err.Error(),
			},
		)

		return
	}

	/* =================================================
	   COMMIT
	================================================= */

	if err := tx.Commit().Error; err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal menyimpan order",
				"error":   err.Error(),
			},
		)

		return
	}

	/* =================================================
	   RELOAD ORDER
	================================================= */

	if err := database.DB.
		Preload("Items").
		Where("id = ?", order.ID).
		First(&order).
		Error; err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Order berhasil dibuat tetapi gagal mengambil detail order",
				"error":   err.Error(),
			},
		)

		return
	}

	/* =================================================
	   RESPONSE
	================================================= */

	c.JSON(
		http.StatusCreated,
		gin.H{
			"success": true,
			"message": "Pesanan berhasil dibuat",
			"data":    order,
		},
	)
}
