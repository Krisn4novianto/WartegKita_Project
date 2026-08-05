package models

import "time"

type PasswordResetOTP struct {
	ID        string `gorm:"type:uuid;primaryKey"`
	UserID    string `gorm:"type:uuid;not null"`
	OTP       string `gorm:"type:varchar(6);not null"`
	ExpiredAt time.Time
	IsUsed    bool `gorm:"default:false"`
	CreatedAt time.Time
	User      User `gorm:"foreignKey:UserID"`
}
