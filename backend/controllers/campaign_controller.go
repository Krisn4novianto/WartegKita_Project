package controllers

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	campaignDB "github.com/krisn4novianto/wartegkita/backend/database/campaign"
)

// =====================================================
// GET ACTIVE CAMPAIGNS
//
// GET /api/v1/campaigns
// =====================================================

func GetCampaigns(c *gin.Context) {

	campaigns, err := campaignDB.GetActiveCampaigns()

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal mengambil campaign",
				"details": err.Error(),
			},
		)

		return
	}

	// Jangan kirim null kalau belum ada campaign.
	if campaigns == nil {
		campaigns = []campaignDB.Campaign{}
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"success": true,
			"data":    campaigns,
		},
	)
}

// =====================================================
// GET CAMPAIGN
//
// GET /api/v1/campaigns/:id
// =====================================================

func GetCampaign(c *gin.Context) {

	id := strings.TrimSpace(
		c.Param("id"),
	)

	if id == "" {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Campaign ID tidak boleh kosong",
			},
		)

		return
	}

	campaign, err := campaignDB.GetCampaign(id)

	if err != nil {

		if errors.Is(err, gorm.ErrRecordNotFound) {

			c.JSON(
				http.StatusNotFound,
				gin.H{
					"success": false,
					"message": "Campaign tidak ditemukan",
				},
			)

			return
		}

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal mengambil campaign",
				"details": err.Error(),
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"success": true,
			"data":    campaign,
		},
	)
}

// =====================================================
// GET CAMPAIGN PACKAGES
//
// GET /api/v1/campaigns/:id/packages
// =====================================================

func GetCampaignPackages(c *gin.Context) {

	campaignID := strings.TrimSpace(
		c.Param("id"),
	)

	if campaignID == "" {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Campaign ID tidak boleh kosong",
			},
		)

		return
	}

	// -------------------------------------------------
	// Pastikan campaign memang ada
	// -------------------------------------------------

	_, err := campaignDB.GetCampaign(campaignID)

	if err != nil {

		if errors.Is(err, gorm.ErrRecordNotFound) {

			c.JSON(
				http.StatusNotFound,
				gin.H{
					"success": false,
					"message": "Campaign tidak ditemukan",
				},
			)

			return
		}

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal mengecek campaign",
				"details": err.Error(),
			},
		)

		return
	}

	// -------------------------------------------------
	// Ambil package
	// -------------------------------------------------

	packages, err := campaignDB.GetCampaignPackages(
		campaignID,
	)

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal mengambil paket campaign",
				"details": err.Error(),
			},
		)

		return
	}

	if packages == nil {
		packages = []campaignDB.CampaignPackage{}
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"success": true,
			"data":    packages,
		},
	)
}

// =====================================================
// GET SELLER CAMPAIGNS
//
// GET /api/v1/sellers/:seller_id/campaigns
// =====================================================

func GetSellerCampaigns(c *gin.Context) {

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

	campaigns, err := campaignDB.GetSellerCampaigns(
		sellerID,
	)

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal mengambil campaign seller",
				"details": err.Error(),
			},
		)

		return
	}

	if campaigns == nil {
		campaigns = []campaignDB.SellerCampaign{}
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"success": true,
			"data":    campaigns,
		},
	)
}

// =====================================================
// JOIN CAMPAIGN REQUEST
// =====================================================

type JoinCampaignRequest struct {
	CampaignID string `json:"campaign_id" binding:"required"`
	PackageID  string `json:"package_id" binding:"required"`
}

// =====================================================
// JOIN CAMPAIGN
//
// POST /api/v1/sellers/:seller_id/campaigns
//
// BODY:
//
// {
//     "campaign_id": "uuid",
//     "package_id": "uuid"
// }
//
// =====================================================

func JoinCampaign(c *gin.Context) {

	// =================================================
	// SELLER ID
	// =================================================

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

	var req JoinCampaignRequest

	if err := c.ShouldBindJSON(&req); err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Data campaign tidak valid",
				"details": err.Error(),
			},
		)

		return
	}

	req.CampaignID = strings.TrimSpace(
		req.CampaignID,
	)

	req.PackageID = strings.TrimSpace(
		req.PackageID,
	)

	if req.CampaignID == "" {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Campaign ID tidak boleh kosong",
			},
		)

		return
	}

	if req.PackageID == "" {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Package ID tidak boleh kosong",
			},
		)

		return
	}

	// =================================================
	// GET CAMPAIGN
	// =================================================

	campaign, err := campaignDB.GetCampaign(
		req.CampaignID,
	)

	if err != nil {

		if errors.Is(err, gorm.ErrRecordNotFound) {

			c.JSON(
				http.StatusNotFound,
				gin.H{
					"success": false,
					"message": "Campaign tidak ditemukan",
				},
			)

			return
		}

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal mengambil campaign",
				"details": err.Error(),
			},
		)

		return
	}

	// =================================================
	// CHECK CAMPAIGN STATUS
	// =================================================

	if !strings.EqualFold(
		strings.TrimSpace(campaign.Status),
		"ACTIVE",
	) {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Campaign sedang tidak aktif",
			},
		)

		return
	}

	// =================================================
	// CHECK CAMPAIGN PERIOD
	// =================================================

	// Campaign harus mempunyai periode valid.
	if campaign.EndAt.Before(campaign.StartAt) {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Periode campaign tidak valid",
			},
		)

		return
	}

	// =================================================
	// GET PACKAGE
	// =================================================

	campaignPackage, err := campaignDB.GetCampaignPackage(
		req.PackageID,
	)

	if err != nil {

		if errors.Is(err, gorm.ErrRecordNotFound) {

			c.JSON(
				http.StatusNotFound,
				gin.H{
					"success": false,
					"message": "Paket campaign tidak ditemukan",
				},
			)

			return
		}

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal mengambil paket campaign",
				"details": err.Error(),
			},
		)

		return
	}

	// =================================================
	// CHECK PACKAGE ACTIVE
	// =================================================

	if !campaignPackage.IsActive {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Paket campaign sedang tidak aktif",
			},
		)

		return
	}

	// =================================================
	// VALIDATE PACKAGE BELONGS TO CAMPAIGN
	// =================================================

	if strings.TrimSpace(campaignPackage.CampaignID) !=
		strings.TrimSpace(campaign.ID) {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Paket bukan bagian dari campaign tersebut",
			},
		)

		return
	}

	// =================================================
	// CHECK SELLER ALREADY JOINED
	// =================================================

	alreadyJoined, err := campaignDB.SellerAlreadyJoined(
		sellerID,
		campaign.ID,
	)

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal memeriksa campaign seller",
				"details": err.Error(),
			},
		)

		return
	}

	if alreadyJoined {

		c.JSON(
			http.StatusConflict,
			gin.H{
				"success": false,
				"message": "Seller sudah mengikuti campaign ini",
			},
		)

		return
	}

	// =================================================
	// CREATE SELLER CAMPAIGN
	// =================================================

	sellerCampaign := campaignDB.SellerCampaign{

		SellerID: sellerID,

		CampaignID: campaign.ID,

		PackageID: campaignPackage.ID,

		Amount: campaignPackage.Price,

		PaymentStatus: "UNPAID",

		Status: "PENDING_PAYMENT",

		StartAt: &campaign.StartAt,

		EndAt: &campaign.EndAt,
	}

	// =================================================
	// SAVE
	// =================================================

	err = campaignDB.CreateSellerCampaign(
		sellerCampaign,
	)

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal mendaftarkan campaign",
				"details": err.Error(),
			},
		)

		return
	}

	// =================================================
	// RESPONSE
	// =================================================

	c.JSON(
		http.StatusCreated,
		gin.H{
			"success": true,
			"message": "Berhasil mendaftar campaign",
			"data":    sellerCampaign,
		},
	)
}
