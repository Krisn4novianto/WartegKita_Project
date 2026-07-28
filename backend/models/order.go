package models

import "time"

type Order struct {
	ID            string    `json:"id"`
	OrderNumber   string    `json:"order_number"`
	UserID        string    `json:"user_id"`
	Status        string    `json:"status"`
	TotalAmount   float64   `json:"total_amount"`
	PaymentMethod string    `json:"payment_method"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
