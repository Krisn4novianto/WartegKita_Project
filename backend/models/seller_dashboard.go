package models

type SellerDashboard struct {
	TotalPendapatan float64 `json:"total_pendapatan"`

	TotalPembeli int `json:"total_pembeli"`

	TotalTransaksi int `json:"total_transaksi"`

	RataRataHarian float64 `json:"rata_rata_harian"`
}
