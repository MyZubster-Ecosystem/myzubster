package com.myzubster

import android.graphics.Color
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.myzubster.models.Message

class MessagesAdapter(
    private val currentUserId: String,
    private var messages: List<Message> = emptyList()
) : RecyclerView.Adapter<MessagesAdapter.MessageViewHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MessageViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_message, parent, false)
        return MessageViewHolder(view, currentUserId)
    }

    override fun onBindViewHolder(holder: MessageViewHolder, position: Int) {
        holder.bind(messages[position])
    }

    override fun getItemCount(): Int = messages.size

    fun submitList(newMessages: List<Message>) {
        messages = newMessages
        notifyDataSetChanged()
    }

    fun appendMessage(message: Message) {
        messages = messages + message
        notifyItemInserted(messages.lastIndex)
    }

    class MessageViewHolder(
        itemView: View,
        private val currentUserId: String
    ) : RecyclerView.ViewHolder(itemView) {
        private val container = itemView.findViewById<LinearLayout>(R.id.messageBubbleContainer)
        private val bubble = itemView.findViewById<LinearLayout>(R.id.messageBubble)
        private val contentTextView = itemView.findViewById<TextView>(R.id.tvMessageContent)
        private val timeTextView = itemView.findViewById<TextView>(R.id.tvMessageTime)

        fun bind(message: Message) {
            val isSentByCurrentUser = message.senderId == currentUserId

            container.gravity = if (isSentByCurrentUser) Gravity.END else Gravity.START
            bubble.setBackgroundColor(if (isSentByCurrentUser) Color.parseColor("#6200EE") else Color.WHITE)
            contentTextView.setTextColor(if (isSentByCurrentUser) Color.WHITE else Color.parseColor("#212121"))
            timeTextView.setTextColor(if (isSentByCurrentUser) Color.parseColor("#E0E0E0") else Color.parseColor("#757575"))

            contentTextView.text = message.content
            timeTextView.text = message.timestamp
        }
    }
}
