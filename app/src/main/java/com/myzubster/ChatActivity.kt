package com.myzubster

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.myzubster.network.ChatApiService
import com.myzubster.network.SendMessageRequest
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class ChatActivity : AppCompatActivity() {
    private lateinit var chatApiService: ChatApiService
    private lateinit var messagesAdapter: MessagesAdapter
    private lateinit var messagesRecyclerView: RecyclerView

    private lateinit var currentUserId: String
    private lateinit var otherUserId: String

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_chat)

        currentUserId = getCurrentUserId()
        otherUserId = intent.getStringExtra(EXTRA_OTHER_USER_ID)
            ?: intent.getStringExtra(EXTRA_RECEIVER_ID)
            ?: DEFAULT_SUPPORT_USER_ID
        val otherUserName = intent.getStringExtra(EXTRA_OTHER_USER_NAME)
            ?: intent.getStringExtra(EXTRA_RECEIVER_NAME)
            ?: "Chat"

        if (currentUserId.isEmpty()) {
            Toast.makeText(this, "Effettua il login per usare la chat", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        chatApiService = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ChatApiService::class.java)

        findViewById<TextView>(R.id.tvChatTitle).text = otherUserName

        messagesAdapter = MessagesAdapter(currentUserId)
        messagesRecyclerView = findViewById(R.id.recyclerViewMessages)
        messagesRecyclerView.layoutManager = LinearLayoutManager(this).apply {
            stackFromEnd = true
        }
        messagesRecyclerView.adapter = messagesAdapter

        val messageEditText = findViewById<EditText>(R.id.etMessage)
        val sendButton = findViewById<Button>(R.id.btnSendMessage)

        sendButton.setOnClickListener {
            val content = messageEditText.text.toString().trim()
            if (content.isEmpty()) {
                Toast.makeText(this, "Scrivi un messaggio", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            sendMessage(content)
            messageEditText.text.clear()
        }

        loadMessages()
    }

    private fun loadMessages() {
        lifecycleScope.launch {
            try {
                val response = chatApiService.getChatMessages(currentUserId, otherUserId)
                if (response.success) {
                    messagesAdapter.submitList(response.messages)
                    markUnreadMessagesAsRead(
                        response.messages
                            .filter { it.receiverId == currentUserId && !it.read }
                            .map { it.id }
                    )
                    scrollToLastMessage()
                } else {
                    Toast.makeText(this@ChatActivity, response.message, Toast.LENGTH_SHORT).show()
                }
            } catch (exception: Exception) {
                Toast.makeText(
                    this@ChatActivity,
                    "Errore caricamento chat: ${exception.localizedMessage ?: "sconosciuto"}",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }

    private fun sendMessage(content: String) {
        lifecycleScope.launch {
            try {
                val response = chatApiService.sendMessage(
                    SendMessageRequest(
                        senderId = currentUserId,
                        receiverId = otherUserId,
                        content = content
                    )
                )

                if (response.success && response.data != null) {
                    messagesAdapter.appendMessage(response.data)
                    scrollToLastMessage()
                } else {
                    Toast.makeText(
                        this@ChatActivity,
                        response.message.ifBlank { "Invio non riuscito" },
                        Toast.LENGTH_SHORT
                    ).show()
                }
            } catch (exception: Exception) {
                Toast.makeText(
                    this@ChatActivity,
                    "Errore invio: ${exception.localizedMessage ?: "sconosciuto"}",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }

    private fun markUnreadMessagesAsRead(messageIds: List<String>) {
        lifecycleScope.launch {
            messageIds.forEach { messageId ->
                runCatching { chatApiService.markMessageAsRead(messageId) }
            }
        }
    }

    private fun scrollToLastMessage() {
        if (messagesAdapter.itemCount > 0) {
            messagesRecyclerView.scrollToPosition(messagesAdapter.itemCount - 1)
        }
    }

    private fun getCurrentUserId(): String {
        return getSharedPreferences(PREFS_NAME, MODE_PRIVATE).getString(KEY_USER_ID, null).orEmpty()
    }

    companion object {
        const val EXTRA_OTHER_USER_ID = "other_user_id"
        const val EXTRA_OTHER_USER_NAME = "other_user_name"

        // Compatibilita con il flusso precedente basato sulle card competenze.
        const val EXTRA_CHAT_ID = "chat_id"
        const val EXTRA_RECEIVER_ID = "receiver_id"
        const val EXTRA_RECEIVER_NAME = "receiver_name"

        private const val BASE_URL = "https://api.myzubster.com/"
        private const val PREFS_NAME = "myzubster_prefs"
        private const val KEY_USER_ID = "user_id"
        private const val DEFAULT_SUPPORT_USER_ID = "support"
    }
}
