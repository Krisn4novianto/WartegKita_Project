package models

import "time"

type UserAddress struct {
	ID           string    `gorm:"primaryKey;type:uuid" json:"id"`
	UserID       string    `gorm:"type:uuid;uniqueIndex;not null" json:"user_id"`
	Label        string    `gorm:"size:50" json:"label"`
	Detail       string    `gorm:"type:text" json:"detail"`
	ProvinceID   int       `json:"province_id"`
	ProvinceName string    `gorm:"size:100" json:"province_name"`
	CityID       int       `json:"city_id"`
	CityName     string    `gorm:"size:100" json:"city_name"`
	DistrictID   int       `json:"district_id"`
	DistrictName string    `gorm:"size:100" json:"district_name"`
	PostalCode   string    `gorm:"size:20" json:"postal_code"`
	Note         string    `gorm:"type:text" json:"note"`
	Latitude     float64   `json:"latitude"`
	Longitude    float64   `json:"longitude"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// FK to users.id  navigation field only for constraint; excluded from migrations via -:migration
	User *User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
}
