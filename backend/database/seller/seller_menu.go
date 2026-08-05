package seller

import (
	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/models"
)

type Menu = models.Menu

// =====================================================
// GET MENUS
// =====================================================

func GetMenus(sellerID string) ([]Menu, error) {

	var menus []Menu

	query := database.DB.
		Order("created_at DESC")

	if sellerID != "" {
		query = query.Where(
			"seller_id = ?",
			sellerID,
		)
	}

	err := query.Find(&menus).Error

	return menus, err
}

// =====================================================
// GET MENU
// =====================================================

func GetMenu(id string) (Menu, error) {

	var menu Menu

	err := database.DB.
		Where("id = ?", id).
		First(&menu).
		Error

	return menu, err
}

// =====================================================
// CREATE MENU
// =====================================================

func CreateMenu(menu Menu) error {

	return database.DB.
		Create(&menu).
		Error
}

// =====================================================
// UPDATE MENU
// =====================================================

func UpdateMenu(
	id string,
	sellerID string,
	updates map[string]interface{},
) error {

	return database.DB.
		Model(&Menu{}).
		Where(
			"id = ? AND seller_id = ?",
			id,
			sellerID,
		).
		Updates(updates).
		Error
}

// =====================================================
// DELETE MENU
// =====================================================

func DeleteMenu(
	id string,
	sellerID string,
) error {

	return database.DB.
		Where(
			"id = ? AND seller_id = ?",
			id,
			sellerID,
		).
		Delete(&Menu{}).
		Error
}
