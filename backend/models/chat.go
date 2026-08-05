package models

import (
	"time"

	"github.com/google/uuid"
)

type ChatRoom struct {
	ID uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`

	BuyerID uuid.UUID `gorm:"type:uuid;not null;index" json:"buyer_id"`

	SellerID uuid.UUID `gorm:"type:uuid;not null;index" json:"seller_id"`

	CreatedAt time.Time `json:"created_at"`

	UpdatedAt time.Time `json:"updated_at"`
}

type BubbleChat struct {
	ID uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`

	ChatRoomID uuid.UUID `gorm:"type:uuid;not null;index" json:"chat_room_id"`

	SenderID uuid.UUID `gorm:"type:uuid;not null;index" json:"sender_id"`

	SenderRole string `gorm:"type:varchar(20);not null" json:"sender_role"`

	Message string `gorm:"type:text;not null" json:"message"`

	CreatedAt time.Time `json:"created_at"`

	UpdatedAt time.Time `json:"updated_at"`
}
