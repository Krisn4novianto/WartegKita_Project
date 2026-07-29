package routes

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/krisn4novianto/wartegkita/backend/database"
	sellerdb "github.com/krisn4novianto/wartegkita/backend/database/seller"
	"github.com/krisn4novianto/wartegkita/backend/middleware"
	"github.com/krisn4novianto/wartegkita/backend/models"
	"gorm.io/gorm"
)

// =====================================
// AUTH
// =====================================

// register godoc
// @Summary      Register User
// @Description  Register a new customer account
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        body body routes.RegisterBody true "Register payload"
// @Success      201 {object} map[string]string
// @Router       /auth/register [post]
func register(c *gin.Context) {

	var body struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"error": "Format data tidak valid: " + err.Error(),
			},
		)
		return
	}

	if body.Name == "" || body.Email == "" || body.Password == "" {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"error": "Nama, email, dan password wajib diisi",
			},
		)
		return
	}

	user, err := database.CreateUser(body.Name, body.Email, body.Password)

	if err != nil {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"error": err.Error(),
			},
		)
		return
	}

	c.JSON(
		http.StatusCreated,
		gin.H{
			"message": "Registrasi berhasil",
			"data":    user,
		},
	)

}

// login godoc
// @Summary      Login User
// @Description  Authenticate with email and password. Returns a token and user profile data.
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        body body routes.LoginBody true "Login payload"
// @Success      200 {object} map[string]interface{}
// @Router       /auth/login [post]
func login(c *gin.Context) {

	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"error": "Format data tidak valid: " + err.Error(),
			},
		)
		return
	}

	user, err := database.AuthenticateUser(body.Email, body.Password)

	if err != nil {
		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"error": err.Error(),
			},
		)
		return
	}

	token, err := middleware.GenerateToken(user.ID)

	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"error": "Gagal membuat token: " + err.Error(),
			},
		)
		return
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"message": "Login berhasil",
			"token":   token,
			"data":    user,
		},
	)

}

// =====================================
// SELLER
// =====================================

// listSellers godoc
// @Summary      List All Sellers
// @Description  Returns all registered warteg seller profiles
// @Tags         Sellers
// @Produce      json
// @Success      200 {array}  sellerdb.CustomerSeller
// @Failure      500 {object} map[string]string
// @Router       /sellers [get]
func listSellers(c *gin.Context) {

	sellers, err := sellerdb.GetAllProfiles()
	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"error": err.Error(),
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		sellers,
	)

}

// getSeller godoc
// @Summary      Get Seller Detail
// @Description  Returns the full profile detail of a specific seller
// @Tags         Sellers
// @Produce      json
// @Param        seller_id path int true "Seller ID"
// @Success      200 {object} map[string]interface{}
// @Failure      404 {object} map[string]string
// @Router       /sellers/{seller_id} [get]
func getSeller(c *gin.Context) {

	sellerID := c.Param("seller_id")

	profile, err := sellerdb.GetProfile(sellerID)
	if err != nil {

		c.JSON(
			http.StatusNotFound,
			gin.H{
				"error": "seller tidak ditemukan",
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"id":          profile.SellerID,
			"store_name":  profile.NamaWarteg,
			"description": profile.Deskripsi,
			"address":     profile.Alamat,
			"owner":       profile.NamaPemilik,
			"phone":       profile.NomorHP,

			// sementara sampai ada tabel rating & gambar
			"rating":      0,
			"distance_km": 0,
			"image":       "",
		},
	)

}

// =====================================
// MENU
// =====================================

func createMenu(c *gin.Context) {

	c.JSON(
		201,
		gin.H{
			"message": "menu created",
		},
	)

}

// createOrder godoc
// @Summary      Create Order
// @Description  Place a new order. Validates menus, calculates total, inserts in a single DB transaction.
// @Tags         Orders
// @Accept       json
// @Produce      json
// @Param        body body routes.CreateOrderBody true "Order payload"
// @Success      201 {object} map[string]interface{}
// @Failure      400 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /orders [post]
func createOrder(c *gin.Context) {
	fmt.Println("========== CREATE ORDER ==========")

	var body struct {
		UserID        string `json:"user_id"`
		SellerID      string `json:"seller_id"`
		Items         []struct {
			MenuID   interface{} `json:"menu_id"`
			Quantity int         `json:"quantity"`
		} `json:"items"`
		PaymentMethod string `json:"payment_method"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if body.UserID == "" {
		body.UserID = c.GetString("user_id")
	}

	if len(body.Items) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "order harus memiliki minimal 1 menu"})
		return
	}

	for _, item := range body.Items {
		if item.Quantity <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "quantity harus lebih dari 0"})
			return
		}
	}

	orderNumber := "ORD-" + strconv.FormatInt(time.Now().Unix(), 10)
	orderIDObj, err := uuid.NewV7()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	orderID := orderIDObj.String()

	var total float64
	var orderItems []models.OrderItem

	err = database.DB.Transaction(func(tx *gorm.DB) error {
		for _, item := range body.Items {
			menuIDStr := fmt.Sprintf("%v", item.MenuID)

			var menu models.Menu
			if err := tx.Where("id = ?", menuIDStr).First(&menu).Error; err != nil {
				return fmt.Errorf("menu tidak ditemukan: %s", menuIDStr)
			}

			total += menu.Price * float64(item.Quantity)

			itemIDObj, _ := uuid.NewV7()
			orderItems = append(orderItems, models.OrderItem{
				ID:       itemIDObj.String(),
				OrderID:  orderID,
				MenuID:   menuIDStr,
				MenuName: menu.Name,
				Quantity: item.Quantity,
				Price:    menu.Price,
			})
		}

		newOrder := models.Order{
			ID:            orderID,
			OrderNumber:   orderNumber,
			UserID:        body.UserID,
			SellerID:      body.SellerID,
			Status:        "WAITING_CONFIRMATION",
			PaymentStatus: "PENDING",
			TotalAmount:   total,
			PaymentMethod: body.PaymentMethod,
			Items:         orderItems,
		}

		return tx.Create(&newOrder).Error
	})

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":             orderID,
		"order_number":   orderNumber,
		"total_amount":   total,
		"payment_status": "PENDING",
		"status":         "WAITING_CONFIRMATION",
		"message":        "order created",
	})
}

// =====================================
// LIST ORDERS
// =====================================

func listOrders(c *gin.Context) {
	var orders []models.Order
	if err := database.DB.Order("created_at DESC").Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, orders)
}

// =====================================
// GET ORDER
// =====================================

func getOrder(c *gin.Context) {
	id := c.Param("id")

	var order models.Order
	if err := database.DB.Preload("Items").Where("id = ?", id).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "order tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, order)
}

// =====================================
// PAYMENT
// =====================================

func payOrder(c *gin.Context) {
	id := c.Param("id")

	err := database.DB.Model(&models.Order{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":         "PAID",
		"payment_status": "PAID",
		"updated_at":     time.Now(),
	}).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "payment success",
		"order_id": id,
	})
}

// =====================================
// UPDATE STATUS
// =====================================

func updateOrderStatus(c *gin.Context) {
	id := c.Param("id")

	var body struct {
		Status string `json:"status"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := database.DB.Model(&models.Order{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":     body.Status,
		"updated_at": time.Now(),
	}).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "status updated",
		"status":  body.Status,
	})
}


// =====================================
// SWAGGER DOC TYPES (not used in logic)
// =====================================

// RegisterBody is used for swagger docs only
type RegisterBody struct {
	Name     string `json:"name"     example:"Budi Santoso"`
	Email    string `json:"email"    example:"budi@example.com"`
	Password string `json:"password" example:"secret123"`
}

// LoginBody is used for swagger docs only
type LoginBody struct {
	Email    string `json:"email"    example:"budi@example.com"`
	Password string `json:"password" example:"secret123"`
}

// CreateOrderBody is used for swagger docs only
type CreateOrderBody struct {
	UserID        string           `json:"user_id"        example:"018f4a12-89cd-7b1e-9a2c-3f4e56789abc"`
	SellerID      string           `json:"seller_id"      example:"018f4a12-89cd-7b1e-9a2c-3f4e56789def"`
	PaymentMethod string           `json:"payment_method" example:"CASH"`
	Items         []OrderItemInput `json:"items"`
}

// OrderItemInput is used for swagger docs only
type OrderItemInput struct {
	MenuID   string `json:"menu_id"  example:"018f4a12-89cd-7b1e-9a2c-3f4e56789ghi"`
	Quantity int    `json:"quantity" example:"2"`
}

// UpdateStatusBody is used for swagger docs only
type UpdateStatusBody struct {
	Status string `json:"status" example:"CONFIRMED" enums:"WAITING_CONFIRMATION,CONFIRMED,COOKING,READY,DELIVERED,CANCELLED"`
}
