package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/krisn4novianto/wartegkita/backend/controllers"
)

// =====================================
// REGISTER ALL ROUTES
// =====================================

func Register(router *gin.Engine) {

	api := router.Group("/api/v1")

	// =====================================
	// HEALTH
	// =====================================

	api.GET(
		"/health",
		func(c *gin.Context) {

			c.JSON(
				http.StatusOK,
				gin.H{
					"status":  "ok",
					"service": "wartegkita-api",
				},
			)

		},
	)

	// =====================================
	// AUTH
	// =====================================

	auth := api.Group("/auth")

	auth.POST(
		"/register",
		register,
	)

	auth.POST(
		"/login",
		login,
	)

	// =====================================
	// ADDRESS
	// =====================================

	RegisterUserRoutes(api)

	// =====================================
	// WILAYAH
	// =====================================

	CreateWilayahRoutes(api)

	// =====================================
	// SELLER
	// =====================================

	sellers := api.Group("/sellers")

	// =====================================
	// LIST SELLER
	// =====================================

	sellers.GET(
		"",
		listSellers,
	)

	// =====================================
	// SELLER DASHBOARD
	// =====================================

	sellers.GET(
		"/dashboard/:seller_id",
		controllers.SellerDashboard,
	)

	// =====================================
	// SELLER PROFILE
	// =====================================

	sellers.GET(
		"/:seller_id/profile",
		controllers.GetSellerProfile,
	)

	sellers.PUT(
		"/:seller_id/profile",
		controllers.UpdateSellerProfile,
	)

	// =====================================
	// SELLER MENU
	// =====================================

	sellers.GET(
		"/:seller_id/menus",
		controllers.GetMenuController,
	)

	// =====================================
	// DETAIL SELLER
	// TARUH PALING BAWAH
	// karena memakai :seller_id
	// =====================================

	sellers.GET(
		"/:seller_id",
		getSeller,
	)

	// =====================================
	// MENU
	// =====================================

	menus := api.Group("/menus")

	// GET MENU

	menus.GET(
		"",
		controllers.GetMenuController,
	)

	// CREATE MENU

	menus.POST(
		"",
		controllers.CreateMenuController,
	)

	// UPDATE MENU

	menus.PUT(
		"/:id",
		controllers.UpdateMenuController,
	)

	// DELETE MENU

	menus.DELETE(
		"/:id",
		controllers.DeleteMenuController,
	)

	// =====================================
	// ORDER
	// =====================================

	orders := api.Group("/orders")

	orders.POST(
		"",
		createOrder,
	)

	orders.GET(
		"",
		listOrders,
	)

	orders.GET(
		"/:id",
		getOrder,
	)

	orders.PUT(
		"/:id/pay",
		payOrder,
	)

	orders.PUT(
		"/:id/status",
		updateOrderStatus,
	)

}
