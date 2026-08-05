package database

import (
	"errors"
	"net/mail"
	"regexp"
	"strings"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/krisn4novianto/wartegkita/backend/models"
)

// ========================================
// CREATE USER TABLE
// ========================================

func CreateUserTables() {

	DB.AutoMigrate(
		&models.User{},
		&models.UserAddress{},
	)

}

// ========================================
// REGISTER USER
// ========================================

func CreateUser(
	name string,
	email string,
	password string,
	role string,
) (*models.User, error) {

	name = strings.TrimSpace(name)

	email = strings.ToLower(
		strings.TrimSpace(email),
	)

	role = strings.ToLower(
		strings.TrimSpace(role),
	)

	// ==========================
	// VALIDASI NAME
	// ==========================

	if name == "" {

		return nil,
			errors.New(
				"nama wajib diisi",
			)

	}

	if len(name) < 3 {

		return nil,
			errors.New(
				"nama minimal 3 karakter",
			)

	}

	// ==========================
	// VALIDASI EMAIL
	// ==========================

	if email == "" {

		return nil,
			errors.New(
				"email wajib diisi",
			)

	}

	if _, err := mail.ParseAddress(email); err != nil {

		return nil,
			errors.New(
				"format email tidak valid",
			)

	}

	// ==========================
	// VALIDASI ROLE
	// ==========================

	if role == "" {

		role = "customer"

	}

	if role != "customer" &&
		role != "seller" {

		return nil,
			errors.New(
				"role tidak valid",
			)

	}

	// ==========================
	// VALIDASI PASSWORD
	// ==========================

	if password == "" {

		return nil,
			errors.New(
				"password wajib diisi",
			)

	}

	if err := ValidatePassword(password); err != nil {

		return nil, err

	}

	// ==========================
	// HASH PASSWORD
	// ==========================

	hash, err :=
		bcrypt.GenerateFromPassword(
			[]byte(password),
			bcrypt.DefaultCost,
		)

	if err != nil {

		return nil, err

	}

	// ==========================
	// UUID
	// ==========================

	id, err :=
		uuid.NewV7()

	if err != nil {

		return nil, err

	}

	user := models.User{

		ID:       id.String(),
		Name:     name,
		Email:    email,
		Password: string(hash),
		Role:     role,
	}

	// ==========================
	// SAVE USER
	// ==========================

	if err :=
		DB.Create(&user).Error; err != nil {

		if strings.Contains(
			err.Error(),
			"duplicate",
		) {

			return nil,
				errors.New(
					"email sudah terdaftar",
				)

		}

		return nil, err

	}

	return &user, nil

}

// ========================================
// LOGIN
// ========================================

func AuthenticateUser(
	email string,
	password string,
) (*models.User, error) {

	email =
		strings.ToLower(
			strings.TrimSpace(email),
		)

	var user models.User

	err :=
		DB.
			Where(
				"email=?",
				email,
			).
			First(
				&user,
			).
			Error

	if err != nil {

		return nil,
			errors.New(
				"email atau password salah",
			)

	}

	err =
		bcrypt.CompareHashAndPassword(
			[]byte(user.Password),
			[]byte(password),
		)

	if err != nil {

		return nil,
			errors.New(
				"email atau password salah",
			)

	}

	return &user, nil

}

// ========================================
// VALIDATE PASSWORD
// ========================================

func ValidatePassword(
	password string,
) error {

	if len(password) < 8 {

		return errors.New(
			"password minimal 8 karakter",
		)

	}

	hasUpper :=
		regexp.MustCompile(`[A-Z]`).
			MatchString(password)

	hasLower :=
		regexp.MustCompile(`[a-z]`).
			MatchString(password)

	hasNumber :=
		regexp.MustCompile(`[0-9]`).
			MatchString(password)

	hasSpecial :=
		regexp.MustCompile(
			`[!@#$%^&*(),.?":{}|<>_\-+=/\\[\]()]`,
		).
			MatchString(password)

	if !hasUpper ||
		!hasLower ||
		!hasNumber ||
		!hasSpecial {

		return errors.New(
			"password harus mengandung huruf besar, kecil, angka, karakter khusus",
		)

	}

	return nil

}

// ========================================
// GET USER BY EMAIL
// ========================================

func GetUserByEmail(
	email string,
) (*models.User, error) {

	email =
		strings.ToLower(
			strings.TrimSpace(email),
		)

	var user models.User

	err :=
		DB.
			Where(
				"email=?",
				email,
			).
			First(
				&user,
			).
			Error

	if err != nil {

		return nil,
			errors.New(
				"user tidak ditemukan",
			)

	}

	return &user, nil

}

// ========================================
// UPDATE PASSWORD
// ========================================

func UpdatePassword(
	userID string,
	newPassword string,
) error {

	if err := ValidatePassword(newPassword); err != nil {

		return err

	}

	hash, err :=
		bcrypt.GenerateFromPassword(
			[]byte(newPassword),
			bcrypt.DefaultCost,
		)

	if err != nil {

		return err

	}

	result :=
		DB.
			Model(
				&models.User{},
			).
			Where(
				"id=?",
				userID,
			).
			Update(
				"password",
				string(hash),
			)

	if result.Error != nil {

		return result.Error

	}

	if result.RowsAffected == 0 {

		return errors.New(
			"user tidak ditemukan",
		)

	}

	return nil

}
