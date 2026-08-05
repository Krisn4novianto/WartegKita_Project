package database

import (
	"log"

	"github.com/krisn4novianto/wartegkita/backend/models"
)

/* =====================================================
   CREATE CHAT TABLES
===================================================== */

func CreateChatTables() {

	if DB == nil {
		log.Println(
			"❌ Database belum terhubung.",
		)

		return
	}

	/* =================================================
	   CHAT ROOM
	================================================= */

	if err := DB.AutoMigrate(
		&models.ChatRoom{},
	); err != nil {

		log.Fatal(
			"❌ Gagal membuat tabel chat_rooms:",
			err,
		)
	}

	/* =================================================
	   BUBBLE CHAT
	================================================= */

	if err := DB.AutoMigrate(
		&models.BubbleChat{},
	); err != nil {

		log.Fatal(
			"❌ Gagal membuat tabel bubble_chats:",
			err,
		)
	}

	log.Println(
		"✅ Chat tables berhasil dibuat / diverifikasi.",
	)
}
