package models

// ========================================
// USER
// ========================================

type User struct {
	ID string `json:"id" example:"018f4a12-89cd-7b1e-9a2c-3f4e56789abc"`

	Name string `json:"name" example:"Budi Santoso"`

	Email string `json:"email" example:"budi@example.com"`

	Password string `json:"-"`
}
