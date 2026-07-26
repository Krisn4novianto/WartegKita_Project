package database

import "database/sql"

// =====================================
// MODEL
// =====================================

type Wilayah struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// =====================================
// GET PROVINCES
// =====================================

func GetProvinces() ([]Wilayah, error) {

	rows, err := DB.Query(`
		SELECT
			id,
			name
		FROM provinces
		ORDER BY name
	`)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var provinces []Wilayah

	for rows.Next() {

		var p Wilayah

		err := rows.Scan(
			&p.ID,
			&p.Name,
		)

		if err != nil {
			return nil, err
		}

		provinces = append(
			provinces,
			p,
		)

	}

	return provinces, nil
}

// =====================================
// GET CITIES
// =====================================

func GetCities(
	provinceID int,
) ([]Wilayah, error) {

	rows, err := DB.Query(`
		SELECT
			id,
			name
		FROM cities
		WHERE province_id = $1
		ORDER BY name
	`, provinceID)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var cities []Wilayah

	for rows.Next() {

		var c Wilayah

		err := rows.Scan(
			&c.ID,
			&c.Name,
		)

		if err != nil {
			return nil, err
		}

		cities = append(
			cities,
			c,
		)

	}

	return cities, nil
}

// =====================================
// GET DISTRICTS
// =====================================

func GetDistricts(
	cityID int,
) ([]Wilayah, error) {

	rows, err := DB.Query(`
		SELECT
			id,
			name
		FROM districts
		WHERE city_id = $1
		ORDER BY name
	`, cityID)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var districts []Wilayah

	for rows.Next() {

		var d Wilayah

		err := rows.Scan(
			&d.ID,
			&d.Name,
		)

		if err != nil {
			return nil, err
		}

		districts = append(
			districts,
			d,
		)

	}

	return districts, nil
}

// =====================================
// GET PROVINCE BY ID
// =====================================

func GetProvinceByID(
	id int,
) (*Wilayah, error) {

	var p Wilayah

	err := DB.QueryRow(`
		SELECT
			id,
			name
		FROM provinces
		WHERE id = $1
	`, id).Scan(
		&p.ID,
		&p.Name,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	return &p, nil
}

// =====================================
// GET CITY BY ID
// =====================================

func GetCityByID(
	id int,
) (*Wilayah, error) {

	var c Wilayah

	err := DB.QueryRow(`
		SELECT
			id,
			name
		FROM cities
		WHERE id = $1
	`, id).Scan(
		&c.ID,
		&c.Name,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	return &c, nil
}

// =====================================
// GET DISTRICT BY ID
// =====================================

func GetDistrictByID(
	id int,
) (*Wilayah, error) {

	var d Wilayah

	err := DB.QueryRow(`
		SELECT
			id,
			name
		FROM districts
		WHERE id = $1
	`, id).Scan(
		&d.ID,
		&d.Name,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	return &d, nil
}
