package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// =====================================================
// ORDER STATUS HISTORY
// =====================================================

type OrderStatusHistory struct {
	ID string `gorm:"type:uuid;primaryKey" json:"id"`

	OrderID string `gorm:"type:uuid;not null;index" json:"order_id"`

	Status string `gorm:"type:varchar(50);not null;index" json:"status"`

	Note string `gorm:"type:text" json:"note"`

	ChangedBy string `gorm:"type:varchar(50);not null;default:'system'" json:"changed_by"`

	CreatedAt time.Time `gorm:"not null;default:CURRENT_TIMESTAMP" json:"created_at"`
}

// =====================================================
// TABLE NAME
// =====================================================

func (OrderStatusHistory) TableName() string {
	return "order_status_histories"
}

// =====================================================
// BEFORE CREATE
// =====================================================

func (h *OrderStatusHistory) BeforeCreate(tx *gorm.DB) error {

	if h.ID == "" {

		id, err := uuid.NewV7()

		if err != nil {
			return err
		}

		h.ID = id.String()
	}

	return nil
}
