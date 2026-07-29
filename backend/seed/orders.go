package seed

import (
	"fmt"
	"log"
	"time"

	"gorm.io/gorm"

	"github.com/krisn4novianto/wartegkita/backend/models"
)

// ========================================
// SEED ORDERS + ORDER ITEMS
// ========================================

func seedOrders(db *gorm.DB) {
	var count int64
	db.Model(&models.Order{}).Count(&count)
	if count > 0 {
		log.Println("  orders: sudah ada data, skip")
		return
	}

	now := time.Now()

	orders := []models.Order{

		//  Order 1: Budi beli di Warteg Pak Hendra (COMPLETED) 
		{
			ID:            newID(),
			OrderNumber:   "WK-2026-001",
			UserID:        UserCustomer1ID,
			SellerID:      SellerProfile1SellerID,
			Status:        "COMPLETED",
			PaymentStatus: "PAID",
			TotalAmount:   43000, // 20000 + 18000 + 5000
			PaymentMethod: "QRIS",
			CreatedAt:     now.Add(-48 * time.Hour),
			UpdatedAt:     now.Add(-47 * time.Hour),
			Items: []models.OrderItem{
				{
					ID:       newID(),
					MenuID:   MenuNasiRamesID,
					MenuName: "Nasi Rames Komplit",
					Quantity: 1,
					Price:    20000,
				},
				{
					ID:       newID(),
					MenuID:   MenuAyamGorengID,
					MenuName: "Ayam Goreng Crispy",
					Quantity: 1,
					Price:    18000,
				},
				{
					ID:       newID(),
					MenuID:   MenuEsTehID,
					MenuName: "Es Teh Manis",
					Quantity: 1,
					Price:    5000,
				},
			},
		},

		//  Order 2: Siti beli di Warteg Bu Ani (COMPLETED) 
		{
			ID:            newID(),
			OrderNumber:   "WK-2026-002",
			UserID:        UserCustomer2ID,
			SellerID:      SellerProfile2SellerID,
			Status:        "COMPLETED",
			PaymentStatus: "PAID",
			TotalAmount:   51000, // 22000 + 25000 + 4000
			PaymentMethod: "Transfer Bank",
			CreatedAt:     now.Add(-24 * time.Hour),
			UpdatedAt:     now.Add(-23 * time.Hour),
			Items: []models.OrderItem{
				{
					ID:       newID(),
					MenuID:   MenuNasiSundaID,
					MenuName: "Nasi Sunda Lengkap",
					Quantity: 1,
					Price:    22000,
				},
				{
					ID:       newID(),
					MenuID:   MenuIkanBakarID,
					MenuName: "Ikan Bakar Bumbu Kecap",
					Quantity: 1,
					Price:    25000,
				},
				{
					ID:       newID(),
					MenuID:   MenuTahuGorengID,
					MenuName: "Tahu Goreng Crispy",
					Quantity: 1,
					Price:    4000,
				},
			},
		},

		//  Order 3: Budi beli di Warteg Bu Ani (WAITING_CONFIRMATION) 
		{
			ID:            newID(),
			OrderNumber:   "WK-2026-003",
			UserID:        UserCustomer1ID,
			SellerID:      SellerProfile2SellerID,
			Status:        "WAITING_CONFIRMATION",
			PaymentStatus: "PENDING",
			TotalAmount:   36000, // 12000 + 7000  2 + 10000
			PaymentMethod: "COD",
			CreatedAt:     now.Add(-30 * time.Minute),
			UpdatedAt:     now.Add(-30 * time.Minute),
			Items: []models.OrderItem{
				{
					ID:       newID(),
					MenuID:   MenuPecelID,
					MenuName: "Pecel Sayur",
					Quantity: 1,
					Price:    12000,
				},
				{
					ID:       newID(),
					MenuID:   MenuEsJerukID,
					MenuName: "Es Jeruk Peras",
					Quantity: 2,
					Price:    7000,
				},
				{
					ID:       newID(),
					MenuID:   MenuNasiSundaID,
					MenuName: "Nasi Sunda Lengkap",
					Quantity: 1,
					Price:    22000,
				},
			},
		},

		//  Order 4: Siti beli di Warteg Pak Hendra (ON_PROCESS) 
		{
			ID:            newID(),
			OrderNumber:   "WK-2026-004",
			UserID:        UserCustomer2ID,
			SellerID:      SellerProfile1SellerID,
			Status:        "ON_PROCESS",
			PaymentStatus: "PAID",
			TotalAmount:   26000, // 8000 + 5000  2 + 8000
			PaymentMethod: "QRIS",
			CreatedAt:     now.Add(-2 * time.Hour),
			UpdatedAt:     now.Add(-90 * time.Minute),
			Items: []models.OrderItem{
				{
					ID:       newID(),
					MenuID:   MenuSayurAsemID,
					MenuName: "Sayur Asem",
					Quantity: 1,
					Price:    8000,
				},
				{
					ID:       newID(),
					MenuID:   MenuTempeMendoanID,
					MenuName: "Tempe Mendoan",
					Quantity: 2,
					Price:    5000,
				},
				{
					ID:       newID(),
					MenuID:   MenuEsTehID,
					MenuName: "Es Teh Manis",
					Quantity: 1,
					Price:    5000,
				},
				{
					ID:       newID(),
					MenuID:   MenuNasiRamesID,
					MenuName: "Nasi Rames Komplit",
					Quantity: 1,
					Price:    20000,
				},
			},
		},
	}

	if err := db.Create(&orders).Error; err != nil {
		log.Fatalf("seed: gagal insert orders: %v", err)
	}
	fmt.Printf(" Seeded %d orders (dengan order_items)\n", len(orders))
}
