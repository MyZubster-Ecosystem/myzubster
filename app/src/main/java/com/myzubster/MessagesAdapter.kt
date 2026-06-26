package com.myzubster

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.myzubster.models.Message

class MessagesAdapter(
    private val currentUserId: String,
    private var messages: List<Message> = emptyList()
) : RecyclerView.Adapter<MessagesAdapter.MessageViewHolder>() {

    override fun getItemViewType(position: Int): Int {
        return if (messages[position].senderId == currentUserId) VIEW_TYPE_SENT else VIEW_TYPE_RECEIVED
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MessageViewHolder {
        val layoutRes = if (viewType == VIEW_TYPE_SENT) {
            R.layout.item_message_sent
        } else {
            R.layout.item_message_received
        }

        val view = LayoutInflater.from(parent.context).inflate(layoutRes, parent, false)
        return MessageViewHolder(view)
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

    class MessageViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val contentTextView = itemView.findViewById<TextView>(R.id.tvMessageContent)
        private val timeTextView = itemView.findViewById<TextView>(R.id.tvMessageTime)

        fun bind(message: Message) {
            contentTextView.text = message.content
            timeTextView.text = message.createdAt
        }
    }

    companion object {
        private const val VIEW_TYPE_SENT = 1
        private const val VIEW_TYPE_RECEIVED = 2
    }
}
