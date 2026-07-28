package models

type UserAddress struct {
	ID string `json:"id" example:"018f4a12-89cd-7b1e-9a2c-3f4e56789abc"`

	UserID string `json:"user_id" example:"018f4a12-89cd-7b1e-9a2c-3f4e56789abc"`

	Label string `json:"label" example:"Rumah"`

	Detail string `json:"detail" example:"Jl. Merdeka No. 10"`

	ProvinceID   int    `json:"province_id" example:"32"`
	ProvinceName string `json:"province_name" example:"Jawa Barat"`

	CityID   int    `json:"city_id" example:"3201"`
	CityName string `json:"city_name" example:"Bogor"`

	DistrictID   int    `json:"district_id" example:"320101"`
	DistrictName string `json:"district_name" example:"Kecamatan Bogor Tengah"`

	PostalCode string `json:"postal_code" example:"16111"`

	Note string `json:"note" example:"Pagar besi"`

	Latitude  float64 `json:"latitude" example:"-6.597147"`
	Longitude float64 `json:"longitude" example:"106.806038"`
}
