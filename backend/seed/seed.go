package seed

import (
	"fmt"
	"log"

	"gorm.io/gorm"
)

// Run menjalankan semua seeder secara berurutan sesuai FK dependency.
// Level 0  Level 1  Level 2  Level 3
func Run(db *gorm.DB) {
	log.Println(" Memulai proses seeding...")

	// Wilayah (provinces, cities, districts)  independent tables
	SeedWilayah(db)

	// Level 0: root tables (no FK)
	seedUsers(db)
	seedSellers(db)
	seedMenuCategories(db)

	// Level 1: depend on seller_profiles
	seedMenus(db)

	// Level 2: depend on users, seller_profiles, menus
	seedOrders(db)

	fmt.Println(" Seeding selesai!")
}
