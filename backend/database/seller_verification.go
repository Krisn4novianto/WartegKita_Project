package database

import (
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/krisn4novianto/wartegkita/backend/models"
)

// =====================================================
// CREATE SELLER VERIFICATION
// =====================================================

func CreateSellerVerification(
	sellerID uuid.UUID,
	ktpNumber string,
	ktpImage string,
) (*models.SellerVerification, error) {

	verification := &models.SellerVerification{

		SellerID: sellerID,

		KTPNumber: ktpNumber,

		KTPImage: ktpImage,

		Status: "PENDING",
	}

	if err := DB.Create(
		verification,
	).Error; err != nil {

		return nil, err
	}

	return verification, nil
}

// =====================================================
// GET SELLER VERIFICATION
// =====================================================

func GetSellerVerification(
	sellerID uuid.UUID,
) (*models.SellerVerification, error) {

	var verification models.SellerVerification

	err := DB.
		Where(
			"seller_id = ?",
			sellerID,
		).
		First(
			&verification,
		).
		Error

	if err != nil {

		if errors.Is(
			err,
			gorm.ErrRecordNotFound,
		) {

			return nil, nil
		}

		return nil, err
	}

	return &verification, nil
}

// =====================================================
// UPDATE SELLER VERIFICATION
// =====================================================

func UpdateSellerVerificationStatus(
	sellerID uuid.UUID,
	status string,
) error {

	return DB.
		Model(
			&models.SellerVerification{},
		).
		Where(
			"seller_id = ?",
			sellerID,
		).
		Update(
			"status",
			status,
		).
		Error
}
