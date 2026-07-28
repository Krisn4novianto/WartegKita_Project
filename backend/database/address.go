package database

import (
	"github.com/google/uuid"
	"github.com/krisn4novianto/wartegkita/backend/models"
)

// ========================================
// CREATE / UPDATE ADDRESS WITH UUID v7
// ========================================

func CreateAddress(
	address models.UserAddress,
) error {

	addressID, err := uuid.NewV7()
	if err != nil {
		return err
	}

	query := `
	INSERT INTO user_addresses
	(
		id,
		user_id,
		label,
		detail,
		province_id,
		province_name,
		city_id,
		city_name,
		district_id,
		district_name,
		postal_code,
		note,
		latitude,
		longitude,
		updated_at
	)
	VALUES
	(
		$1, $2, $3, $4,
		$5, $6,
		$7, $8,
		$9, $10,
		$11, $12, $13, $14, NOW()
	)
	ON CONFLICT(user_id)
	DO UPDATE SET
		label = EXCLUDED.label,
		detail = EXCLUDED.detail,
		province_id = EXCLUDED.province_id,
		province_name = EXCLUDED.province_name,
		city_id = EXCLUDED.city_id,
		city_name = EXCLUDED.city_name,
		district_id = EXCLUDED.district_id,
		district_name = EXCLUDED.district_name,
		postal_code = EXCLUDED.postal_code,
		note = EXCLUDED.note,
		latitude = EXCLUDED.latitude,
		longitude = EXCLUDED.longitude,
		updated_at = NOW()
	`

	_, err = DB.Exec(
		query,
		addressID.String(),
		address.UserID,
		address.Label,
		address.Detail,
		address.ProvinceID,
		address.ProvinceName,
		address.CityID,
		address.CityName,
		address.DistrictID,
		address.DistrictName,
		address.PostalCode,
		address.Note,
		address.Latitude,
		address.Longitude,
	)

	return err

}
