package database

import (
	"github.com/google/uuid"
	"gorm.io/gorm/clause"

	"github.com/krisn4novianto/wartegkita/backend/models"
)

// CreateAddress creates or updates a user's address using GORM
func CreateAddress(address models.UserAddress) error {
	if address.ID == "" {
		addressID, err := uuid.NewV7()
		if err != nil {
			return err
		}
		address.ID = addressID.String()
	}

	return DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"label", "detail", "province_id", "province_name", "city_id", "city_name", "district_id", "district_name", "postal_code", "note", "latitude", "longitude", "updated_at"}),
	}).Create(&address).Error
}
