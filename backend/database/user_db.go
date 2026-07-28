package database

import (
	"errors"
	"strings"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/krisn4novianto/wartegkita/backend/models"
)

// =====================================
// CREATE USER TABLES
// =====================================

func CreateUserTables() {

	query := `

	CREATE TABLE IF NOT EXISTS users (
		id UUID PRIMARY KEY,
		name VARCHAR(100),
		email VARCHAR(100) UNIQUE,
		password TEXT,
		created_at TIMESTAMP DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS user_addresses (
		id UUID PRIMARY KEY,
		user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
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

// =====================================
// CREATE USER (REGISTER) WITH UUID v7
// =====================================

func CreateUser(name, email, password string) (*models.User, error) {

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	if err != nil {

		return nil, err

	}

	userID, err := uuid.NewV7()

	if err != nil {

		return nil, err

	}

	var user models.User

	query := `
		INSERT INTO users (id, name, email, password)
		VALUES ($1, $2, $3, $4)
		RETURNING id, name, email
	`

	err = DB.QueryRow(query, userID.String(), name, email, string(hashedPassword)).Scan(&user.ID, &user.Name, &user.Email)

	if err != nil {
		if strings.Contains(err.Error(), "23505") || strings.Contains(err.Error(), "users_email_key") || strings.Contains(err.Error(), "duplicate key") {
			return nil, errors.New("Email ini sudah terdaftar")
		}

		return nil, err

	}

	return &user, nil

}

// =====================================
// AUTHENTICATE USER (LOGIN)
// =====================================

func AuthenticateUser(email, password string) (*models.User, error) {

	var user models.User

	var storedPassword string

	query := `
		SELECT id, name, email, password
		FROM users
		WHERE email = $1
	`

	err := DB.QueryRow(query, email).Scan(&user.ID, &user.Name, &user.Email, &storedPassword)

	if err != nil {

		return nil, errors.New("email atau password salah")

	}

	err = bcrypt.CompareHashAndPassword([]byte(storedPassword), []byte(password))

	if err != nil {

		return nil, errors.New("email atau password salah")

	}

	return &user, nil

}

