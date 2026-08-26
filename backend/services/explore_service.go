package services

import (
	"time"

	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/models"
)

/* =====================================================
   RESPONSE STRUCTURES
===================================================== */

type PopularMenu struct {
	MenuID    string `json:"menu_id"`
	MenuName  string `json:"menu_name"`
	TotalSold int64  `json:"total_sold"`
}

type PopularSeller struct {
	SellerID     string        `json:"seller_id"`
	TotalOrders  int64         `json:"total_orders"`
	PopularMenus []PopularMenu `gorm:"-" json:"popular_menus"`
}

/* =====================================================
   GET POPULAR SELLERS
===================================================== */

func GetPopularSellers() ([]PopularSeller, error) {

	var sellers []PopularSeller

	/* =================================================
	   POPULAR PERIOD
	   -------------------------------------------------
	   Hanya transaksi:
	   - COMPLETED
	   - 30 hari terakhir
	================================================= */

	thirtyDaysAgo := time.Now().AddDate(
		0,
		0,
		-30,
	)

	/* =================================================
	   GET TOP 10 SELLERS
	================================================= */

	err := database.DB.
		Table("orders AS o").
		Select(`
			o.seller_id,
			COUNT(DISTINCT o.id) AS total_orders
		`).
		Where(
			"o.status = ? AND o.created_at >= ?",
			models.OrderStatusCompleted,
			thirtyDaysAgo,
		).
		Group("o.seller_id").
		Order("total_orders DESC").
		Limit(10).
		Scan(&sellers).Error

	if err != nil {
		return nil, err
	}

	/* =================================================
	   GET TOP 3 MENUS PER SELLER
	================================================= */

	for i := range sellers {

		var menus []PopularMenu

		err := database.DB.
			Table("order_items AS oi").
			Select(`
				oi.menu_id,
				oi.menu_name,
				SUM(oi.quantity) AS total_sold
			`).
			Joins(`
				INNER JOIN orders AS o
					ON o.id = oi.order_id
			`).
			Where(`
				o.seller_id = ?
				AND o.status = ?
				AND o.created_at >= ?
			`,
				sellers[i].SellerID,
				models.OrderStatusCompleted,
				thirtyDaysAgo,
			).
			Group(`
				oi.menu_id,
				oi.menu_name
			`).
			Order("total_sold DESC").
			Limit(3).
			Scan(&menus).Error

		if err != nil {
			return nil, err
		}

		/* =================================================
		   ASSIGN POPULAR MENUS
		================================================= */

		if menus == nil {
			menus = []PopularMenu{}
		}

		sellers[i].PopularMenus = menus
	}

	/* =================================================
	   ENSURE EMPTY RESULT IS []
	   bukan null di JSON
	================================================= */

	if sellers == nil {
		sellers = []PopularSeller{}
	}

	return sellers, nil
}
