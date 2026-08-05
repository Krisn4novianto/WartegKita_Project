package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ChatRoom struct {
	ID uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`

	BuyerID uuid.UUID `gorm:"type:uuid;not null;index" json:"buyer_id"`

	SellerID uuid.UUID `gorm:"type:uuid;not null;index" json:"seller_id"`

	CreatedAt time.Time `json:"created_at"`

	UpdatedAt time.Time `json:"updated_at"`
}

func (c *ChatRoom) BeforeCreate(tx *gorm.DB) (err error) {
	if c.ID == uuid.Nil {
		c.ID, err = uuid.NewV7()
	}
	return
}

type BubbleChat struct {
	ID uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`

	ChatRoomID uuid.UUID `gorm:"type:uuid;not null;index" json:"chat_room_id"`

	SenderID uuid.UUID `gorm:"type:uuid;not null;index" json:"sender_id"`

	SenderRole string `gorm:"type:varchar(20);not null" json:"sender_role"`

	Message string `gorm:"type:text;not null" json:"message"`

	CreatedAt time.Time `json:"created_at"`

	UpdatedAt time.Time `json:"updated_at"`
}

func (b *BubbleChat) BeforeCreate(tx *gorm.DB) (err error) {
	if b.ID == uuid.Nil {
		b.ID, err = uuid.NewV7()
	}
	return
}
