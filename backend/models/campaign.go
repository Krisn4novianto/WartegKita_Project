package models

import "time"

// =====================================================
// CAMPAIGN
// =====================================================
//
// Campaign utama WartegKita.
//
// Relationship:
//
// campaigns
//     │
//     ├── campaign_packages
//     │
//     └── seller_campaigns
//
// =====================================================

type Campaign struct {

	// =================================================
	// PRIMARY KEY
	// =================================================

	ID string `gorm:"type:uuid;primaryKey" json:"id"`

	// =================================================
	// CAMPAIGN INFORMATION
	// =================================================

	Name string `gorm:"type:varchar(150);not null" json:"name"`

	Description string `gorm:"type:text" json:"description"`

	BannerImage string `gorm:"type:text" json:"banner_image"`

	// =================================================
	// CAMPAIGN PERIOD
	// =================================================

	StartAt time.Time `gorm:"not null;index" json:"start_at"`

	EndAt time.Time `gorm:"not null;index" json:"end_at"`

	// =================================================
	// STATUS
	// =================================================
	//
	// Contoh:
	//
	// DRAFT
	// ACTIVE
	// ENDED
	// INACTIVE
	//
	// =================================================

	Status string `gorm:"type:varchar(30);not null;default:DRAFT;index" json:"status"`

	// =================================================
	// TIMESTAMP
	// =================================================

	CreatedAt time.Time `gorm:"not null;autoCreateTime" json:"created_at"`

	UpdatedAt time.Time `gorm:"not null;autoUpdateTime" json:"updated_at"`
}
