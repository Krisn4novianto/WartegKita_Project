package models

import (
	"time"
)

type SellerProfile struct {
	ID            string    `gorm:"primaryKey;type:uuid" json:"id"`
	SellerID      string    `gorm:"type:uuid;uniqueIndex;not null" json:"seller_id"`
	NamaWarteg    string    `gorm:"size:100" json:"nama_warteg"`
	NamaPemilik   string    `gorm:"size:100" json:"nama_pemilik"`
	NomorHP       string    `gorm:"size:30" json:"nomor_hp"`
	Alamat        string    `gorm:"type:text" json:"alamat"`
	Deskripsi     string    `gorm:"type:text" json:"deskripsi"`
	Bank          string    `gorm:"size:50" json:"bank"`
	NomorRekening string    `gorm:"size:50" json:"nomor_rekening"`
	UpdatedAt     time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

type CustomerSeller struct {
	ID          string  `json:"id"`
	StoreName   string  `json:"store_name"`
	Description string  `json:"description"`
	Address     string  `json:"address"`
	Owner       string  `json:"owner"`
	Phone       string  `json:"phone"`
	Rating      float64 `json:"rating"`
}
