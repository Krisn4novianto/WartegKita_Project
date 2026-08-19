package campaign

import (
	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/models"
)

// =====================================================
// SELLER CAMPAIGN
// =====================================================

type SellerCampaign = models.SellerCampaign

// =====================================================
// GET SELLER CAMPAIGNS
//
// GET /api/v1/sellers/:seller_id/campaigns
// =====================================================

func GetSellerCampaigns(
	sellerID string,
) ([]SellerCampaign, error) {

	var campaigns []SellerCampaign

	err := database.DB.
		Where(
			"seller_id = ?",
			sellerID,
		).
		Order(
			"created_at DESC",
		).
		Find(&campaigns).
		Error

	return campaigns, err
}

// =====================================================
// GET SELLER CAMPAIGN
// =====================================================

func GetSellerCampaign(
	id string,
	sellerID string,
) (SellerCampaign, error) {

	var sellerCampaign SellerCampaign

	err := database.DB.
		Where(
			"id = ? AND seller_id = ?",
			id,
			sellerID,
		).
		First(&sellerCampaign).
		Error

	return sellerCampaign, err
}

// =====================================================
// CHECK SELLER ALREADY JOINED
// =====================================================

func SellerAlreadyJoined(
	sellerID string,
	campaignID string,
) (bool, error) {

	var count int64

	err := database.DB.
		Model(&SellerCampaign{}).
		Where(
			"seller_id = ? AND campaign_id = ?",
			sellerID,
			campaignID,
		).
		Where(
			"status IN ?",
			[]string{
				"PENDING_PAYMENT",
				"ACTIVE",
			},
		).
		Count(&count).
		Error

	return count > 0, err
}

// =====================================================
// CREATE SELLER CAMPAIGN
// =====================================================

func CreateSellerCampaign(
	sellerCampaign SellerCampaign,
) error {

	return database.DB.
		Create(&sellerCampaign).
		Error
}

// =====================================================
// UPDATE SELLER CAMPAIGN
// =====================================================

func UpdateSellerCampaign(
	id string,
	sellerID string,
	updates map[string]interface{},
) error {

	return database.DB.
		Model(&SellerCampaign{}).
		Where(
			"id = ? AND seller_id = ?",
			id,
			sellerID,
		).
		Updates(updates).
		Error
}

// =====================================================
// DELETE SELLER CAMPAIGN
// =====================================================

func DeleteSellerCampaign(
	id string,
	sellerID string,
) error {

	return database.DB.
		Where(
			"id = ? AND seller_id = ?",
			id,
			sellerID,
		).
		Delete(&SellerCampaign{}).
		Error
}
