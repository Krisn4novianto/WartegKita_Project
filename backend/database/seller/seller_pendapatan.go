package seller

import (
	"database/sql"

	"github.com/krisn4novianto/wartegkita/backend/models"
)

func GetPendapatanDashboard(
	db *sql.DB,
	sellerID int,

) (*models.SellerDashboard, error) {

	var data models.SellerDashboard

	// TOTAL PENDAPATAN

	err := db.QueryRow(`


	SELECT

	COALESCE(
	SUM(gross_amount),
	0
	)


	FROM public.seller_pendapatan


	WHERE seller_id=$1


	AND transaction_status='SUCCESS'


	`,
		sellerID,
	).Scan(
		&data.TotalPendapatan,
	)

	if err != nil {
		return nil, err
	}

	// TOTAL CUSTOMER

	err = db.QueryRow(`


	SELECT


	COALESCE(
	SUM(total_customer),
	0
	)



	FROM public.seller_pendapatan



	WHERE seller_id=$1


	AND transaction_status='SUCCESS'


	`,
		sellerID,
	).Scan(
		&data.TotalPembeli,
	)

	if err != nil {
		return nil, err
	}

	// TOTAL TRANSAKSI

	err = db.QueryRow(`


	SELECT


	COALESCE(
	SUM(total_transaction),
	0
	)



	FROM public.seller_pendapatan



	WHERE seller_id=$1


	AND transaction_status='SUCCESS'


	`,
		sellerID,
	).Scan(
		&data.TotalTransaksi,
	)

	if err != nil {
		return nil, err
	}

	// RATA-RATA PENJUALAN HARIAN

	err = db.QueryRow(`


	SELECT


	COALESCE(

	SUM(gross_amount)

	/

	NULLIF(
	COUNT(DISTINCT transaction_date),
	0
	),

	0)


	FROM public.seller_pendapatan


	WHERE seller_id=$1


	AND transaction_status='SUCCESS'


	`,
		sellerID,
	).Scan(
		&data.RataRataHarian,
	)

	if err != nil {
		return nil, err
	}

	return &data, nil

}
