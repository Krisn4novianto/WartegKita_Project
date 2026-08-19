package controllers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	campaignDB "github.com/krisn4novianto/wartegkita/backend/database/campaign"
)

// =====================================================
// GET CAMPAIGN WALLET
//
// GET /api/v1/sellers/:seller_id/campaign-wallet
// =====================================================

func GetCampaignWallet(c *gin.Context) {

	sellerID := strings.TrimSpace(
		c.Param("seller_id"),
	)

	if sellerID == "" {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Seller ID tidak boleh kosong",
			},
		)

		return
	}

	wallet, err := campaignDB.GetCampaignWallet(
		sellerID,
	)

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal mengambil saldo campaign",
				"details": err.Error(),
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"success": true,
			"data": gin.H{
				"seller_id": sellerID,
				"balance":   wallet.Balance,
			},
		},
	)
}

// =====================================================
// TOP UP REQUEST
// =====================================================

type TopUpCampaignWalletRequest struct {
	Amount int64 `json:"amount"`
}

// =====================================================
// TOP UP CAMPAIGN WALLET
//
// POST /api/v1/sellers/:seller_id/campaign-wallet/top-up
//
// BODY:
//
// {
//     "amount": 100000
// }
//
// =====================================================

func TopUpCampaignWallet(c *gin.Context) {

	sellerID := strings.TrimSpace(
		c.Param("seller_id"),
	)

	if sellerID == "" {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Seller ID tidak boleh kosong",
			},
		)

		return
	}

	// =================================================
	// REQUEST BODY
	// =================================================

	var req TopUpCampaignWalletRequest

	if err := c.ShouldBindJSON(&req); err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Data top up tidak valid",
				"details": err.Error(),
			},
		)

		return
	}

	// =================================================
	// VALIDATE AMOUNT
	// =================================================

	if req.Amount <= 0 {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Nominal top up harus lebih dari Rp0",
			},
		)

		return
	}

	if req.Amount < 10000 {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Minimal top up adalah Rp10.000",
			},
		)

		return
	}

	// =================================================
	// GET CURRENT WALLET
	// =================================================

	currentWallet, err :=
		campaignDB.GetCampaignWallet(
			sellerID,
		)

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal mengambil saldo campaign",
				"details": err.Error(),
			},
		)

		return
	}

	currentBalance :=
		currentWallet.Balance

	// =================================================
	// TOP UP
	//
	// Database function mengembalikan:
	//
	// (wallet, error)
	// =================================================

	updatedWallet, err :=
		campaignDB.TopUpCampaignWallet(
			sellerID,
			req.Amount,
		)

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal melakukan top up saldo campaign",
				"details": err.Error(),
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
			"message": "Saldo campaign berhasil ditambahkan",
			"data": gin.H{
				"seller_id":        sellerID,
				"amount":           req.Amount,
				"previous_balance": currentBalance,
				"balance":          updatedWallet.Balance,
			},
		},
	)
}
