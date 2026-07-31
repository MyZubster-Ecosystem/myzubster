package com.myzubster.models

data class Message(
    val id: String,
    val senderId: String,
    val receiverId: String,
    val content: String,
    val timestamp: String,
    val read: Boolean = false
)

data class ChatSummary(
    val otherUserId: String,
    val otherUsername: String,
    val lastMessage: Message? = null,
    val unreadCount: Int = 0
)
