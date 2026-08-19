package database

import (
	"fmt"
	"log"

	"github.com/krisn4novianto/wartegkita/backend/models"
	"gorm.io/gorm"
)

// =====================================================
// CHECK LOYALTY REWARDS
//
// Reward dikelola langsung melalui PostgreSQL.
//
// File ini TIDAK:
// - membuat reward hardcode
// - mengubah reward
// - melakukan INSERT reward
//
// Data reward berasal dari:
//
//     public.rewards
// =====================================================

func SeedLoyaltyRewards(db *gorm.DB) error {

	// =================================================
	// CHECK DATABASE
	// =================================================

	if db == nil {
		log.Println(
			"⚠️ Database belum tersedia, pengecekan rewards dilewati",
		)

		return nil
	}

	// =================================================
	// CHECK EXISTING REWARDS
	// =================================================

	var count int64

	if err := db.
		Model(&models.Reward{}).
		Count(&count).
		Error; err != nil {

		return err
	}

	// =================================================
	// NO REWARD
	// =================================================

	if count == 0 {
		log.Println(
			"ℹ️ Belum ada reward di database",
		)

		return nil
	}

	// =================================================
	// REWARDS AVAILABLE
	// =================================================

	fmt.Printf(
		"✅ Rewards tersedia di database (%d data)\n",
		count,
	)

	return nil
}
