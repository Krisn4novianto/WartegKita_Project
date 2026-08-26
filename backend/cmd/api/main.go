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

	_ "github.com/krisn4novianto/wartegkita/backend/docs"

	"github.com/krisn4novianto/wartegkita/backend/routes"
)

func main() {

	// =====================================================
	// LOAD ENV
	// =====================================================

	if err := godotenv.Load(); err != nil {
		log.Println(
			"[WARN] .env tidak ditemukan, menggunakan environment variable",
		)
	}

	// =====================================================
	// DATABASE
	// =====================================================

	database.Connect()

	// =====================================================
	// CHAT TABLE
	// =====================================================
	//
	// Membuat / memastikan tabel:
	//
	// - chat_rooms
	// - bubble_chats
	//
	// =====================================================

	database.CreateChatTables()

	// =====================================================
	// PORT
	// =====================================================

	port := os.Getenv("PORT")

	if port == "" {
		port = "8080"
	}

	// =====================================================
	// GIN ROUTER
	// =====================================================

	router := gin.Default()

	// =====================================================
	// CORS
	// =====================================================

	router.Use(
		cors.New(
			cors.Config{
				AllowOrigins: []string{
					"http://localhost:5173",
					"http://localhost:5174",
					"http://localhost:5175",

					"http://127.0.0.1:5173",
					"http://127.0.0.1:5174",
					"http://127.0.0.1:5175",
				},

				AllowMethods: []string{
					http.MethodGet,
					http.MethodPost,
					http.MethodPut,
					http.MethodPatch,
					http.MethodDelete,
					http.MethodOptions,
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

				OptionsResponseStatusCode: http.StatusNoContent,
			},
		),
	)

	// =====================================================
	// SWAGGER
	// =====================================================

	router.GET(
		"/docs/*any",
		ginSwagger.WrapHandler(
			swaggerFiles.Handler,
		),
	)

	router.GET(
		"/docs",
		func(c *gin.Context) {
			c.Redirect(
				http.StatusMovedPermanently,
				"/docs/index.html",
			)
		},
	)

	// =====================================================
	// API ROUTES
	// =====================================================

	// routes.Register() menangani:
	// - /uploads
	// - /api/v1/*
	//
	// Jadi jangan daftarkan /uploads lagi di main.go.
	routes.Register(router)

	// =====================================================
	// START SERVER
	// =====================================================

	log.Println(
		"WartegKita API running on :" + port,
	)

	if err := router.Run(":" + port); err != nil {
		log.Fatal(
			"Gagal menjalankan server:",
			err,
		)
	}
}
