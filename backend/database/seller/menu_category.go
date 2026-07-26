package seller

import (
	"log"

	"github.com/krisn4novianto/wartegkita/backend/database"
)

// =====================================
// MENU CATEGORY MODEL
// =====================================

type MenuCategory struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Emoji    string `json:"emoji"`
	IsActive bool   `json:"is_active"`
}

// =====================================
// CREATE TABLE
// =====================================

func CreateMenuCategoryTable() {

	query := `
	CREATE TABLE IF NOT EXISTS menu_category (

		id SERIAL PRIMARY KEY,

		name VARCHAR(100) NOT NULL UNIQUE,

		emoji VARCHAR(20) NOT NULL,

		is_active BOOLEAN NOT NULL DEFAULT TRUE,

		created_at TIMESTAMP DEFAULT NOW(),

		updated_at TIMESTAMP DEFAULT NOW()

	)
	`

	_, err := database.SellerDB.Exec(query)
	if err != nil {
		log.Fatal("Gagal membuat tabel menu_category:", err)
	}

	log.Println("✅ Table menu_category siap")
}

// =====================================
// SEED DEFAULT DATA
// =====================================

func SeedMenuCategory() {

	query := `
	INSERT INTO menu_category
	(
		name,
		emoji
	)
	VALUES
		('Nasi Rames','🍛'),
		('Ayam','🍗'),
		('Ikan','🐟'),
		('Sayur','🥬'),
		('Minuman','🥤')
	ON CONFLICT (name)
	DO NOTHING;
	`

	_, err := database.SellerDB.Exec(query)
	if err != nil {
		log.Println("Seed menu_category gagal:", err)
		return
	}

	log.Println("✅ Default kategori menu berhasil dibuat")
}

// =====================================
// GET ALL CATEGORY
// =====================================

func GetAllCategories() ([]MenuCategory, error) {

	rows, err := database.SellerDB.Query(`
		SELECT
			id,
			name,
			emoji,
			is_active
		FROM menu_category
		WHERE is_active = TRUE
		ORDER BY id
	`)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var categories []MenuCategory

	for rows.Next() {

		var category MenuCategory

		err := rows.Scan(
			&category.ID,
			&category.Name,
			&category.Emoji,
			&category.IsActive,
		)

		if err != nil {
			return nil, err
		}

		categories = append(categories, category)
	}

	return categories, nil
}

// =====================================
// GET CATEGORY BY ID
// =====================================

func GetCategoryByID(id string) (MenuCategory, error) {

	var category MenuCategory

	err := database.SellerDB.QueryRow(`
		SELECT
			id,
			name,
			emoji,
			is_active
		FROM menu_category
		WHERE id = $1
	`, id).Scan(
		&category.ID,
		&category.Name,
		&category.Emoji,
		&category.IsActive,
	)

	return category, err
}

// =====================================
// CREATE CATEGORY
// =====================================

func CreateCategory(category MenuCategory) error {

	_, err := database.SellerDB.Exec(`
		INSERT INTO menu_category
		(
			name,
			emoji
		)
		VALUES
		(
			$1,
			$2
		)
	`,
		category.Name,
		category.Emoji,
	)

	return err
}

// =====================================
// UPDATE CATEGORY
// =====================================

func UpdateCategory(
	id string,
	category MenuCategory,
) error {

	_, err := database.SellerDB.Exec(`
		UPDATE menu_category
		SET
			name = $1,
			emoji = $2,
			updated_at = NOW()
		WHERE id = $3
	`,
		category.Name,
		category.Emoji,
		id,
	)

	return err
}

// =====================================
// DELETE CATEGORY (SOFT DELETE)
// =====================================

func DeleteCategory(id string) error {

	_, err := database.SellerDB.Exec(`
		UPDATE menu_category
		SET
			is_active = FALSE,
			updated_at = NOW()
		WHERE id = $1
	`, id)

	return err
}
