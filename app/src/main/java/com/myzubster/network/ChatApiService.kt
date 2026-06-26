package com.myzubster.network

import com.myzubster.models.ChatSummary
import com.myzubster.models.Message
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface ChatApiService {
    @GET("/api/chats/user/{userId}")
    suspend fun getUserChats(
        @Path("userId") userId: String
    ): ChatsResponse

    @GET("/api/chats/{chatId}/messages")
    suspend fun getMessages(
        @Path("chatId") chatId: String
    ): MessagesResponse

    @POST("/api/chats/{chatId}/messages")
    suspend fun sendMessage(
        @Path("chatId") chatId: String,
        @Body request: SendMessageRequest
    ): MessageResponse
}

data class SendMessageRequest(
    val senderId: String,
    val receiverId: String,
    val content: String
)

data class MessageResponse(
    val success: Boolean,
    val message: String,
    val data: Message? = null
)

data class MessagesResponse(
    val success: Boolean,
    val message: String,
    val messages: List<Message> = emptyList()
)

data class ChatsResponse(
    val success: Boolean,
    val message: String,
    val chats: List<ChatSummary> = emptyList()
)
