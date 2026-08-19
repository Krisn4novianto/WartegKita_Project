package campaign

import (
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/krisn4novianto/wartegkita/backend/database"
)

// =====================================================
// CAMPAIGN WALLET
// =====================================================
//
// Satu seller memiliki satu campaign wallet.
//
// seller_id  -> pemilik wallet
// balance    -> saldo campaign
//
// =====================================================

type CampaignWallet struct {
	ID string `gorm:"type:uuid;primaryKey" json:"id"`

	SellerID string `gorm:"type:uuid;not null;uniqueIndex" json:"seller_id"`

	Balance int64 `gorm:"not null;default:0" json:"balance"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (CampaignWallet) TableName() string {
	return "campaign_wallets"
}

// =====================================================
// GET CAMPAIGN WALLET
// =====================================================

func GetCampaignWallet(
	sellerID string,
) (*CampaignWallet, error) {

	sellerID = strings.TrimSpace(sellerID)

	if sellerID == "" {
		return nil, errors.New("seller ID tidak boleh kosong")
	}

	var wallet CampaignWallet

	err := database.DB.
		Where(
			"seller_id = ?",
			sellerID,
		).
		First(&wallet).
		Error

	if err != nil {

		if errors.Is(
			err,
			gorm.ErrRecordNotFound,
		) {

			/*
			 * Wallet belum ada.
			 *
			 * Buat otomatis dengan saldo 0.
			 */

			wallet = CampaignWallet{
				ID: uuid.New().String(),

				SellerID: sellerID,

				Balance: 0,
			}

			if err := database.DB.
				Create(&wallet).
				Error; err != nil {

				return nil, err
			}

			return &wallet, nil
		}

		return nil, err
	}

	return &wallet, nil
}

// =====================================================
// TOP UP CAMPAIGN WALLET
// =====================================================

func TopUpCampaignWallet(
	sellerID string,
	amount int64,
) (*CampaignWallet, error) {

	sellerID = strings.TrimSpace(sellerID)

	if sellerID == "" {
		return nil, errors.New(
			"seller ID tidak boleh kosong",
		)
	}

	if amount <= 0 {
		return nil, errors.New(
			"nominal top up harus lebih dari 0",
		)
	}

	if amount < 10000 {
		return nil, errors.New(
			"minimal top up Rp10.000",
		)
	}

	var wallet CampaignWallet

	err := database.DB.Transaction(
		func(tx *gorm.DB) error {

			err := tx.
				Where(
					"seller_id = ?",
					sellerID,
				).
				First(&wallet).
				Error

			/*
			 * Kalau wallet belum ada,
			 * buat baru.
			 */

			if errors.Is(
				err,
				gorm.ErrRecordNotFound,
			) {

				wallet = CampaignWallet{
					ID: uuid.New().String(),

					SellerID: sellerID,

					Balance: amount,
				}

				return tx.Create(
					&wallet,
				).Error
			}

			if err != nil {
				return err
			}

			/*
			 * Tambahkan saldo.
			 */

			wallet.Balance += amount

			return tx.
				Model(&wallet).
				Update(
					"balance",
					wallet.Balance,
				).
				Error
		},
	)

	if err != nil {
		return nil, err
	}

	return &wallet, nil
}

// =====================================================
// DEDUCT CAMPAIGN WALLET
// =====================================================
//
// Digunakan ketika seller benar-benar membayar
// paket campaign.
//
// =====================================================

func DeductCampaignWallet(
	tx *gorm.DB,
	sellerID string,
	amount int64,
) (*CampaignWallet, error) {

	sellerID = strings.TrimSpace(sellerID)

	if sellerID == "" {
		return nil, errors.New(
			"seller ID tidak boleh kosong",
		)
	}

	if amount <= 0 {
		return nil, errors.New(
			"nominal harus lebih dari 0",
		)
	}

	var wallet CampaignWallet

	err := tx.
		Where(
			"seller_id = ?",
			sellerID,
		).
		First(&wallet).
		Error

	if err != nil {
		return nil, err
	}

	if wallet.Balance < amount {

		return nil, errors.New(
			"saldo campaign tidak mencukupi",
		)
	}

	wallet.Balance -= amount

	if err := tx.
		Model(&wallet).
		Update(
			"balance",
			wallet.Balance,
		).
		Error; err != nil {

		return nil, err
	}

	return &wallet, nil
}
