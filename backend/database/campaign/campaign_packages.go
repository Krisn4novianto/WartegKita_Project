package campaign

import (
	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/models"
)

type CampaignPackage = models.CampaignPackage

// =====================================================
// GET CAMPAIGN PACKAGES
// =====================================================

func GetCampaignPackages(
	campaignID string,
) ([]CampaignPackage, error) {

	var packages []CampaignPackage

	query := database.DB.
		Where(
			"is_active = ?",
			true,
		).
		Order(
			"price ASC",
		)

	if campaignID != "" {

		query = query.Where(
			"campaign_id = ?",
			campaignID,
		)

	}

	err := query.
		Find(&packages).
		Error

	return packages, err
}

// =====================================================
// GET CAMPAIGN PACKAGE
// =====================================================

func GetCampaignPackage(
	id string,
) (CampaignPackage, error) {

	var campaignPackage CampaignPackage

	err := database.DB.
		Where(
			"id = ?",
			id,
		).
		First(&campaignPackage).
		Error

	return campaignPackage, err
}

// =====================================================
// CREATE CAMPAIGN PACKAGE
// =====================================================

func CreateCampaignPackage(
	campaignPackage CampaignPackage,
) error {

	return database.DB.
		Create(&campaignPackage).
		Error
}

// =====================================================
// UPDATE CAMPAIGN PACKAGE
// =====================================================

func UpdateCampaignPackage(
	id string,
	updates map[string]interface{},
) error {

	return database.DB.
		Model(&CampaignPackage{}).
		Where(
			"id = ?",
			id,
		).
		Updates(updates).
		Error
}

// =====================================================
// DELETE CAMPAIGN PACKAGE
// =====================================================

func DeleteCampaignPackage(
	id string,
) error {

	return database.DB.
		Where(
			"id = ?",
			id,
		).
		Delete(&CampaignPackage{}).
		Error
}
