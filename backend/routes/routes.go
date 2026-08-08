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

	sellers.GET(
		"",
		controllers.GetSellers,
	)

	sellers.GET(
		"/dashboard/:seller_id",
		middleware.AuthMiddleware(),
		controllers.SellerDashboard,
	)

	sellers.GET(
		"/:seller_id/profile",
		middleware.AuthMiddleware(),
		controllers.GetSellerProfile,
	)

	sellers.PUT(
		"/:seller_id/profile",
		middleware.AuthMiddleware(),
		controllers.UpdateSellerProfile,
	)

	sellers.GET(
		"/:seller_id/orders",
		middleware.AuthMiddleware(),
		controllers.GetSellerOrders,
	)

	sellers.GET(
		"/:seller_id",
		controllers.GetCustomerSellerDetail,
	)

	// =================================================
	// MENUS
	// =================================================

	menus := api.Group("/menus")

	menus.GET(
		"",
		controllers.GetMenuController,
	)

	menus.POST(
		"",
		middleware.AuthMiddleware(),
		controllers.CreateMenuController,
	)

	menus.PUT(
		"/:id",
		middleware.AuthMiddleware(),
		controllers.UpdateMenuController,
	)

	menus.DELETE(
		"/:id",
		middleware.AuthMiddleware(),
		controllers.DeleteMenuController,
	)

	// =====================================================
	// ORDERS
	// =====================================================

	orders := api.Group("/orders")

	orders.POST(
		"",
		middleware.AuthMiddleware(),
		controllers.CreateOrder,
	)

	orders.GET(
		"",
		middleware.AuthMiddleware(),
		controllers.GetCustomerOrders,
	)

	orders.GET(
		"/:order_id",
		middleware.AuthMiddleware(),
		controllers.GetOrder,
	)

	orders.PUT(
		"/:order_id/pay",
		middleware.AuthMiddleware(),
		controllers.PayOrder,
	)

	orders.PATCH(
		"/:order_id/status",
		middleware.AuthMiddleware(),
		controllers.UpdateOrderStatus,
	)

	// =====================================================
	// CHAT
	// =====================================================

	ChatRoutes(api)
}
