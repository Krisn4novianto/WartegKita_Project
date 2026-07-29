package models

import (
	"time"
)

type Menu struct {
	ID          string    `gorm:"primaryKey;type:uuid" json:"id"`
	SellerID    string    `gorm:"type:uuid;not null;index" json:"seller_id"`
	Name        string    `gorm:"size:100;not null" json:"name"`
	Description string    `gorm:"type:text" json:"description"`
	Price       float64   `gorm:"type:numeric(12,2);not null;default:0" json:"price"`
	Stock       int       `gorm:"not null;default:0" json:"stock"`
	Category    string    `gorm:"size:50;not null" json:"category"`
	Image       string    `gorm:"type:text" json:"image"`
	Available   bool      `gorm:"default:true" json:"available"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// BelongsTo SellerProfile via SellerID -> seller_profiles.seller_id
	Seller *SellerProfile `gorm:"foreignKey:SellerID;references:SellerID;constraint:OnDelete:CASCADE" json:"-"`
}

type MenuCategory struct {
	ID        string    `gorm:"primaryKey;type:uuid" json:"id"`
	Name      string    `gorm:"size:100;not null;unique" json:"name"`
	Emoji     string    `gorm:"size:20;not null" json:"emoji"`
	IsActive  bool      `gorm:"not null;default:true" json:"is_active"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}
