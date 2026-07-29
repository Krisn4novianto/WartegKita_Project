package database

import (
	"errors"
	"strings"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/krisn4novianto/wartegkita/backend/models"
)

// CreateUserTables handles model migrations via GORM
func CreateUserTables() {
	DB.AutoMigrate(&models.User{}, &models.UserAddress{})
}

// CreateUser (REGISTER) WITH UUID v7 using GORM
func CreateUser(name, email, password string) (*models.User, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	userID, err := uuid.NewV7()
	if err != nil {
		return nil, err
	}

	user := models.User{
		ID:       userID.String(),
		Name:     name,
		Email:    email,
		Password: string(hashedPassword),
	}

	if err := DB.Create(&user).Error; err != nil {
		if strings.Contains(err.Error(), "23505") || strings.Contains(err.Error(), "users_email_key") || strings.Contains(err.Error(), "duplicate key") {
			return nil, errors.New("Email ini sudah terdaftar")
		}
		return nil, err
	}

	return &user, nil
}

// AuthenticateUser (LOGIN) using GORM
func AuthenticateUser(email, password string) (*models.User, error) {
	var user models.User
	if err := DB.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, errors.New("email atau password salah")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, errors.New("email atau password salah")
	}

	return &user, nil
}


