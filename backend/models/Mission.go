package models

import "time"

// =====================================================
// MISSION TYPES
// =====================================================

const (
	MissionOrderCount  = "ORDER_COUNT"
	MissionSpendAmount = "SPEND_AMOUNT"
	MissionProfile     = "PROFILE_COMPLETE"
	MissionNewSeller   = "NEW_SELLER"
)

// =====================================================
// MISSION
// =====================================================
//
// Mission adalah model untuk tabel:
//
//     public.missions
//
// Data mission TIDAK didefinisikan di model ini.
// Data aktual berasal dari database.
//
// Contoh data:
//
//     Pesanan Pertamamu
//     Makan 3 Kali
//
// =====================================================

type Mission struct {

	// =================================================
	// PRIMARY KEY
	// =================================================

	ID string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`

	// =================================================
	// BASIC INFORMATION
	// =================================================

	Title string `gorm:"size:150;not null" json:"title"`

	Description string `gorm:"type:text" json:"description"`

	// =================================================
	// MISSION CONFIGURATION
	// =================================================

	Type string `gorm:"size:50;not null;index" json:"type"`

	Target int `gorm:"not null;default:1" json:"target"`

	RewardPoints int `gorm:"not null;default:0" json:"reward_points"`

	// =================================================
	// STATUS
	// =================================================

	IsActive bool `gorm:"not null;default:true;index" json:"is_active"`

	// =================================================
	// PERIOD
	// =================================================

	StartAt *time.Time `json:"start_at"`

	EndAt *time.Time `json:"end_at"`

	// =================================================
	// TIMESTAMPS
	// =================================================

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`

	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}
