package database

// =====================================
// CREATE USER TABLES
// =====================================

func CreateUserTables() {

	query := `

	CREATE TABLE IF NOT EXISTS users (

		id SERIAL PRIMARY KEY,

		name VARCHAR(100),

		email VARCHAR(100) UNIQUE,

		password TEXT

	);

	CREATE TABLE IF NOT EXISTS user_addresses (

    id SERIAL PRIMARY KEY,

    user_id INTEGER UNIQUE REFERENCES users(id),

    label VARCHAR(50),

    detail TEXT,

    province_id INTEGER,
    province_name VARCHAR(100),

    city_id INTEGER,
    city_name VARCHAR(100),

    district_id INTEGER,
    district_name VARCHAR(100),

    postal_code VARCHAR(20),

    note TEXT,

    latitude DOUBLE PRECISION,

    longitude DOUBLE PRECISION,

    updated_at TIMESTAMP DEFAULT NOW()
);
	`

	_, err := DB.Exec(query)

	if err != nil {

		panic(err)

	}

}
