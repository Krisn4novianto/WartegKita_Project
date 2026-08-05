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
// GET CUSTOMER ORDER DETAIL
// =====================================================
//
// GET /api/v1/orders/:order_id
//
// Mengambil satu order milik user yang sedang login.
//
// AUTH REQUIRED
// =====================================================

func GetOrder(c *gin.Context) {

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
	// VALIDATE ORDER UUID
	// =================================================

	if _, err := uuid.Parse(orderID); err != nil {
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
	// GET USER ID FROM JWT
	// =================================================

	userIDValue, exists := c.Get(
		"user_id",
	)

	if !exists {
		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"message": "User ID tidak ditemukan dari token",
			},
		)
		return
	}

	userID, ok := userIDValue.(string)

	if !ok {
		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"message": "User ID dari token tidak valid",
			},
		)
		return
	}

	userID = strings.TrimSpace(
		userID,
	)

	if userID == "" {
		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"message": "User ID dari token kosong",
			},
		)
		return
	}

	// =================================================
	// VALIDATE USER UUID
	// =================================================

	if _, err := uuid.Parse(userID); err != nil {
		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"message": "User ID dari token bukan UUID yang valid",
			},
		)
		return
	}

	// =================================================
	// FIND ORDER
	// =================================================

	var order models.Order

	err := database.DB.
		Where(
			"id = ? AND user_id = ?",
			orderID,
			userID,
		).
		Preload("Items").
		First(&order).
		Error

	// =================================================
	// ORDER NOT FOUND
	// =================================================

	if err != nil {

		if errors.Is(
			err,
			gorm.ErrRecordNotFound,
		) {
			c.JSON(
				http.StatusNotFound,
				gin.H{
					"success": false,
					"message": "Pesanan tidak ditemukan",
				},
			)
			return
		}

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal mengambil detail pesanan",
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
			"data":    order,
		},
	)
}
