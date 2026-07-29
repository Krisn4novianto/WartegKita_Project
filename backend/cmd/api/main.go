// Package main is the entry point for the WartegKita API server.
//
//	@title			WartegKita API
//	@version		1.0
//	@description	REST API for WartegKita  connecting customers with traditional Indonesian Warteg sellers.
//	@contact.name	WartegKita Team
//	@contact.url	https://github.com/Krisn4novianto/WartegKita_Project
//	@host			localhost:8080
//	@BasePath		/api/v1
//	@securityDefinitions.apikey BearerAuth
//	@in header
//	@name Authorization
//	@description Enter your JWT token as: Bearer <your_token>
package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"github.com/krisn4novianto/wartegkita/backend/database"
	_ "github.com/krisn4novianto/wartegkita/backend/docs" // swag generated docs
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
	// DATABASE (SINGLE GORM DB)
	// =========================

	database.Connect()

	// =========================
	// CLEANUP EXPIRED ORDERS
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
	// CORS MIDDLEWARE (MUST BE APPLIED FIRST)
	// =========================

	router.Use(cors.New(cors.Config{

		AllowOrigins: []string{
			"http://localhost:5173",
			"http://localhost:5174",
			"http://localhost:5175",
			"http://127.0.0.1:5173",
			"http://127.0.0.1:5174",
			"http://127.0.0.1:5175",
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
			"X-Requested-With",
		},

		ExposeHeaders: []string{
			"Content-Length",
			"Content-Type",
		},

		AllowCredentials: true,
	}))

	// =========================
	// STATIC IMAGE UPLOAD
	// =========================

	router.Static(
		"/uploads",
		"./uploads",
	)


	// =========================
	// SWAGGER UI (FastAPI Style at /docs)
	// =========================

	router.GET(
		"/docs/*any",
		ginSwagger.WrapHandler(swaggerFiles.Handler),
	)

	router.GET("/docs", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/docs/index.html")
	})

	// Legacy alias redirect
	router.GET("/swagger/*any", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/docs/index.html")
	})

	// =========================
	// ROUTES
	// =========================

	routes.Register(router)

	// =========================
	// RUN SERVER
	// =========================

	log.Println(
		" WartegKita API running on http://localhost:" + port,
	)
	log.Println(
		" API Documentation (FastAPI style): http://localhost:" + port + "/docs",
	)

	if err := router.Run(":" + port); err != nil {

		log.Fatal(err)

	}

}
