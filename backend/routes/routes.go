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
	// CUSTOMER LOYALTY
	// =================================================
	//
	// Base:
	// /api/v1/users
	//
	// Features:
	// - Point balance
	// - Point history
	// - Missions
	// - Rewards
	// - User vouchers
	// - Redeem reward
	//
	// =================================================

	loyalty := api.Group("/users")

	// -------------------------------------------------
	// POINT BALANCE
	// -------------------------------------------------

	loyalty.GET(
		"/points",
		middleware.AuthMiddleware(),
		controllers.GetCustomerPoints,
	)

	// -------------------------------------------------
	// POINT HISTORY
	// -------------------------------------------------

	loyalty.GET(
		"/points/history",
		middleware.AuthMiddleware(),
		controllers.GetPointHistory,
	)

	// -------------------------------------------------
	// MISSIONS
	// -------------------------------------------------

	loyalty.GET(
		"/missions",
		middleware.AuthMiddleware(),
		controllers.GetUserMissions,
	)

	// -------------------------------------------------
	// REWARDS
	// -------------------------------------------------

	loyalty.GET(
		"/rewards",
		middleware.AuthMiddleware(),
		controllers.GetRewards,
	)

	// -------------------------------------------------
	// MY REWARDS / VOUCHERS
	// -------------------------------------------------

	loyalty.GET(
		"/rewards/my",
		middleware.AuthMiddleware(),
		controllers.GetUserRewards,
	)

	// -------------------------------------------------
	// REDEEM REWARD
	// -------------------------------------------------

	loyalty.POST(
		"/rewards/:reward_id/redeem",
		middleware.AuthMiddleware(),
		controllers.RedeemReward,
	)

	// =================================================
	// SELLERS
	// =================================================

	sellers := api.Group("/sellers")

	// -------------------------------------------------
	// GET ALL SELLERS
	// -------------------------------------------------

	sellers.GET(
		"",
		controllers.GetSellers,
	)

	// =================================================
	// SELLER DASHBOARD
	// =================================================

	sellers.GET(
		"/dashboard/:seller_id",
		middleware.AuthMiddleware(),
		controllers.SellerDashboard,
	)

	// =================================================
	// SELLER PROFILE
	// =================================================

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

	// =================================================
	// SELLER PROFILE PHOTO
	// =================================================

	sellers.POST(
		"/:seller_id/profile/photo",
		middleware.AuthMiddleware(),
		controllers.UploadSellerProfilePhoto,
	)

	sellers.DELETE(
		"/:seller_id/profile/photo",
		middleware.AuthMiddleware(),
		controllers.DeleteSellerProfilePhoto,
	)

	// =================================================
	// SELLER BANK / PAYOUT
	// =================================================

	sellers.POST(
		"/:seller_id/verify-bank",
		middleware.AuthMiddleware(),
		controllers.VerifySellerBank,
	)

	// =================================================
	// SELLER ORDERS
	// =================================================

	sellers.GET(
		"/:seller_id/orders",
		middleware.AuthMiddleware(),
		controllers.GetSellerOrders,
	)

	// =================================================
	// SELLER CAMPAIGNS
	// =================================================

	sellers.GET(
		"/:seller_id/campaigns",
		middleware.AuthMiddleware(),
		controllers.GetSellerCampaigns,
	)

	sellers.POST(
		"/:seller_id/campaigns",
		middleware.AuthMiddleware(),
		controllers.JoinCampaign,
	)

	// =================================================
	// SELLER CAMPAIGN WALLET
	// =================================================

	sellers.GET(
		"/:seller_id/campaign-wallet",
		middleware.AuthMiddleware(),
		controllers.GetCampaignWallet,
	)

	sellers.POST(
		"/:seller_id/campaign-wallet/top-up",
		middleware.AuthMiddleware(),
		controllers.TopUpCampaignWallet,
	)

	// =================================================
	// CUSTOMER SELLER DETAIL
	// =================================================

	sellers.GET(
		"/:seller_id",
		controllers.GetCustomerSellerDetail,
	)

	// =================================================
	// MENUS
	// =================================================

	menus := api.Group("/menus")

	// -------------------------------------------------
	// GET MENUS
	// -------------------------------------------------

	menus.GET(
		"",
		controllers.GetMenuController,
	)

	// -------------------------------------------------
	// CREATE MENU
	// -------------------------------------------------

	menus.POST(
		"",
		middleware.AuthMiddleware(),
		controllers.CreateMenuController,
	)

	// -------------------------------------------------
	// UPDATE MENU
	// -------------------------------------------------

	menus.PUT(
		"/:id",
		middleware.AuthMiddleware(),
		controllers.UpdateMenuController,
	)

	// -------------------------------------------------
	// DELETE MENU
	// -------------------------------------------------

	menus.DELETE(
		"/:id",
		middleware.AuthMiddleware(),
		controllers.DeleteMenuController,
	)

	// =================================================
	// EXPLORE
	// =================================================

	explore := api.Group("/explore")

	// -------------------------------------------------
	// POPULAR SELLERS
	// -------------------------------------------------

	explore.GET(
		"/popular",
		controllers.GetPopularSellers,
	)

	// =================================================
	// ORDERS
	// =================================================

	orders := api.Group("/orders")

	// -------------------------------------------------
	// CREATE ORDER
	// -------------------------------------------------

	orders.POST(
		"",
		middleware.AuthMiddleware(),
		controllers.CreateOrder,
	)

	// -------------------------------------------------
	// CUSTOMER ORDERS
	// -------------------------------------------------

	orders.GET(
		"",
		middleware.AuthMiddleware(),
		controllers.GetCustomerOrders,
	)

	// -------------------------------------------------
	// ORDER STATUS HISTORY
	// -------------------------------------------------

	orders.GET(
		"/:order_id/status-history",
		middleware.AuthMiddleware(),
		controllers.GetOrderStatusHistory,
	)

	// -------------------------------------------------
	// ORDER DETAIL
	// -------------------------------------------------

	orders.GET(
		"/:order_id",
		middleware.AuthMiddleware(),
		controllers.GetOrder,
	)

	// -------------------------------------------------
	// PAY ORDER
	// -------------------------------------------------

	orders.PUT(
		"/:order_id/pay",
		middleware.AuthMiddleware(),
		controllers.PayOrder,
	)

	// -------------------------------------------------
	// UPDATE ORDER STATUS
	// -------------------------------------------------

	orders.PATCH(
		"/:order_id/status",
		middleware.AuthMiddleware(),
		controllers.UpdateOrderStatus,
	)

	// =================================================
	// CAMPAIGN
	// =================================================

	campaigns := api.Group("/campaigns")

	// -------------------------------------------------
	// GET ALL CAMPAIGNS
	// -------------------------------------------------

	campaigns.GET(
		"",
		controllers.GetCampaigns,
	)

	// -------------------------------------------------
	// GET CAMPAIGN DETAIL
	// -------------------------------------------------

	campaigns.GET(
		"/:id",
		controllers.GetCampaign,
	)

	// -------------------------------------------------
	// GET CAMPAIGN PACKAGES
	// -------------------------------------------------

	campaigns.GET(
		"/:id/packages",
		controllers.GetCampaignPackages,
	)

	// =================================================
	// CHAT
	// =================================================

	ChatRoutes(api)
}
