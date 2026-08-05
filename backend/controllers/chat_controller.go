package controllers

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/krisn4novianto/wartegkita/backend/database"
	"github.com/krisn4novianto/wartegkita/backend/models"
)

/*
=====================================================
HELPER USER ID
=====================================================
*/

func getCurrentUserID(c *gin.Context) (uuid.UUID, error) {

	/*
		Coba beberapa kemungkinan key
		yang mungkin digunakan middleware auth.
	*/

	keys := []string{
		"user_id",
		"userID",
		"userid",
		"id",
	}

	for _, key := range keys {

		value, exists := c.Get(key)

		if !exists || value == nil {
			continue
		}

		switch v := value.(type) {

		case uuid.UUID:

			if v != uuid.Nil {
				return v, nil
			}

		case string:

			id, err := uuid.Parse(
				strings.TrimSpace(v),
			)

			if err == nil && id != uuid.Nil {
				return id, nil
			}

		case fmt.Stringer:

			id, err := uuid.Parse(
				strings.TrimSpace(v.String()),
			)

			if err == nil && id != uuid.Nil {
				return id, nil
			}
		}
	}

	/*
		Fallback:
		ambil dari header apabila middleware
		mengirim X-User-ID.
	*/

	headerID :=
		strings.TrimSpace(
			c.GetHeader("X-User-ID"),
		)

	if headerID != "" {

		id, err :=
			uuid.Parse(headerID)

		if err == nil && id != uuid.Nil {
			return id, nil
		}
	}

	return uuid.Nil, errors.New(
		"user tidak terautentikasi",
	)
}

/*
=====================================================
GET OR CREATE CHAT ROOM
POST /chat/rooms
=====================================================
*/

func GetOrCreateChatRoom(c *gin.Context) {

	var request struct {
		SellerID string `json:"seller_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "seller_id wajib diisi",
			},
		)

		return
	}

	sellerID, err :=
		uuid.Parse(
			strings.TrimSpace(
				request.SellerID,
			),
		)

	if err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "seller_id tidak valid",
			},
		)

		return
	}

	buyerID, err :=
		getCurrentUserID(c)

	if err != nil {

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"message": "User belum login",
			},
		)

		return
	}

	var room models.ChatRoom

	err =
		database.DB.
			Where(
				"buyer_id = ? AND seller_id = ?",
				buyerID,
				sellerID,
			).
			First(&room).
			Error

	if err == nil {

		c.JSON(
			http.StatusOK,
			gin.H{
				"success": true,
				"data":    room,
			},
		)

		return
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal mengambil chat room",
			},
		)

		return
	}

	room =
		models.ChatRoom{
			ID: uuid.New(),

			BuyerID: buyerID,

			SellerID: sellerID,
		}

	if err :=
		database.DB.Create(&room).Error; err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal membuat chat room",
			},
		)

		return
	}

	c.JSON(
		http.StatusCreated,
		gin.H{
			"success": true,
			"data":    room,
		},
	)
}

/*
=====================================================
GET MESSAGES
GET /chat/rooms/:room_id/messages
=====================================================
*/

func GetChatMessages(c *gin.Context) {

	roomID, err :=
		uuid.Parse(
			strings.TrimSpace(
				c.Param("room_id"),
			),
		)

	if err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "room_id tidak valid",
			},
		)

		return
	}

	userID, err :=
		getCurrentUserID(c)

	if err != nil {

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"message": "User belum login",
			},
		)

		return
	}

	var room models.ChatRoom

	if err :=
		database.DB.
			Where("id = ?", roomID).
			First(&room).
			Error; err != nil {

		if errors.Is(
			err,
			gorm.ErrRecordNotFound,
		) {

			c.JSON(
				http.StatusNotFound,
				gin.H{
					"success": false,
					"message": "Chat room tidak ditemukan",
				},
			)

			return
		}

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal mengambil chat room",
			},
		)

		return
	}

	/*
		Pastikan user memang anggota room.
	*/

	if room.BuyerID != userID &&
		room.SellerID != userID {

		c.JSON(
			http.StatusForbidden,
			gin.H{
				"success": false,
				"message": "Kamu tidak memiliki akses ke chat ini",
			},
		)

		return
	}

	var messages []models.BubbleChat

	if err :=
		database.DB.
			Where(
				"chat_room_id = ?",
				roomID,
			).
			Order("created_at ASC").
			Find(&messages).
			Error; err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal mengambil pesan",
			},
		)

		return
	}

	if messages == nil {
		messages = []models.BubbleChat{}
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"success": true,
			"data":    messages,
		},
	)
}

/*
=====================================================
SEND MESSAGE
POST /chat/messages
=====================================================
*/

func SendChatMessage(c *gin.Context) {

	var request struct {
		ChatRoomID string `json:"chat_room_id" binding:"required"`

		Message string `json:"message" binding:"required"`

		SenderRole string `json:"sender_role"`
	}

	if err :=
		c.ShouldBindJSON(&request); err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Data pesan tidak lengkap",
			},
		)

		return
	}

	roomID, err :=
		uuid.Parse(
			strings.TrimSpace(
				request.ChatRoomID,
			),
		)

	if err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "chat_room_id tidak valid",
			},
		)

		return
	}

	userID, err :=
		getCurrentUserID(c)

	if err != nil {

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"message": "User belum login",
			},
		)

		return
	}

	messageText :=
		strings.TrimSpace(
			request.Message,
		)

	if messageText == "" {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Pesan tidak boleh kosong",
			},
		)

		return
	}

	var room models.ChatRoom

	if err :=
		database.DB.
			Where("id = ?", roomID).
			First(&room).
			Error; err != nil {

		c.JSON(
			http.StatusNotFound,
			gin.H{
				"success": false,
				"message": "Chat room tidak ditemukan",
			},
		)

		return
	}

	/*
		Tentukan role dari anggota room,
		jangan percaya role dari frontend.
	*/

	senderRole := ""

	switch userID {

	case room.BuyerID:
		senderRole = "buyer"

	case room.SellerID:
		senderRole = "seller"

	default:

		c.JSON(
			http.StatusForbidden,
			gin.H{
				"success": false,
				"message": "Kamu bukan anggota chat ini",
			},
		)

		return
	}

	message :=
		models.BubbleChat{

			ID: uuid.New(),

			ChatRoomID: roomID,

			SenderID: userID,

			SenderRole: senderRole,

			Message: messageText,
		}

	if err :=
		database.DB.
			Create(&message).
			Error; err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal mengirim pesan",
			},
		)

		return
	}

	c.JSON(
		http.StatusCreated,
		gin.H{
			"success": true,
			"data":    message,
		},
	)
}

/*
=====================================================
EDIT MESSAGE
PUT /chat/messages/:id
=====================================================
*/

func UpdateChatMessage(c *gin.Context) {

	messageID, err :=
		uuid.Parse(
			strings.TrimSpace(
				c.Param("id"),
			),
		)

	if err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "ID pesan tidak valid",
			},
		)

		return
	}

	var request struct {
		Message string `json:"message" binding:"required"`
	}

	if err :=
		c.ShouldBindJSON(&request); err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "message wajib diisi",
			},
		)

		return
	}

	text :=
		strings.TrimSpace(
			request.Message,
		)

	if text == "" {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "Pesan tidak boleh kosong",
			},
		)

		return
	}

	userID, err :=
		getCurrentUserID(c)

	if err != nil {

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"message": "User belum login",
			},
		)

		return
	}

	var message models.BubbleChat

	if err :=
		database.DB.
			Where("id = ?", messageID).
			First(&message).
			Error; err != nil {

		c.JSON(
			http.StatusNotFound,
			gin.H{
				"success": false,
				"message": "Pesan tidak ditemukan",
			},
		)

		return
	}

	/*
		Hanya pemilik pesan yang boleh edit.
	*/

	if message.SenderID != userID {

		c.JSON(
			http.StatusForbidden,
			gin.H{
				"success": false,
				"message": "Kamu hanya bisa mengedit pesan sendiri",
			},
		)

		return
	}

	message.Message = text

	if err :=
		database.DB.
			Save(&message).
			Error; err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal mengedit pesan",
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"success": true,
			"data":    message,
		},
	)
}

/*
=====================================================
DELETE MESSAGE
DELETE /chat/messages/:id
=====================================================
*/

func DeleteChatMessage(c *gin.Context) {

	messageID, err :=
		uuid.Parse(
			strings.TrimSpace(
				c.Param("id"),
			),
		)

	if err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"message": "ID pesan tidak valid",
			},
		)

		return
	}

	userID, err :=
		getCurrentUserID(c)

	if err != nil {

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"message": "User belum login",
			},
		)

		return
	}

	var message models.BubbleChat

	if err :=
		database.DB.
			Where("id = ?", messageID).
			First(&message).
			Error; err != nil {

		c.JSON(
			http.StatusNotFound,
			gin.H{
				"success": false,
				"message": "Pesan tidak ditemukan",
			},
		)

		return
	}

	/*
		Hanya pemilik pesan yang boleh menghapus.
	*/

	if message.SenderID != userID {

		c.JSON(
			http.StatusForbidden,
			gin.H{
				"success": false,
				"message": "Kamu hanya bisa menghapus pesan sendiri",
			},
		)

		return
	}

	if err :=
		database.DB.
			Delete(&message).
			Error; err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": "Gagal menghapus pesan",
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"success": true,
			"message": "Pesan berhasil dihapus",
		},
	)
}
