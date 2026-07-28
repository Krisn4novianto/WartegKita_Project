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

	var dbName string

	err := database.SellerDB.QueryRow(
		"SELECT current_database()",
	).Scan(&dbName)

	fmt.Println("SELLER DB YANG DIPAKAI:", dbName)

	var body struct {
		UserID   string `json:"user_id"`
		SellerID string `json:"seller_id"`

		Items []struct {
			MenuID   interface{} `json:"menu_id"`
			Quantity int         `json:"quantity"`
		} `json:"items"`

		PaymentMethod string `json:"payment_method"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {

		fmt.Printf("BODY %+v\n", body)

		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})

		return
	}

	// Fallback for user_id from token context if not passed in body
	if body.UserID == "" {
		body.UserID = c.GetString("user_id")
	}

	if len(body.Items) == 0 {

		c.JSON(http.StatusBadRequest, gin.H{
			"error": "order harus memiliki minimal 1 menu",
		})

		return
	}

	for _, item := range body.Items {

		if item.Quantity <= 0 {

			c.JSON(http.StatusBadRequest, gin.H{
				"error": "quantity harus lebih dari 0",
			})

			return
		}
	}

	orderNumber := "ORD-" + strconv.FormatInt(time.Now().Unix(), 10)

	tx, err := database.DB.Begin()

	if err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})

		return
	}

	type OrderItem struct {
		MenuID   string
		MenuName string
		Quantity int
		Price    float64
	}

	var (
		orderItems []OrderItem
		total      float64
	)

	// ==========================
	// HITUNG TOTAL
	// ==========================

	for _, item := range body.Items {

		menuIDStr := fmt.Sprintf("%v", item.MenuID)
		fmt.Println("MENU ID REQUEST:", menuIDStr)

		var (
			menuName string
			price    float64
		)

		err := database.SellerDB.QueryRow(
			`
SELECT
    name,
    price
FROM menus
WHERE id=$1
`,
			menuIDStr,
		).Scan(
			&menuName,
			&price,
		)

		if err != nil {

			fmt.Println(
				"MENU TIDAK ADA:",
				menuIDStr,
				err,
			)

			tx.Rollback()

			c.JSON(http.StatusBadRequest, gin.H{
				"error": "menu tidak ditemukan",
			})

			return
		}

		fmt.Println(
			"MENU DITEMUKAN:",
			menuName,
			price,
		)

		total += price * float64(item.Quantity)

		orderItems = append(orderItems, OrderItem{
			MenuID:   menuIDStr,
			MenuName: menuName,
			Quantity: item.Quantity,
			Price:    price,
		})
	}

	// ==========================
	// INSERT ORDER (UUID v7)
	// ==========================

	orderIDObj, err := uuid.NewV7()
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	orderID := orderIDObj.String()

	_, err = tx.Exec(
		`
		INSERT INTO orders
		(
			id,
			order_number,
			user_id,
			seller_id,
			status,
			payment_status,
			total_amount,
			payment_method
		)
		VALUES
		(
			$1,
			$2,
			$3,
			$4,
			'WAITING_CONFIRMATION',
			'PENDING',
			$5,
			$6
		)
		`,
		orderID,
		orderNumber,
		body.UserID,
		body.SellerID,
		total,
		body.PaymentMethod,
	)

	if err != nil {

		tx.Rollback()

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})

		return
	}

	// ==========================
	// INSERT ORDER ITEMS (UUID v7)
	// ==========================

	for _, item := range orderItems {

		itemIDObj, _ := uuid.NewV7()

		_, err := tx.Exec(
			`
			INSERT INTO order_items
			(
			id,
			order_id,
			menu_id,
			menu_name,
			quantity,
			price
			)
			VALUES
			(
			$1,
			$2,
			$3,
			$4,
			$5,
			$6
			)
			`,
			itemIDObj.String(),
			orderID,
			item.MenuID,
			item.MenuName,
			item.Quantity,
			item.Price,
		)

		if err != nil {

			tx.Rollback()

			c.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
			})

			return
		}
	}

	if err := tx.Commit(); err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})

		return
	}

	c.JSON(
		http.StatusCreated,
		gin.H{
			"id":             orderID,
			"order_number":   orderNumber,
			"total_amount":   total,
			"payment_status": "PENDING",
			"status":         "WAITING_CONFIRMATION",
			"message":        "order created",
		},
	)
}

// =====================================
// LIST ORDERS
// =====================================

// listOrders godoc
// @Summary      List All Orders
// @Description  Returns all orders sorted by creation date (newest first)
// @Tags         Orders
// @Produce      json
// @Success      200 {array}  map[string]interface{}
// @Failure      500 {object} map[string]string
// @Router       /orders [get]
func listOrders(c *gin.Context) {

	rows, err := database.DB.Query(`

		SELECT
			id,
			order_number,
			user_id,
			seller_id,
			status,
			payment_status,
			total_amount,
			payment_method,
			created_at

		FROM orders

		ORDER BY created_at DESC

	`)

	if err != nil {

		c.JSON(500, gin.H{
			"error": err.Error(),
		})

		return
	}

	defer rows.Close()

	var orders []gin.H

	for rows.Next() {

		var (
			id            string
			orderNumber   string
			userID        string
			sellerID      string
			status        string
			paymentStatus string
			total         float64
			paymentMethod string
			createdAt     time.Time
		)

		if err := rows.Scan(
			&id,
			&orderNumber,
			&userID,
			&sellerID,
			&status,
			&paymentStatus,
			&total,
			&paymentMethod,
			&createdAt,
		); err != nil {

			c.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
			})

			return
		}

		orders = append(orders, gin.H{
			"id":             id,
			"order_number":   orderNumber,
			"user_id":        userID,
			"seller_id":      sellerID,
			"status":         status,
			"payment_status": paymentStatus,
			"total_amount":   total,
			"payment_method": paymentMethod,
			"created_at":     createdAt,
		})
	}

	// cek error setelah iterasi selesai
	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, orders)

}

// =====================================
// GET ORDER
// =====================================

// getOrder godoc
// @Summary      Get Order Detail
// @Description  Returns full detail of a specific order including its line items
// @Tags         Orders
// @Produce      json
// @Param        id path string true "Order ID (UUID)"
// @Success      200 {object} map[string]interface{}
// @Failure      404 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /orders/{id} [get]
func getOrder(c *gin.Context) {

	id := c.Param("id")

	var order struct {
		ID string

		Status string

		PaymentMethod string

		Total float64
	}

	err := database.DB.QueryRow(`
    SELECT
        id,
        status,
        payment_method,
        total_amount
    FROM orders
    WHERE id=$1
`, id).Scan(
		&order.ID,
		&order.Status,
		&order.PaymentMethod,
		&order.Total,
	)

	if err != nil {

		c.JSON(
			404,
			gin.H{
				"error": "order tidak ditemukan",
			},
		)

		return
	}

	rows, err := database.DB.Query(`
	SELECT
		menu_id,
		menu_name,
		quantity,
		price
	FROM order_items
	WHERE order_id=$1
`, id)

	if err != nil {

		c.JSON(500, gin.H{
			"error": err.Error(),
		})

		return
	}

	defer rows.Close()

	var items []gin.H

	for rows.Next() {

		var (
			menuID   string
			menuName string
			qty      int
			price    float64
		)

		if err := rows.Scan(
			&menuID,
			&menuName,
			&qty,
			&price,
		); err != nil {

			c.JSON(500, gin.H{
				"error": err.Error(),
			})

			return
		}

		items = append(items, gin.H{
			"menu_id":   menuID,
			"menu_name": menuName,
			"quantity":  qty,
			"price":     price,
			"subtotal":  price * float64(qty),
		})
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"id":             order.ID,
			"status":         order.Status,
			"payment_method": order.PaymentMethod,
			"total_amount":   order.Total,
			"items":          items,
		},
	)

}

// =====================================
// PAYMENT
// =====================================

// payOrder godoc
// @Summary      Pay Order
// @Description  Mark an order as paid. Updates both order status and payment_status to PAID.
// @Tags         Orders
// @Produce      json
// @Param        id path string true "Order ID (UUID)"
// @Success      200 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /orders/{id}/pay [put]
func payOrder(c *gin.Context) {

	id := c.Param("id")

	_, err := database.DB.Exec(`

		UPDATE orders

		SET
			status='PAID',
			payment_status='PAID',
			updated_at=CURRENT_TIMESTAMP

		WHERE id=$1

	`, id)

	if err != nil {

		c.JSON(500, gin.H{
			"error": err.Error(),
		})

		return
	}

	c.JSON(200, gin.H{

		"message": "payment success",

		"order_id": id,
	})

}

// =====================================
// UPDATE STATUS
// =====================================

// updateOrderStatus godoc
// @Summary      Update Order Status
// @Description  Update the seller-side order status (WAITING_CONFIRMATION, CONFIRMED, COOKING, READY, DELIVERED, CANCELLED)
// @Tags         Orders
// @Accept       json
// @Produce      json
// @Param        id   path string                      true "Order ID (UUID)"
// @Param        body body routes.UpdateStatusBody   true "Status payload"
// @Success      200 {object} map[string]string
// @Failure      400 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /orders/{id}/status [put]
func updateOrderStatus(c *gin.Context) {

	id := c.Param("id")

	var body struct {
		Status string `json:"status"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	_, err := database.DB.Exec(`

		UPDATE orders

		SET status=$1,

		updated_at=CURRENT_TIMESTAMP

		WHERE id=$2

	`,
		body.Status,
		id,
	)

	if err != nil {

		c.JSON(500, gin.H{
			"error": err.Error(),
		})

		return
	}

	c.JSON(200, gin.H{

		"message": "status updated",

		"status": body.Status,
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
