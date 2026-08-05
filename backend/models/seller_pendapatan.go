package models

import "time"

type SellerPendapatan struct {
	ID                string    `gorm:"primaryKey;type:uuid" json:"id"`
	TransactionID     string    `gorm:"type:uuid" json:"transaction_id"`
	SellerID          string    `gorm:"type:uuid;not null;index" json:"seller_id"`
	TransactionDate   time.Time `gorm:"type:date;not null" json:"transaction_date"`
	GrossAmount       float64   `gorm:"type:numeric(12,2);default:0" json:"gross_amount"`
	TotalTransaction  int       `gorm:"default:0" json:"total_transaction"`
	TotalCustomer     int       `gorm:"default:0" json:"total_customer"`
	TransactionStatus string    `gorm:"size:50;not null" json:"transaction_status"`
	CreatedAt         time.Time `gorm:"autoCreateTime" json:"created_at"`
	LastAt            time.Time `gorm:"autoUpdateTime" json:"last_at"`

	// BelongsTo SellerProfile via SellerID -> seller_profiles.seller_id
	Seller *SellerProfile `gorm:"foreignKey:SellerID;references:SellerID;constraint:OnDelete:CASCADE" json:"-"`
}
