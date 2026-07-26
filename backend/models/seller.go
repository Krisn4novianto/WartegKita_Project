package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type Seller struct {
	ID bson.ObjectID `bson:"_id,omitempty" json:"id"`

	StoreName string `bson:"store_name" json:"store_name"`

	Description string `bson:"description" json:"description"`

	Address string `bson:"address" json:"address"`

	Phone string `bson:"phone" json:"phone"`

	Image string `bson:"image" json:"image"`

	IsOpen bool `bson:"is_open" json:"is_open"`

	Rating float64 `bson:"rating" json:"rating"`

	DistanceKM float64 `bson:"distance_km" json:"distance_km"`

	Latitude float64 `bson:"latitude" json:"latitude"`

	Longitude float64 `bson:"longitude" json:"longitude"`

	CreatedAt time.Time `bson:"created_at" json:"created_at"`

	UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
}
