package models

import "time"

// =====================================================
// REWARD
// =====================================================
//
// Reward adalah hadiah yang dapat ditukarkan customer
// menggunakan loyalty points.
//
// Contoh:
// - Voucher Rp5.000
// - Voucher Rp10.000
// - Voucher Rp25.000
//
// =====================================================

type Reward struct {
	ID string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`

	// =================================================
	// REWARD INFORMATION
	// =================================================

	Name string `gorm:"size:150;not null" json:"name"`

	Description string `gorm:"type:text" json:"description"`

	ImageURL string `gorm:"size:500" json:"image_url"`

	// =================================================
	// LOYALTY POINT
	// =================================================
	//
	// Jumlah point yang dibutuhkan customer
	// untuk menukarkan reward.
	//
	// =================================================

	PointCost int `gorm:"not null;default:0" json:"point_cost"`

	// =================================================
	// DISCOUNT
	// =================================================
	//
	// Contoh:
	//
	// FIXED      -> Rp5.000
	// PERCENTAGE -> 20%
	//
	// =================================================

	DiscountType string `gorm:"size:20;not null;default:'FIXED'" json:"discount_type"`

	DiscountValue int64 `gorm:"not null;default:0" json:"discount_value"`

	// =================================================
	// ORDER REQUIREMENT
	// =================================================
	//
	// Minimum total order agar voucher dapat digunakan.
	//
	// Contoh:
	//
	// Voucher Rp5.000
	// Minimum order Rp25.000
	//
	// =================================================

	MinimumOrder int64 `gorm:"not null;default:0" json:"minimum_order"`

	// =================================================
	// MAXIMUM DISCOUNT
	// =================================================
	//
	// Berguna untuk voucher percentage.
	//
	// Contoh:
	//
	// DiscountType  = PERCENTAGE
	// DiscountValue = 20
	// MaximumDiscount = 10000
	//
	// Artinya maksimal potongan Rp10.000.
	//
	// Untuk voucher FIXED, nilainya dapat disamakan
	// dengan DiscountValue.
	//
	// =================================================

	MaximumDiscount int64 `gorm:"not null;default:0" json:"maximum_discount"`

	// =================================================
	// STOCK
	// =================================================
	//
	// -1 = unlimited
	//  0 = habis
	// >0 = jumlah tersedia
	//
	// =================================================

	Stock int `gorm:"not null;default:0" json:"stock"`

	// =================================================
	// STATUS
	// =================================================

	IsActive bool `gorm:"not null;default:true;index" json:"is_active"`

	// =================================================
	// VALIDITY
	// =================================================

	StartAt *time.Time `json:"start_at"`

	EndAt *time.Time `json:"end_at"`

	// =================================================
	// TIMESTAMP
	// =================================================

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`

	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// =================================================
	// RELATION
	// =================================================

	Redemptions []RewardRedemption `gorm:"foreignKey:RewardID;references:ID" json:"-"`
}
