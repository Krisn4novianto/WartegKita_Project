package seller

import (
	"github.com/krisn4novianto/wartegkita/backend/database"
)

type Menu struct {
	ID int `json:"id"`

	SellerID int `json:"seller_id"`

	Name string `json:"name"`

	Description string `json:"description"`

	Price float64 `json:"price"`

	Stock int `json:"stock"`

	Category string `json:"category"`

	Image string `json:"image"`

	Available bool `json:"available"`

	CreatedAt string `json:"created_at"`
}

// ================================
// GET ALL MENU SELLER
// ================================

func GetMenus(
	sellerID string,
) ([]Menu, error) {

	rows, err := database.SellerDB.Query(

		`
		SELECT
			id,
			seller_id,
			name,
			description,
			price,
			stock,
			category,
			image,
			available,
			created_at
		FROM menus
		WHERE seller_id=$1
		ORDER BY created_at DESC
		`,
		sellerID,
	)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var menus []Menu

	for rows.Next() {

		var menu Menu

		err := rows.Scan(

			&menu.ID,

			&menu.SellerID,

			&menu.Name,

			&menu.Description,

			&menu.Price,

			&menu.Stock,

			&menu.Category,

			&menu.Image,

			&menu.Available,

			&menu.CreatedAt,
		)

		if err != nil {
			return nil, err
		}

		menus = append(
			menus,
			menu,
		)

	}

	return menus, nil

}

// ================================
// CREATE MENU
// ================================

func CreateMenu(
	menu Menu,
) error {

	_, err := database.SellerDB.Exec(

		`
		INSERT INTO menus
		(
			seller_id,
			name,
			description,
			price,
			stock,
			category,
			image,
			available
		)

		VALUES
		(
			$1,
			$2,
			$3,
			$4,
			$5,
			$6,
			$7,
			$8
		)

		`,

		menu.SellerID,
		menu.Name,
		menu.Description,
		menu.Price,
		menu.Stock,
		menu.Category,
		menu.Image,
		menu.Available,
	)

	return err

}

// ================================
// DELETE MENU
// ================================

func DeleteMenu(
	id string,
) error {

	_, err := database.SellerDB.Exec(

		`
		DELETE FROM menus
		WHERE id=$1
		`,

		id,
	)

	return err

}
