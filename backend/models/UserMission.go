package models

import "time"

// =====================================================
// USER MISSION
// =====================================================

type UserMission struct {
	ID string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`

	UserID string `gorm:"type:uuid;not null;index" json:"user_id"`

	MissionID string `gorm:"type:uuid;not null;index" json:"mission_id"`

	Progress int `gorm:"not null;default:0" json:"progress"`

	Completed bool `gorm:"not null;default:false" json:"completed"`

	CompletedAt *time.Time `json:"completed_at"`

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`

	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	User *User `gorm:"foreignKey:UserID;references:ID" json:"-"`

	Mission *Mission `gorm:"foreignKey:MissionID;references:ID" json:"mission,omitempty"`
}
