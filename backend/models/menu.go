package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type Menu struct {
	ID bson.ObjectID `bson:"_id,omitempty" json:"id"`

	SellerID bson.ObjectID `bson:"seller_id" json:"seller_id"`

	Name string `bson:"name" json:"name"`

	Description string `bson:"description" json:"description"`

	Category string `bson:"category" json:"category"`

	Price int64 `bson:"price" json:"price"`

	Image string `bson:"image" json:"image"`

	IsAvailable bool `bson:"is_available" json:"is_available"`

	CreatedAt time.Time `bson:"created_at" json:"created_at"`

	UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
}
