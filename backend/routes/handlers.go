package routes

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/krisn4novianto/wartegkita/backend/database"

	sellerdb "github.com/krisn4novianto/wartegkita/backend/database/seller"
)

// =====================================
// AUTH
// =====================================

func register(c *gin.Context) {

	c.JSON(
		http.StatusCreated,
		gin.H{
			"message": "register endpoint ready",
		},
	)

}

func login(c *gin.Context) {

	c.JSON(
		http.StatusOK,
		gin.H{
			"message": "login endpoint ready",
			"token":   "development-token",
		},
	)

}

// =====================================
// SELLER
// =====================================
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

func createOrder(c *gin.Context) {

	fmt.Println("========== CREATE ORDER ==========")

	var dbName string

	err := database.SellerDB.QueryRow(
		"SELECT current_database()",
	).Scan(&dbName)

	fmt.Println("SELLER DB YANG DIPAKAI:", dbName)

	var body struct {
		UserID   int `json:"user_id"`
		SellerID int `json:"seller_id"`

		Items []struct {
			MenuID   int `json:"menu_id"`
			Quantity int `json:"quantity"`
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
		MenuID   int
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

		fmt.Println("MENU ID REQUEST:", item.MenuID)

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
			item.MenuID,
		).Scan(
			&menuName,
			&price,
		)

		if err != nil {

			fmt.Println(
				"MENU TIDAK ADA:",
				item.MenuID,
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
			MenuID:   item.MenuID,
			MenuName: menuName,
			Quantity: item.Quantity,
			Price:    price,
		})
	}

	// ==========================
	// INSERT ORDER
	// ==========================

	var orderID int

	err = tx.QueryRow(
		`
		INSERT INTO orders
		(
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
			'WAITING_CONFIRMATION',
			'PENDING',
			$4,
			$5
		)
		RETURNING id
		`,
		orderNumber,
		body.UserID,
		body.SellerID,
		total,
		body.PaymentMethod,
	).Scan(&orderID)

	if err != nil {

		tx.Rollback()

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})

		return
	}

	// ==========================
	// INSERT ORDER ITEMS
	// ==========================

	for _, item := range orderItems {

		_, err := tx.Exec(
			`
			INSERT INTO order_items
			(
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
			$5
			)
			`,
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
			id            int
			orderNumber   string
			userID        int
			sellerID      int
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

func getOrder(c *gin.Context) {

	id := c.Param("id")

	var order struct {
		ID int

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
			menuID   int
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
