package database

import (
	"fmt"
	"log"

	"github.com/krisn4novianto/wartegkita/backend/models"
)

// =====================================================
// CHECK MISSIONS
//
// Mission dikelola dari database.
// File ini TIDAK melakukan hardcode atau INSERT mission.
//
// Data mission berasal dari:
//   public.missions
//
// Contoh:
//   INSERT INTO public.missions (...)
// =====================================================

func SeedMissions() {

	// =================================================
	// CHECK DATABASE CONNECTION
	// =================================================

	if DB == nil {
		log.Println(
			"[WARN] Database belum tersedia, pengecekan missions dilewati",
		)

		return
	}

	// =================================================
	// CHECK EXISTING MISSIONS
	// =================================================

	var count int64

	if err := DB.
		Model(&models.Mission{}).
		Count(&count).
		Error; err != nil {

		log.Println(
			"[WARN] Gagal mengecek missions:",
			err,
		)

		return
	}

	// =================================================
	// NO MISSION
	// =================================================

	if count == 0 {

		log.Println(
			"[INFO] Belum ada mission di database",
		)

		return
	}

	// =================================================
	// MISSIONS AVAILABLE
	// =================================================

	fmt.Printf(
		"Missions tersedia di database (%d data)\n",
		count,
	)
}
