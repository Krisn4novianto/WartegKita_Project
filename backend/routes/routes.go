package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/krisn4novianto/wartegkita/backend/controllers"
	"github.com/krisn4novianto/wartegkita/backend/middleware"
)

// =====================================================
// REGISTER ALL ROUTES
// =====================================================

func Register(router *gin.Engine) {

	// =================================================
	// STATIC FILES
	// =================================================

	router.Static(
		"/uploads",
		"./uploads",
	)

	// =================================================
	// API V1
	// =================================================

	api := router.Group("/api/v1")

	// =================================================
	// AUTH
	// =================================================

	RegisterAuthRoutes(api)

	// =================================================
	// HEALTH
	// =================================================

	api.GET(
		"/health",
		func(c *gin.Context) {
			c.JSON(
				http.StatusOK,
				gin.H{
					"status":  "ok",
					"message": "WartegKita API is running",
				},
			)
		},
	)

	// =================================================
	// USERS
	// =================================================

	RegisterUserRoutes(api)

	// =================================================
	// SELLERS
	// =================================================

	sellers := api.Group("/sellers")

	// =================================================
	// PUBLIC SELLER LIST
	//
	// GET /api/v1/sellers
	// =================================================

	sellers.GET(
		"",
		controllers.GetSellers,
	)

	// =================================================
	// SELLER DASHBOARD
	//
	// GET /api/v1/sellers/dashboard/:seller_id
	//
	// AUTH REQUIRED
	// =================================================

	sellers.GET(
		"/dashboard/:seller_id",
		middleware.AuthMiddleware(),
		controllers.SellerDashboard,
	)

	// =================================================
	// SELLER PROFILE
	//
	// GET /api/v1/sellers/:seller_id/profile
	//
	// AUTH REQUIRED
	// =================================================

	sellers.GET(
		"/:seller_id/profile",
		middleware.AuthMiddleware(),
		controllers.GetSellerProfile,
	)

	// =================================================
	// UPDATE SELLER PROFILE
	//
	// PUT /api/v1/sellers/:seller_id/profile
	//
	// AUTH REQUIRED
	// =================================================

	sellers.PUT(
		"/:seller_id/profile",
		middleware.AuthMiddleware(),
		controllers.UpdateSellerProfile,
	)

	// =================================================
	// SELLER ORDERS
	//
	// GET /api/v1/sellers/:seller_id/orders
	//
	// AUTH REQUIRED
	// =================================================

	sellers.GET(
		"/:seller_id/orders",
		middleware.AuthMiddleware(),
		controllers.GetSellerOrders,
	)

	// =================================================
	// SELLER DETAIL
	//
	// GET /api/v1/sellers/:seller_id
	//
	// PUBLIC
	// =================================================

	sellers.GET(
		"/:seller_id",
		controllers.GetCustomerSellerDetail,
	)

	// =================================================
	// MENUS
	// =================================================

	menus := api.Group("/menus")

	// =================================================
	// GET MENUS
	//
	// GET /api/v1/menus?seller_id=UUID
	//
	// PUBLIC
	// =================================================

	menus.GET(
		"",
		controllers.GetMenuController,
	)

	// =================================================
	// CREATE MENU
	//
	// POST /api/v1/menus
	//
	// AUTH REQUIRED
	// =================================================

	menus.POST(
		"",
		middleware.AuthMiddleware(),
		controllers.CreateMenuController,
	)

	// =================================================
	// UPDATE MENU
	//
	// PUT /api/v1/menus/:id
	//
	// AUTH REQUIRED
	// =================================================

	menus.PUT(
		"/:id",
		middleware.AuthMiddleware(),
		controllers.UpdateMenuController,
	)

	// =================================================
	// DELETE MENU
	//
	// DELETE /api/v1/menus/:id
	//
	// AUTH REQUIRED
	// =================================================

	menus.DELETE(
		"/:id",
		middleware.AuthMiddleware(),
		controllers.DeleteMenuController,
	)

	// =====================================================
	// ORDERS
	// =====================================================

	orders := api.Group("/orders")

	// =====================================================
	// CREATE CUSTOMER ORDER
	//
	// POST /api/v1/orders
	//
	// AUTH REQUIRED
	//
	// User ID diambil dari JWT middleware.
	// =====================================================

	orders.POST(
		"",
		middleware.AuthMiddleware(),
		controllers.CreateOrder,
	)

	// =====================================================
	// GET CUSTOMER ORDERS
	//
	// GET /api/v1/orders
	//
	// AUTH REQUIRED
	//
	// User ID diambil dari JWT middleware.
	// =====================================================

	orders.GET(
		"",
		middleware.AuthMiddleware(),
		controllers.GetCustomerOrders,
	)

	// =====================================================
	// GET SINGLE ORDER
	//
	// GET /api/v1/orders/:order_id
	//
	// AUTH REQUIRED
	//
	// Digunakan oleh:
	// Payment.tsx
	// OrderDetail.tsx
	// =====================================================

	orders.GET(
		"/:order_id",
		middleware.AuthMiddleware(),
		controllers.GetOrder,
	)

	// =====================================================
	// PAY ORDER
	//
	// PUT /api/v1/orders/:order_id/pay
	//
	// AUTH REQUIRED
	//
	// Digunakan oleh:
	//
	// Payment.tsx
	//
	// Frontend:
	//
	// api.put(
	//     `/orders/${orderId}/pay`,
	//     {
	//         payment_method: paymentMethod,
	//     }
	// )
	//
	// =====================================================

	orders.PUT(
		"/:order_id/pay",
		middleware.AuthMiddleware(),
		controllers.PayOrder,
	)

	// =====================================================
	// UPDATE ORDER STATUS
	//
	// PATCH /api/v1/orders/:order_id/status
	//
	// AUTH REQUIRED
	//
	// Digunakan untuk perubahan status order:
	//
	// WAITING_CONFIRMATION
	// CONFIRMED
	// PREPARING
	// READY
	// COMPLETED
	// CANCELLED
	//
	// =====================================================

	orders.PATCH(
		"/:order_id/status",
		middleware.AuthMiddleware(),
		controllers.UpdateOrderStatus,
	)
}
