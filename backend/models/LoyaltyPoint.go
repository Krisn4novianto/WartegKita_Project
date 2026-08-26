package models

import "time"

// =====================================================
// USER LOYALTY POINT
// =====================================================

type UserLoyaltyPoint struct {
	ID string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`

	UserID string `gorm:"type:uuid;not null;uniqueIndex" json:"user_id"`

	Balance int `gorm:"not null;default:0" json:"balance"`

	LifetimeEarned int `gorm:"not null;default:0" json:"lifetime_earned"`

	LifetimeSpent int `gorm:"not null;default:0" json:"lifetime_spent"`

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`

	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	User *User `gorm:"foreignKey:UserID;references:ID" json:"-"`
}
