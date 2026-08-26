package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"

	sellerdb "github.com/krisn4novianto/wartegkita/backend/database/seller"
)

type SellerDashboardExportHandler struct {
	DB *gorm.DB
}

/* =====================================================
   EXPORT CUSTOMER PURCHASE
===================================================== */

func (h *SellerDashboardExportHandler) ExportPurchases(
	c *gin.Context,
) {

	sellerID := c.Param("seller_id")

	if sellerID == "" {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "seller_id wajib diisi",
			},
		)

		return
	}

	filter := sellerdb.DashboardFilter{

		StartDate: c.Query("start_date"),

		EndDate: c.Query("end_date"),
	}

	purchases, err :=
		sellerdb.GetCustomerPurchases(
			h.DB,
			sellerID,
			filter,
			c.Query("search"),
		)

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": err.Error(),
			},
		)

		return
	}

	file := excelize.NewFile()

	sheet := "Pembelian"

	file.SetSheetName(
		"Sheet1",
		sheet,
	)

	/* =================================================
	   HEADER
	================================================= */

	headers := []string{
		"No",
		"Order Number",
		"Customer",
		"Email",
		"Menu",
		"Quantity",
		"Price",
		"Subtotal",
		"Total Order",
		"Payment Method",
		"Status",
		"Order Date",
	}

	for index, header := range headers {

		cell, _ :=
			excelize.CoordinatesToCellName(
				index+1,
				1,
			)

		file.SetCellValue(
			sheet,
			cell,
			header,
		)
	}

	/* =================================================
	   DATA
	================================================= */

	for rowIndex, purchase := range purchases {

		row := rowIndex + 2

		values := []interface{}{

			rowIndex + 1,

			purchase.OrderNumber,

			purchase.CustomerName,

			purchase.CustomerEmail,

			purchase.MenuName,

			purchase.Quantity,

			purchase.Price,

			purchase.Subtotal,

			purchase.TotalAmount,

			purchase.PaymentMethod,

			purchase.Status,

			purchase.CreatedAt.Format(
				"02-01-2006 15:04",
			),
		}

		for colIndex, value := range values {

			cell, _ :=
				excelize.CoordinatesToCellName(
					colIndex+1,
					row,
				)

			file.SetCellValue(
				sheet,
				cell,
				value,
			)
		}
	}

	/* =================================================
	   STYLE HEADER
	================================================= */

	headerStyle, err :=
		file.NewStyle(&excelize.Style{

			Font: &excelize.Font{
				Bold: true,
				Size: 11,
			},

			Alignment: &excelize.Alignment{
				Horizontal: "center",
				Vertical:   "center",
			},

			Fill: excelize.Fill{
				Type:    "pattern",
				Pattern: 1,
				Color: []string{
					"16A34A",
				},
			},

			Border: []excelize.Border{
				{
					Type:  "bottom",
					Color: "15803D",
					Style: 1,
				},
			},
		})

	if err == nil {

		file.SetCellStyle(
			sheet,
			"A1",
			"L1",
			headerStyle,
		)
	}

	/* =================================================
	   NUMBER FORMAT
	================================================= */

	currencyStyle, err :=
		file.NewStyle(&excelize.Style{

			NumFmt: 4,

			Alignment: &excelize.Alignment{
				Horizontal: "right",
			},
		})

	if err == nil {

		file.SetCellStyle(
			sheet,
			"G2",
			"I"+fmt.Sprint(len(purchases)+1),
			currencyStyle,
		)
	}

	/* =================================================
	   WIDTH
	================================================= */

	widths := map[string]float64{

		"A": 7,

		"B": 25,

		"C": 24,

		"D": 30,

		"E": 28,

		"F": 10,

		"G": 16,

		"H": 16,

		"I": 18,

		"J": 20,

		"K": 18,

		"L": 22,
	}

	for column, width := range widths {

		file.SetColWidth(
			sheet,
			column,
			column,
			width,
		)
	}

	file.SetRowHeight(
		sheet,
		1,
		28,
	)

	/* =================================================
	   AUTO FILTER
	================================================= */

	file.AutoFilter(
		sheet,
		fmt.Sprintf(
			"A1:L%d",
			len(purchases)+1,
		),
		[]excelize.AutoFilterOptions{},
	)

	/* =================================================
	   RESPONSE
	================================================= */

	filename := fmt.Sprintf(
		"wartegkita-pembelian-%s.xlsx",
		time.Now().Format("20060102-150405"),
	)

	c.Header(
		"Content-Disposition",
		`attachment; filename="`+filename+`"`,
	)

	c.Header(
		"Content-Type",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	)

	c.Header(
		"Access-Control-Expose-Headers",
		"Content-Disposition",
	)

	if err := file.Write(c.Writer); err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal membuat file Excel",
			},
		)

		return
	}
}
