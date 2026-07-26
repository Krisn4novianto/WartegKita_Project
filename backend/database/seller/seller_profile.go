package seller

import (
	"github.com/krisn4novianto/wartegkita/backend/database"
)

// =====================================
// SELLER PROFILE MODEL
// =====================================

type SellerProfile struct {
	ID            int    `json:"id"`
	SellerID      int    `json:"seller_id"`
	NamaWarteg    string `json:"nama_warteg"`
	NamaPemilik   string `json:"nama_pemilik"`
	NomorHP       string `json:"nomor_hp"`
	Alamat        string `json:"alamat"`
	Deskripsi     string `json:"deskripsi"`
	Bank          string `json:"bank"`
	NomorRekening string `json:"nomor_rekening"`
}

type CustomerSeller struct {
	ID          int     `json:"id"`
	StoreName   string  `json:"store_name"`
	Description string  `json:"description"`
	Address     string  `json:"address"`
	Owner       string  `json:"owner"`
	Phone       string  `json:"phone"`
	Rating      float64 `json:"rating"`
}

// =====================================
// GET SELLER PROFILE
// =====================================

func GetProfile(sellerID string) (SellerProfile, error) {

	var profile SellerProfile

	err := database.SellerDB.QueryRow(

		`
		SELECT
			id,
			seller_id,
			nama_warteg,
			nama_pemilik,
			nomor_hp,
			alamat,
			deskripsi,
			bank,
			nomor_rekening
		FROM seller_profile
		WHERE seller_id = $1
		`,
		sellerID,
	).Scan(

		&profile.ID,
		&profile.SellerID,
		&profile.NamaWarteg,
		&profile.NamaPemilik,
		&profile.NomorHP,
		&profile.Alamat,
		&profile.Deskripsi,
		&profile.Bank,
		&profile.NomorRekening,
	)

	return profile, err
}

// =====================================
// SAVE / UPDATE PROFILE
// =====================================

func SaveProfile(
	sellerID string,
	data SellerProfile,
) error {

	_, err := database.SellerDB.Exec(

		`
		INSERT INTO seller_profile
		(
			seller_id,
			nama_warteg,
			nama_pemilik,
			nomor_hp,
			alamat,
			deskripsi,
			bank,
			nomor_rekening,
			updated_at
		)
		VALUES
		(
			$1,
			$2,
			$3,
			$4,
			$5,
			$6,
			$7,
			$8,
			NOW()
		)

		ON CONFLICT (seller_id)
		DO UPDATE SET
			nama_warteg = EXCLUDED.nama_warteg,
			nama_pemilik = EXCLUDED.nama_pemilik,
			nomor_hp = EXCLUDED.nomor_hp,
			alamat = EXCLUDED.alamat,
			deskripsi = EXCLUDED.deskripsi,
			bank = EXCLUDED.bank,
			nomor_rekening = EXCLUDED.nomor_rekening,
			updated_at = NOW()
		`,

		sellerID,
		data.NamaWarteg,
		data.NamaPemilik,
		data.NomorHP,
		data.Alamat,
		data.Deskripsi,
		data.Bank,
		data.NomorRekening,
	)

	return err
}

// =====================================
// GET ALL SELLERS
// =====================================

func GetAllProfiles() ([]CustomerSeller, error) {

	rows, err := database.SellerDB.Query(`
		SELECT
			seller_id,
			nama_warteg,
			deskripsi,
			alamat,
			nama_pemilik,
			nomor_hp
		FROM seller_profile
		ORDER BY nama_warteg
	`)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var sellers []CustomerSeller

	for rows.Next() {

		var s CustomerSeller

		err := rows.Scan(
			&s.ID,
			&s.StoreName,
			&s.Description,
			&s.Address,
			&s.Owner,
			&s.Phone,
		)
		if err != nil {
			return nil, err
		}

		s.Rating = 0

		sellers = append(sellers, s)
	}

	return sellers, nil
}
