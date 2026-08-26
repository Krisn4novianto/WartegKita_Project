package routes

import (
	"github.com/gin-gonic/gin"

	"github.com/krisn4novianto/wartegkita/backend/controllers"
	"github.com/krisn4novianto/wartegkita/backend/middleware"
)

func ChatRoutes(router *gin.RouterGroup) {

	chat := router.Group("/chat")

	// Semua endpoint chat wajib login
	chat.Use(middleware.AuthMiddleware())

	{
		// =================================================
		// ROOM
		// =================================================

		chat.POST(
			"/rooms",
			controllers.GetOrCreateChatRoom,
		)

		// =================================================
		// MESSAGES
		// =================================================

		chat.GET(
			"/rooms/:room_id/messages",
			controllers.GetChatMessages,
		)

		chat.POST(
			"/messages",
			controllers.SendChatMessage,
		)

		chat.PUT(
			"/messages/:id",
			controllers.UpdateChatMessage,
		)

		chat.DELETE(
			"/messages/:id",
			controllers.DeleteChatMessage,
		)
	}
}
