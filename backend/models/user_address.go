package models

type UserAddress struct {
	ID int `json:"id"`

	UserID int `json:"user_id"`

	Label string `json:"label"`

	Detail string `json:"detail"`

	ProvinceID   int    `json:"province_id"`
	ProvinceName string `json:"province_name"`

	CityID   int    `json:"city_id"`
	CityName string `json:"city_name"`

	DistrictID   int    `json:"district_id"`
	DistrictName string `json:"district_name"`

	PostalCode string `json:"postal_code"`

	Note string `json:"note"`

	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}
