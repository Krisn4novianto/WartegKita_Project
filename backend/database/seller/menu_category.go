package seller

import (
	"log"

	"github.com/google/uuid"

	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/models"
)

type MenuCategory = models.MenuCategory

func CreateMenuCategoryTable() {
	if err := database.DB.AutoMigrate(&models.MenuCategory{}); err != nil {
		log.Fatal("Gagal membuat tabel menu_category:", err)
	}
	log.Println(" Table menu_category siap")
}

func SeedMenuCategory() {
	database.SeedMenuCategories()
}

func GetAllCategories() ([]MenuCategory, error) {
	var categories []MenuCategory
	err := database.DB.Where("is_active = ?", true).Order("created_at ASC").Find(&categories).Error
	return categories, err
}

func GetCategoryByID(id string) (MenuCategory, error) {
	var category MenuCategory
	err := database.DB.Where("id = ?", id).First(&category).Error
	return category, err
}

func CreateCategory(category MenuCategory) error {
	if category.ID == "" {
		idObj, err := uuid.NewV7()
		if err == nil {
			category.ID = idObj.String()
		}
	}
	return database.DB.Create(&category).Error
}

func UpdateCategory(id string, category MenuCategory) error {
	return database.DB.Model(&MenuCategory{}).Where("id = ?", id).Updates(map[string]interface{}{
		"name":  category.Name,
		"emoji": category.Emoji,
	}).Error
}

func DeleteCategory(id string) error {
	return database.DB.Model(&MenuCategory{}).Where("id = ?", id).Update("is_active", false).Error
}

