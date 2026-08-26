package models

import "time"

// =====================================================
// SELLER CAMPAIGN
// =====================================================
//
// Menyimpan campaign yang diikuti oleh seller.
//
// Relationship:
//
// campaigns
//     │
//     └── seller_campaigns
//              │
//              ├── seller_profiles
//              └── campaign_packages
//
// =====================================================

type SellerCampaign struct {

	// =================================================
	// PRIMARY KEY
	// =================================================

	ID string `gorm:"type:uuid;primaryKey" json:"id"`

	// =================================================
	// SELLER
	// =================================================

	SellerID string `gorm:"type:uuid;not null;index" json:"seller_id"`

	// =================================================
	// CAMPAIGN
	// =================================================

	CampaignID string `gorm:"type:uuid;not null;index" json:"campaign_id"`

	// =================================================
	// PACKAGE
	// =================================================

	PackageID string `gorm:"type:uuid;not null;index" json:"package_id"`

	// =================================================
	// PAYMENT
	// =================================================

	Amount int64 `gorm:"not null;default:0" json:"amount"`

	PaymentStatus string `gorm:"type:varchar(30);not null;default:UNPAID;index" json:"payment_status"`

	// =================================================
	// CAMPAIGN STATUS
	// =================================================
	//
	// PENDING_PAYMENT
	// ACTIVE
	// COMPLETED
	// CANCELLED
	//
	// =================================================

	Status string `gorm:"type:varchar(30);not null;default:PENDING_PAYMENT;index" json:"status"`

	// =================================================
	// CAMPAIGN PERIOD
	// =================================================

	StartAt *time.Time `json:"start_at"`

	EndAt *time.Time `json:"end_at"`

	// =================================================
	// TIMESTAMP
	// =================================================

	CreatedAt time.Time `gorm:"not null;autoCreateTime" json:"created_at"`

	UpdatedAt time.Time `gorm:"not null;autoUpdateTime" json:"updated_at"`
}
