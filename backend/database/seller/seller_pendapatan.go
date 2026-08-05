package sellerdb

import (
	"fmt"
	"time"

	"gorm.io/gorm"

	"WartegKita/backend/models"
)

/*
=====================================================
   SELLER DASHBOARD ANALYTICS
=====================================================

SOURCE OF TRUTH:

    orders
        +
    order_items

RULE:

    Hanya orders.status = COMPLETED
    yang dihitung sebagai transaksi berhasil.

JANGAN menggunakan SellerPendapatan
sebagai sumber utama dashboard.

SellerPendapatan lama boleh tetap ada
untuk kebutuhan legacy, tetapi dashboard
mengambil data langsung dari orders.
=====================================================
*/

/* =====================================================
   RESPONSE STRUCT
===================================================== */

type DashboardSummary struct {
	TotalPendapatan float64 `json:"total_pendapatan"`

	TotalPembeli int64 `json:"total_pembeli"`

	TotalTransaksi int64 `json:"total_transaksi"`

	TotalItemTerjual int64 `json:"total_item_terjual"`

	RataRataPesanan float64 `json:"rata_rata_pesanan"`

	RataRataHarian float64 `json:"rata_rata_harian"`
}

type RevenuePoint struct {
	Date string `json:"date"`

	Revenue float64 `json:"revenue"`
}

type TransactionPoint struct {
	Date string `json:"date"`

	Transactions int64 `json:"transactions"`
}

type TopMenu struct {
	MenuID string `json:"menu_id"`

	MenuName string `json:"menu_name"`

	QuantitySold int64 `json:"quantity_sold"`

	Revenue float64 `json:"revenue"`
}

type CustomerPurchase struct {
	OrderID string `json:"order_id"`

	OrderNumber string `json:"order_number"`

	CustomerID string `json:"customer_id"`

	CustomerName string `json:"customer_name"`

	CustomerEmail string `json:"customer_email"`

	MenuName string `json:"menu_name"`

	Quantity int `json:"quantity"`

	Price float64 `json:"price"`

	Subtotal float64 `json:"subtotal"`

	TotalAmount float64 `json:"total_amount"`

	PaymentMethod string `json:"payment_method"`

	Status string `json:"status"`

	CreatedAt time.Time `json:"created_at"`
}

type DashboardAnalytics struct {
	Summary DashboardSummary `json:"summary"`

	Revenue []RevenuePoint `json:"revenue"`

	Transactions []TransactionPoint `json:"transactions"`

	TopMenus []TopMenu `json:"top_menus"`

	Purchases []CustomerPurchase `json:"purchases"`
}

/* =====================================================
   FILTER
===================================================== */

type DashboardFilter struct {
	StartDate string

	EndDate string
}

/* =====================================================
   DATE FILTER HELPER
===================================================== */

func applyDateFilter(
	query *gorm.DB,
	filter DashboardFilter,
) *gorm.DB {

	if filter.StartDate != "" {

		query = query.Where(
			"DATE(o.created_at) >= ?",
			filter.StartDate,
		)
	}

	if filter.EndDate != "" {

		query = query.Where(
			"DATE(o.created_at) <= ?",
			filter.EndDate,
		)
	}

	return query
}

/* =====================================================
   SUMMARY
===================================================== */

func GetDashboardSummary(
	db *gorm.DB,
	sellerID string,
	filter DashboardFilter,
) (DashboardSummary, error) {

	var summary DashboardSummary

	query := db.
		Table("orders o").
		Where(
			"o.seller_id = ?",
			sellerID,
		).
		Where(
			"o.status = ?",
			models.OrderStatusCompleted,
		)

	query = applyDateFilter(
		query,
		filter,
	)

	type summaryResult struct {
		TotalPendapatan float64

		TotalPembeli int64

		TotalTransaksi int64
	}

	var result summaryResult

	err := query.
		Select(`
			COALESCE(SUM(o.total_amount), 0) AS total_pendapatan,
			COUNT(DISTINCT o.user_id) AS total_pembeli,
			COUNT(o.id) AS total_transaksi
		`).
		Scan(&result).
		Error

	if err != nil {
		return summary, err
	}

	summary.TotalPendapatan = result.TotalPendapatan

	summary.TotalPembeli = result.TotalPembeli

	summary.TotalTransaksi = result.TotalTransaksi

	/* =================================================
	   TOTAL ITEM TERJUAL
	================================================= */

	itemQuery := db.
		Table("order_items oi").
		Joins(`
			INNER JOIN orders o
				ON o.id = oi.order_id
		`).
		Where(
			"o.seller_id = ?",
			sellerID,
		).
		Where(
			"o.status = ?",
			models.OrderStatusCompleted,
		)

	if filter.StartDate != "" {

		itemQuery = itemQuery.Where(
			"DATE(o.created_at) >= ?",
			filter.StartDate,
		)
	}

	if filter.EndDate != "" {

		itemQuery = itemQuery.Where(
			"DATE(o.created_at) <= ?",
			filter.EndDate,
		)
	}

	err = itemQuery.
		Select(`
			COALESCE(SUM(oi.quantity), 0)
		`).
		Scan(&summary.TotalItemTerjual).
		Error

	if err != nil {
		return summary, err
	}

	/* =================================================
	   AVERAGE ORDER
	================================================= */

	if summary.TotalTransaksi > 0 {

		summary.RataRataPesanan =
			summary.TotalPendapatan /
				float64(summary.TotalTransaksi)
	}

	/* =================================================
	   AVERAGE DAILY REVENUE
	================================================= */

	type DailyRevenue struct {
		Revenue float64
	}

	var dailyRevenue []DailyRevenue

	err = query.
		Select(`
			DATE(o.created_at) AS transaction_date,
			SUM(o.total_amount) AS revenue
		`).
		Group(
			"DATE(o.created_at)",
		).
		Scan(&dailyRevenue).
		Error

	if err != nil {
		return summary, err
	}

	if len(dailyRevenue) > 0 {

		summary.RataRataHarian =
			summary.TotalPendapatan /
				float64(len(dailyRevenue))
	}

	return summary, nil
}

/* =====================================================
   REVENUE CHART
===================================================== */

func GetRevenueChart(
	db *gorm.DB,
	sellerID string,
	filter DashboardFilter,
) ([]RevenuePoint, error) {

	var data []RevenuePoint

	query := db.
		Table("orders o").
		Select(`
			TO_CHAR(DATE(o.created_at), 'YYYY-MM-DD') AS date,
			COALESCE(SUM(o.total_amount), 0) AS revenue
		`).
		Where(
			"o.seller_id = ?",
			sellerID,
		).
		Where(
			"o.status = ?",
			models.OrderStatusCompleted,
		)

	query = applyDateFilter(
		query,
		filter,
	)

	err := query.
		Group(
			"DATE(o.created_at)",
		).
		Order(
			"DATE(o.created_at) ASC",
		).
		Scan(&data).
		Error

	return data, err
}

/* =====================================================
   TRANSACTION CHART
===================================================== */

func GetTransactionChart(
	db *gorm.DB,
	sellerID string,
	filter DashboardFilter,
) ([]TransactionPoint, error) {

	var data []TransactionPoint

	query := db.
		Table("orders o").
		Select(`
			TO_CHAR(DATE(o.created_at), 'YYYY-MM-DD') AS date,
			COUNT(o.id) AS transactions
		`).
		Where(
			"o.seller_id = ?",
			sellerID,
		).
		Where(
			"o.status = ?",
			models.OrderStatusCompleted,
		)

	query = applyDateFilter(
		query,
		filter,
	)

	err := query.
		Group(
			"DATE(o.created_at)",
		).
		Order(
			"DATE(o.created_at) ASC",
		).
		Scan(&data).
		Error

	return data, err
}

/* =====================================================
   TOP MENU
===================================================== */

func GetTopMenus(
	db *gorm.DB,
	sellerID string,
	filter DashboardFilter,
) ([]TopMenu, error) {

	var menus []TopMenu

	query := db.
		Table("order_items oi").
		Select(`
			oi.menu_id,
			oi.menu_name,
			COALESCE(SUM(oi.quantity), 0) AS quantity_sold,
			COALESCE(
				SUM(oi.quantity * oi.price),
				0
			) AS revenue
		`).
		Joins(`
			INNER JOIN orders o
				ON o.id = oi.order_id
		`).
		Where(
			"o.seller_id = ?",
			sellerID,
		).
		Where(
			"o.status = ?",
			models.OrderStatusCompleted,
		)

	if filter.StartDate != "" {

		query = query.Where(
			"DATE(o.created_at) >= ?",
			filter.StartDate,
		)
	}

	if filter.EndDate != "" {

		query = query.Where(
			"DATE(o.created_at) <= ?",
			filter.EndDate,
		)
	}

	err := query.
		Group(
			"oi.menu_id, oi.menu_name",
		).
		Order(
			"quantity_sold DESC",
		).
		Limit(10).
		Scan(&menus).
		Error

	return menus, err
}

/* =====================================================
   CUSTOMER PURCHASES
===================================================== */

func GetCustomerPurchases(
	db *gorm.DB,
	sellerID string,
	filter DashboardFilter,
	search string,
) ([]CustomerPurchase, error) {

	var purchases []CustomerPurchase

	query := db.
		Table("orders o").
		Select(`
			o.id AS order_id,
			o.order_number,
			o.user_id AS customer_id,

			COALESCE(
				u.name,
				'Customer'
			) AS customer_name,

			COALESCE(
				u.email,
				''
			) AS customer_email,

			oi.menu_name,
			oi.quantity,
			oi.price,

			(
				oi.quantity * oi.price
			) AS subtotal,

			o.total_amount,
			o.payment_method,
			o.status,
			o.created_at
		`).
		Joins(`
			INNER JOIN order_items oi
				ON oi.order_id = o.id
		`).
		Joins(`
			LEFT JOIN users u
				ON u.id = o.user_id
		`).
		Where(
			"o.seller_id = ?",
			sellerID,
		).
		Where(
			"o.status = ?",
			models.OrderStatusCompleted,
		)

	if filter.StartDate != "" {

		query = query.Where(
			"DATE(o.created_at) >= ?",
			filter.StartDate,
		)
	}

	if filter.EndDate != "" {

		query = query.Where(
			"DATE(o.created_at) <= ?",
			filter.EndDate,
		)
	}

	if search != "" {

		like := "%" + search + "%"

		query = query.Where(`
			(
				u.name ILIKE ?
				OR u.email ILIKE ?
				OR o.order_number ILIKE ?
				OR oi.menu_name ILIKE ?
			)
		`,
			like,
			like,
			like,
			like,
		)
	}

	err := query.
		Order(
			"o.created_at DESC",
		).
		Scan(&purchases).
		Error

	return purchases, err
}

/* =====================================================
   FULL DASHBOARD
===================================================== */

func GetDashboardAnalytics(
	db *gorm.DB,
	sellerID string,
	filter DashboardFilter,
	search string,
) (DashboardAnalytics, error) {

	var result DashboardAnalytics

	summary, err := GetDashboardSummary(
		db,
		sellerID,
		filter,
	)

	if err != nil {
		return result, err
	}

	revenue, err := GetRevenueChart(
		db,
		sellerID,
		filter,
	)

	if err != nil {
		return result, err
	}

	transactions, err := GetTransactionChart(
		db,
		sellerID,
		filter,
	)

	if err != nil {
		return result, err
	}

	topMenus, err := GetTopMenus(
		db,
		sellerID,
		filter,
	)

	if err != nil {
		return result, err
	}

	purchases, err := GetCustomerPurchases(
		db,
		sellerID,
		filter,
		search,
	)

	if err != nil {
		return result, err
	}

	result.Summary = summary

	result.Revenue = revenue

	result.Transactions = transactions

	result.TopMenus = topMenus

	result.Purchases = purchases

	return result, nil
}

/* =====================================================
   HELPER
===================================================== */

func FormatDashboardError(
	err error,
) error {

	return fmt.Errorf(
		"seller dashboard analytics error: %w",
		err,
	)
}
