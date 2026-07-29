package models

import "time"

type Order struct {
	ID            string      `gorm:"primaryKey;type:uuid" json:"id"`
	OrderNumber   string      `gorm:"size:50;uniqueIndex;not null" json:"order_number"`
	UserID        string      `gorm:"type:uuid;not null;index" json:"user_id"`
	SellerID      string      `gorm:"type:uuid;not null;index" json:"seller_id"`
	Status        string      `gorm:"size:30;not null;default:'WAITING_CONFIRMATION'" json:"status"`
	PaymentStatus string      `gorm:"size:20;not null;default:'PENDING'" json:"payment_status"`
	TotalAmount   float64     `gorm:"type:numeric(12,2);not null;default:0" json:"total_amount"`
	PaymentMethod string      `gorm:"size:50" json:"payment_method"`
	CreatedAt     time.Time   `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt     time.Time   `gorm:"autoUpdateTime" json:"updated_at"`

	// Associations
	Items  []OrderItem    `gorm:"foreignKey:OrderID;constraint:OnDelete:CASCADE" json:"items,omitempty"`
	User   *User          `gorm:"foreignKey:UserID;constraint:OnDelete:SET NULL" json:"-"`
	Seller *SellerProfile `gorm:"foreignKey:SellerID;references:SellerID;constraint:OnDelete:SET NULL" json:"-"`
}

type OrderItem struct {
	ID        string    `gorm:"primaryKey;type:uuid" json:"id"`
	OrderID   string    `gorm:"type:uuid;not null;index" json:"order_id"`
	MenuID    string    `gorm:"type:uuid;not null;index" json:"menu_id"`
	MenuName  string    `gorm:"size:100;not null" json:"menu_name"`
	Quantity  int       `gorm:"not null;default:1" json:"quantity"`
	Price     float64   `gorm:"type:numeric(12,2);not null;default:0" json:"price"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`

	// Associations
	Order *Order `gorm:"foreignKey:OrderID;constraint:OnDelete:CASCADE" json:"-"`
	Menu  *Menu  `gorm:"foreignKey:MenuID;constraint:OnDelete:RESTRICT" json:"-"`
}
