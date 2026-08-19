package models

import "time"

// =====================================================
// POINT TRANSACTION TYPE
// =====================================================

const (
	PointTransactionEarn       = "EARN"
	PointTransactionRedeem     = "REDEEM"
	PointTransactionExpire     = "EXPIRE"
	PointTransactionAdjustment = "ADJUSTMENT"
)

// =====================================================
// POINT TRANSACTION
// =====================================================

type PointTransaction struct {
	ID string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`

	UserID string `gorm:"type:uuid;not null;index" json:"user_id"`

	Type string `gorm:"size:20;not null;index" json:"type"`

	Amount int `gorm:"not null" json:"amount"`

	Source string `gorm:"size:50;not null" json:"source"`

	ReferenceID string `gorm:"size:100;index" json:"reference_id"`

	Description string `gorm:"type:text" json:"description"`

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`

	User *User `gorm:"foreignKey:UserID;references:ID" json:"-"`
}
