package models

import (
	"time"

	"github.com/google/uuid"
)

type SellerVerification struct {
	ID uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`

	SellerID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex"`

	KTPNumber string `gorm:"type:varchar(16);not null"`

	KTPImage string `gorm:"type:text;not null"`

	Status string `gorm:"type:varchar(20);not null;default:'PENDING'"`

	VerifiedAt *time.Time

	CreatedAt time.Time

	UpdatedAt time.Time
}
