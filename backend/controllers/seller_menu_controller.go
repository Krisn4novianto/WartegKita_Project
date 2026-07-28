package controllers

import (
	"database/sql"
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/krisn4novianto/wartegkita/backend/database"
)

// GetMenuController godoc
// @Summary      Get Menus
// @Description  Returns all menus. Filter by seller_id query param to get menus for a specific seller.
// @Tags         Menus
// @Produce      json
// @Param        seller_id query int false "Filter by seller ID"
// @Success      200 {array}  map[string]interface{}
// @Failure      500 {object} map[string]string
// @Router       /menus [get]
func GetMenuController(c *gin.Context) {

	sellerID := c.Query("seller_id")

	var rows *sql.Rows
	var err error

	if sellerID != "" {

		rows, err =
			database.SellerDB.Query(
				`
				SELECT
					id,
					seller_id,
					name,
					description,
					price,
					stock,
					category,
					image,
					available,
					created_at
				FROM menus
				WHERE seller_id=$1
				ORDER BY created_at DESC
				`,
				sellerID,
			)

	} else {

		rows, err =
			database.SellerDB.Query(
				`
				SELECT
					id,
					seller_id,
					name,
					description,
					price,
					stock,
					category,
					image,
					available,
					created_at
				FROM menus
				ORDER BY created_at DESC
				`,
			)

	}

	if err != nil {

		c.JSON(500, gin.H{
			"error": err.Error(),
		})

		return

	}

	if err != nil {

		c.JSON(500, gin.H{
			"error": err.Error(),
		})

		return

	}

	defer rows.Close()

	menus := []gin.H{}

	for rows.Next() {

		var (
			id           string
			menuSellerID string
			name         string
			description  string
			price        float64
			stock        int
			category     string
			image        string
			available    bool
			createdAt    string
		)

		err :=
			rows.Scan(
				&id,
				&menuSellerID,
				&name,
				&description,
				&price,
				&stock,
				&category,
				&image,
				&available,
				&createdAt,
			)

		if err != nil {
			continue
		}

		menus = append(
			menus,
			gin.H{

				"id": id,

				"seller_id": menuSellerID,

				"name": name,

				"description": description,

				"price": price,

				"stock": stock,

				"category": category,

				"image": image,

				"available": available,

				"created_at": createdAt,
			},
		)

	}

	c.JSON(
		200,
		menus,
	)

}

// CreateMenuController godoc
// @Summary      Create Menu
// @Description  Create a new menu item. Accepts multipart/form-data to support image upload.
// @Tags         Menus
// @Accept       multipart/form-data
// @Produce      json
// @Param        seller_id   formData string true  "Seller ID (UUID)"
// @Param        name        formData string true  "Menu name"
// @Param        description formData string false "Menu description"
// @Param        price       formData number true  "Price"
// @Param        stock       formData int    false "Stock quantity"
// @Param        category    formData string true  "Category name"
// @Param        available   formData bool   false "Is available"
// @Param        image       formData file   false "Menu image file"
// @Success      201 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /menus [post]
func CreateMenuController(c *gin.Context) {

	fmt.Println("===== CREATE MENU =====")

	fmt.Println("seller_id:", c.PostForm("seller_id"))
	fmt.Println("name:", c.PostForm("name"))
	fmt.Println("description:", c.PostForm("description"))
	fmt.Println("price:", c.PostForm("price"))
	fmt.Println("stock:", c.PostForm("stock"))
	fmt.Println("category:", c.PostForm("category"))
	fmt.Println("available:", c.PostForm("available"))

	sellerID := c.PostForm("seller_id")

	price := toFloat(
		c.PostForm("price"),
	)

	stock := toInt(
		c.PostForm("stock"),
	)

	available :=
		c.PostForm("available") == "true"

	// IMAGE

	imageURL := ""

	file, err := c.FormFile("image")

	if err == nil {

		uploadPath :=
			"./uploads/" + file.Filename

		err =
			c.SaveUploadedFile(
				file,
				uploadPath,
			)

		if err != nil {

			c.JSON(
				500,
				gin.H{
					"error": "Gagal upload gambar",
				},
			)

			return
		}

		imageURL =
			"uploads/" + file.Filename

	}

	menuIDObj, err := uuid.NewV7()
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	_, err =
		database.SellerDB.Exec(
			`
			INSERT INTO menus
			(
				id,
				seller_id,
				name,
				description,
				price,
				stock,
				category,
				image,
				available
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
				$9
			)
			`,

			menuIDObj.String(),

			sellerID,

			c.PostForm("name"),

			c.PostForm("description"),

			price,

			stock,

			c.PostForm("category"),

			imageURL,

			available,
		)

	if err != nil {

		c.JSON(
			500,
			gin.H{
				"error": err.Error(),
			},
		)

		return
	}

	c.JSON(
		201,
		gin.H{

			"message": "Menu berhasil ditambahkan",
		},
	)

}

// UpdateMenuController godoc
// @Summary      Update Menu
// @Description  Update an existing menu item by its ID
// @Tags         Menus
// @Accept       multipart/form-data
// @Produce      json
// @Param        id          path     int    true  "Menu ID"
// @Param        name        formData string false "Menu name"
// @Param        description formData string false "Menu description"
// @Param        price       formData number false "Price"
// @Param        stock       formData int    false "Stock quantity"
// @Param        category    formData string false "Category"
// @Param        available   formData bool   false "Is available"
// @Success      200 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /menus/{id} [put]
func UpdateMenuController(c *gin.Context) {

	id := c.Param("id")

	price := toFloat(
		c.PostForm("price"),
	)

	stock := toInt(
		c.PostForm("stock"),
	)

	available := c.PostForm("available") == "true"

	_, err :=
		database.SellerDB.Exec(
			`
			UPDATE menus

			SET

				name=$1,

				description=$2,

				price=$3,

				stock=$4,

				category=$5,

				available=$6

			WHERE id=$7

			`,

			c.PostForm("name"),

			c.PostForm("description"),

			price,

			stock,

			c.PostForm("category"),

			available,

			id,
		)

	if err != nil {

		c.JSON(
			500,
			gin.H{
				"error": err.Error(),
			},
		)

		return

	}

	c.JSON(
		200,
		gin.H{

			"message": "Menu berhasil diperbarui",
		},
	)

}

// DeleteMenuController godoc
// @Summary      Delete Menu
// @Description  Permanently delete a menu item
// @Tags         Menus
// @Produce      json
// @Param        id path int true "Menu ID"
// @Success      200 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /menus/{id} [delete]
func DeleteMenuController(
	c *gin.Context,
) {

	id :=
		c.Param("id")

	_, err :=
		database.SellerDB.Exec(
			`
			DELETE FROM menus
			WHERE id=$1
			`,
			id,
		)

	if err != nil {

		c.JSON(
			500,
			gin.H{
				"error": err.Error(),
			},
		)

		return

	}

	c.JSON(
		200,
		gin.H{

			"message": "Menu berhasil dihapus",
		},
	)

}
