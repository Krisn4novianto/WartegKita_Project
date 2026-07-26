package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/krisn4novianto/wartegkita/backend/database"
	sellerDB "github.com/krisn4novianto/wartegkita/backend/database/seller"
	"github.com/krisn4novianto/wartegkita/backend/routes"
)

func main() {

	// =========================
	// LOAD ENV
	// =========================

	if err := godotenv.Load(); err != nil {

		log.Println(".env tidak ditemukan")

	}

	// =========================
	// DATABASE CUSTOMER
	// =========================

	database.Connect()

	// =========================
	// DATABASE SELLER
	// =========================

	database.ConnectSellerDB()

	// =========================
	// CREATE TABLE CUSTOMER
	// =========================

	database.CreateUserTables()

	database.CreateOrderTable()

	database.CreateOrderItemsTable()

	// =========================
	// CREATE TABLE SELLER
	// =========================

	sellerDB.CreateSellerPendapatanTable(
		database.SellerDB,
	)

	// =========================
	// CLEANUP ORDER
	// =========================

	database.DeleteExpiredOrders()

	// =========================
	// PORT
	// =========================

	port := os.Getenv("PORT")

	if port == "" {

		port = "8080"

	}

	// =========================
	// GIN ROUTER
	// =========================

	router := gin.Default()

	// =========================
	// STATIC IMAGE UPLOAD
	// =========================

	router.Static(
		"/uploads",
		"./uploads",
	)

	// =========================
	// CORS
	// =========================

	router.Use(cors.New(cors.Config{

		AllowOrigins: []string{
			"http://localhost:5173",
			"http://localhost:5174",
			"http://localhost:5175",
		},

		AllowMethods: []string{
			"GET",
			"POST",
			"PUT",
			"PATCH",
			"DELETE",
			"OPTIONS",
		},

		AllowHeaders: []string{
			"Origin",
			"Content-Type",
			"Accept",
			"Authorization",
		},

		ExposeHeaders: []string{
			"Content-Length",
		},

		AllowCredentials: true,
	}))

	// =========================
	// ROUTES
	// =========================

	routes.Register(router)

	// =========================
	// RUN SERVER
	// =========================

	log.Println(
		"🚀 WartegKita API running on http://localhost:" + port,
	)

	if err := router.Run(":" + port); err != nil {

		log.Fatal(err)

	}

}
