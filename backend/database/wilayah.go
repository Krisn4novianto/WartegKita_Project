package database

import "gorm.io/gorm"

type Wilayah struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

func GetProvinces() ([]Wilayah, error) {
	var provinces []Wilayah
	err := DB.Table("provinces").Select("id, name").Order("name ASC").Find(&provinces).Error
	return provinces, err
}

func GetCities(provinceID int) ([]Wilayah, error) {
	var cities []Wilayah
	err := DB.Table("cities").Select("id, name").Where("province_id = ?", provinceID).Order("name ASC").Find(&cities).Error
	return cities, err
}

func GetDistricts(cityID int) ([]Wilayah, error) {
	var districts []Wilayah
	err := DB.Table("districts").Select("id, name").Where("city_id = ?", cityID).Order("name ASC").Find(&districts).Error
	return districts, err
}

func GetProvinceByID(id int) (*Wilayah, error) {
	var p Wilayah
	err := DB.Table("provinces").Select("id, name").Where("id = ?", id).First(&p).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func GetCityByID(id int) (*Wilayah, error) {
	var c Wilayah
	err := DB.Table("cities").Select("id, name").Where("id = ?", id).First(&c).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func GetDistrictByID(id int) (*Wilayah, error) {
	var d Wilayah
	err := DB.Table("districts").Select("id, name").Where("id = ?", id).First(&d).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &d, nil
}

