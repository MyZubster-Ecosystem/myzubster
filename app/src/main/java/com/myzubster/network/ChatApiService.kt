package com.myzubster.network

import com.myzubster.models.Message
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

interface ChatApiService {
    @POST("/api/messages")
    suspend fun sendMessage(
        @Body request: SendMessageRequest
    ): MessageResponse

    @GET("/api/messages/{userId}")
    suspend fun getUserMessages(
        @Path("userId") userId: String
    ): MessagesResponse

    @GET("/api/messages/{userId}/{otherUserId}")
    suspend fun getChatMessages(
        @Path("userId") userId: String,
        @Path("otherUserId") otherUserId: String
    ): MessagesResponse

    @PUT("/api/messages/{messageId}/read")
    suspend fun markMessageAsRead(
        @Path("messageId") messageId: String
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
