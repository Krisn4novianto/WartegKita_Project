package seller

import (
	"log"

	"github.com/google/uuid"
	"gorm.io/gorm/clause"

	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/models"
)

type SellerProfile = models.SellerProfile
type CustomerSeller = models.CustomerSeller

func CreateSellerProfileTable() {
	if err := database.DB.AutoMigrate(&models.SellerProfile{}); err != nil {
		log.Println("Gagal membuat tabel seller_profile:", err)
		return
	}
	log.Println("✅ Tabel seller_profile siap")
}

func GetProfile(sellerID string) (SellerProfile, error) {
	var profile SellerProfile
	err := database.DB.Where("seller_id = ?", sellerID).First(&profile).Error
	return profile, err
}

func SaveProfile(sellerID string, data SellerProfile) error {
	data.SellerID = sellerID

	if data.ID == "" {
		idObj, err := uuid.NewV7()
		if err == nil {
			data.ID = idObj.String()
		}
	}

	return database.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "seller_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"nama_warteg", "nama_pemilik", "nomor_hp", "alamat", "deskripsi", "bank", "nomor_rekening", "updated_at"}),
	}).Create(&data).Error
}

func GetAllProfiles() ([]CustomerSeller, error) {
	var profiles []SellerProfile
	err := database.DB.Order("nama_warteg ASC").Find(&profiles).Error
	if err != nil {
		return nil, err
	}

	var sellers []CustomerSeller
	for _, p := range profiles {
		sellers = append(sellers, CustomerSeller{
			ID:          p.SellerID,
			StoreName:   p.NamaWarteg,
			Description: p.Deskripsi,
			Address:     p.Alamat,
			Owner:       p.NamaPemilik,
			Phone:       p.NomorHP,
			Rating:      0,
		})
	}

	return sellers, nil
}
