package models

import "time"

// =====================================================
// CAMPAIGN PACKAGE
// =====================================================
//
// Paket yang tersedia di dalam sebuah campaign.
//
// Relationship:
//
// campaigns
//     │
//     └── campaign_packages
//              │
//              ├── campaign_id
//              ├── name
//              ├── price
//              ├── duration_days
//              ├── popular
//              ├── benefits
//              └── is_active
//
// =====================================================

type CampaignPackage struct {

	// =================================================
	// PRIMARY KEY
	// =================================================

	ID string `gorm:"type:uuid;primaryKey" json:"id"`

	// =================================================
	// CAMPAIGN RELATION
	// =================================================
	//
	// FK dibuat manual di database/repairForeignKeys().
	//
	// campaigns.id
	//      ↓
	// campaign_packages.campaign_id
	//
	// =================================================

	CampaignID string `gorm:"type:uuid;not null;index" json:"campaign_id"`

	// =================================================
	// PACKAGE INFORMATION
	// =================================================

	Name string `gorm:"type:varchar(100);not null" json:"name"`

	Description string `gorm:"type:text" json:"description"`

	// =================================================
	// PRICE
	// =================================================
	//
	// Disimpan sebagai integer rupiah.
	//
	// Contoh:
	//
	// 50000
	// 100000
	// 250000
	//
	// =================================================

	Price int64 `gorm:"not null;default:0" json:"price"`

	// =================================================
	// DURATION
	// =================================================

	DurationDays int `gorm:"not null;default:7" json:"duration_days"`

	// =================================================
	// POPULAR PACKAGE
	// =================================================

	Popular bool `gorm:"not null;default:false" json:"popular"`

	// =================================================
	// BENEFITS
	// =================================================
	//
	// Contoh:
	//
	// [
	//   "Tampil di halaman utama",
	//   "Prioritas pencarian",
	//   "Promosi campaign"
	// ]
	//
	// GORM menyimpan []string sebagai JSON.
	//
	// =================================================

	Benefits []string `gorm:"serializer:json;type:jsonb" json:"benefits"`

	// =================================================
	// ACTIVE STATUS
	// =================================================

	IsActive bool `gorm:"not null;default:true;index" json:"is_active"`

	// =================================================
	// TIMESTAMP
	// =================================================

	CreatedAt time.Time `gorm:"not null;autoCreateTime" json:"created_at"`

	UpdatedAt time.Time `gorm:"not null;autoUpdateTime" json:"updated_at"`
}
