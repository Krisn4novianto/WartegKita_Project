package database

import (
	"errors"
	"time"

	"github.com/google/uuid"

	"github.com/krisn4novianto/wartegkita/backend/models"
)

func CreatePasswordResetOTP(
	userID string,
	otp string,
) error {

	id, _ := uuid.NewV7()

	reset := models.PasswordResetOTP{

		ID: id.String(),

		UserID: userID,

		OTP: otp,

		ExpiredAt: time.Now().Add(
			10 * time.Minute,
		),

		IsUsed: false,
	}

	return DB.Create(&reset).Error

}

func VerifyOTP(
	email string,
	otp string,
) (*models.User, error) {

	var user models.User

	err := DB.
		Where(
			"email=?",
			email,
		).
		First(&user).
		Error

	if err != nil {

		return nil,
			errors.New(
				"user tidak ditemukan",
			)

	}

	var reset models.PasswordResetOTP

	err =
		DB.
			Where(
				"user_id=? AND otp=? AND is_used=false",
				user.ID,
				otp,
			).
			First(&reset).
			Error

	if err != nil {

		return nil,
			errors.New(
				"OTP tidak valid",
			)

	}

	if time.Now().After(
		reset.ExpiredAt,
	) {

		return nil,
			errors.New(
				"OTP sudah expired",
			)

	}

	return &user, nil

}
