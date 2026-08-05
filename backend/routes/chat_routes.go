package routes

import (
	"github.com/gin-gonic/gin"

	"github.com/krisn4novianto/wartegkita/backend/controllers"
)

func ChatRoutes(router *gin.RouterGroup) {

	chat := router.Group("/chat")

	{
		/*
			ROOM
		*/

		chat.POST(
			"/rooms",
			controllers.GetOrCreateChatRoom,
		)

		/*
			MESSAGES
		*/

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
