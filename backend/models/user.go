package models

import "time"

// ========================================
// USER
// ========================================

type User struct {
	ID string `gorm:"primaryKey;type:uuid" json:"id" example:"018f4a12-89cd-7b1e-9a2c-3f4e56789abc"`

	Name string `gorm:"size:100" json:"name" example:"Budi Santoso"`

	Email string `gorm:"size:100;uniqueIndex;not null" json:"email" example:"budi@example.com"`

	Password string `gorm:"type:text" json:"-"`

	// customer / seller / admin
	Role string `gorm:"size:20;default:'customer';not null" json:"role" example:"customer"`

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}
