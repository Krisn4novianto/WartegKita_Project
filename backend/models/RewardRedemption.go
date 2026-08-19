package models

import "time"

// =====================================================
// REWARD REDEMPTION STATUS
// =====================================================

const (
	RewardRedemptionActive  = "ACTIVE"
	RewardRedemptionUsed    = "USED"
	RewardRedemptionExpired = "EXPIRED"
)

// =====================================================
// REWARD REDEMPTION
// =====================================================

type RewardRedemption struct {
	ID string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`

	UserID string `gorm:"type:uuid;not null;index" json:"user_id"`

	RewardID string `gorm:"type:uuid;not null;index" json:"reward_id"`

	PointsSpent int `gorm:"not null" json:"points_spent"`

	VoucherCode string `gorm:"size:50;uniqueIndex;not null" json:"voucher_code"`

	Status string `gorm:"size:20;not null;default:'ACTIVE';index" json:"status"`

	ExpiresAt *time.Time `json:"expires_at"`

	UsedAt *time.Time `json:"used_at"`

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`

	User *User `gorm:"foreignKey:UserID;references:ID" json:"-"`

	Reward *Reward `gorm:"foreignKey:RewardID;references:ID" json:"reward,omitempty"`
}
