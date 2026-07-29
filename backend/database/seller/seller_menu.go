package seller

import (
	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/models"
)

type Menu = models.Menu

func GetMenus(sellerID string) ([]Menu, error) {
	var menus []Menu
	query := database.DB.Order("created_at DESC")
	if sellerID != "" {
		query = query.Where("seller_id = ?", sellerID)
	}
	err := query.Find(&menus).Error
	return menus, err
}

func CreateMenu(menu Menu) error {
	return database.DB.Create(&menu).Error
}

func DeleteMenu(id string) error {
	return database.DB.Where("id = ?", id).Delete(&Menu{}).Error
}

