package campaign

import (
	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/models"
)

type Campaign = models.Campaign

// =====================================================
// GET ACTIVE CAMPAIGNS
// =====================================================

func GetActiveCampaigns() ([]Campaign, error) {

	var campaigns []Campaign

	err := database.DB.
		Where(
			"status = ?",
			"ACTIVE",
		).
		Order(
			"start_at ASC",
		).
		Find(&campaigns).
		Error

	return campaigns, err
}

// =====================================================
// GET CAMPAIGN
// =====================================================

func GetCampaign(
	id string,
) (Campaign, error) {

	var campaign Campaign

	err := database.DB.
		Where(
			"id = ?",
			id,
		).
		First(&campaign).
		Error

	return campaign, err
}

// =====================================================
// CREATE CAMPAIGN
// =====================================================

func CreateCampaign(
	campaign Campaign,
) error {

	return database.DB.
		Create(&campaign).
		Error
}

// =====================================================
// UPDATE CAMPAIGN
// =====================================================

func UpdateCampaign(
	id string,
	updates map[string]interface{},
) error {

	return database.DB.
		Model(&Campaign{}).
		Where(
			"id = ?",
			id,
		).
		Updates(updates).
		Error
}

// =====================================================
// DELETE CAMPAIGN
// =====================================================

func DeleteCampaign(
	id string,
) error {

	return database.DB.
		Where(
			"id = ?",
			id,
		).
		Delete(&Campaign{}).
		Error
}
