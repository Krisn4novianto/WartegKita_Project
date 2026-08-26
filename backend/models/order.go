package models

import "time"

/* =====================================================
   ORDER STATUS
===================================================== */

const (
	OrderStatusWaitingConfirmation = "WAITING_CONFIRMATION"
	OrderStatusConfirmed           = "CONFIRMED"
	OrderStatusPreparing           = "PREPARING"
	OrderStatusReady               = "READY"
	OrderStatusOnDelivery          = "ON_DELIVERY"
	OrderStatusCompleted           = "COMPLETED"
	OrderStatusCancelled           = "CANCELLED"
)

/* =====================================================
   PAYMENT STATUS
===================================================== */

const (
	PaymentStatusPending = "PENDING"
	PaymentStatusPaid    = "PAID"
	PaymentStatusFailed  = "FAILED"
)

/* =====================================================
   PAYMENT METHOD
===================================================== */

const (
	PaymentMethodQRIS           = "qris"
	PaymentMethodBankTransfer   = "bank_transfer"
	PaymentMethodVirtualAccount = "virtual_account"
	PaymentMethodPaypal         = "paypal"
	PaymentMethodCOD            = "cod"
)

/* =====================================================
   ORDER
===================================================== */

type Order struct {
	ID string `gorm:"primaryKey;type:uuid" json:"id"`

	OrderNumber string `gorm:"size:50;uniqueIndex;not null" json:"order_number"`

	UserID string `gorm:"type:uuid;not null;index" json:"user_id"`

	SellerID string `gorm:"type:uuid;not null;index" json:"seller_id"`

	Status string `gorm:"size:30;not null;default:'WAITING_CONFIRMATION'" json:"status"`

	PaymentStatus string `gorm:"size:20;not null;default:'PENDING'" json:"payment_status"`

	TotalAmount float64 `gorm:"type:numeric(12,2);not null;default:0" json:"total_amount"`

	PaymentMethod string `gorm:"size:50;not null" json:"payment_method"`

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`

	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	/* =================================================
	   ASSOCIATIONS
	================================================= */

	Items []OrderItem `gorm:"foreignKey:OrderID;references:ID;constraint:OnDelete:CASCADE" json:"items,omitempty"`

	// Riwayat perubahan status order.
	StatusHistories []OrderStatusHistory `gorm:"foreignKey:OrderID;references:ID;constraint:OnDelete:CASCADE" json:"status_histories,omitempty"`

	User *User `gorm:"foreignKey:UserID;references:ID" json:"-"`

	Seller *SellerProfile `gorm:"foreignKey:SellerID;references:SellerID" json:"-"`
}

/* =====================================================
   ORDER ITEM
===================================================== */

type OrderItem struct {
	ID string `gorm:"primaryKey;type:uuid" json:"id"`

	OrderID string `gorm:"type:uuid;not null;index" json:"order_id"`

	MenuID string `gorm:"type:uuid;not null;index" json:"menu_id"`

	MenuName string `gorm:"size:100;not null" json:"menu_name"`

	Quantity int `gorm:"not null;default:1" json:"quantity"`

	Price float64 `gorm:"type:numeric(12,2);not null;default:0" json:"price"`

	Note string `gorm:"type:text" json:"note"`

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`

	Order *Order `gorm:"foreignKey:OrderID;references:ID" json:"-"`

	Menu *Menu `gorm:"foreignKey:MenuID;references:ID" json:"-"`
}
