package com.myzubster

import android.content.Context.MODE_PRIVATE
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.Toast
import androidx.fragment.app.Fragment

class ProfileFragment : Fragment() {
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        return inflater.inflate(R.layout.fragment_profile, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        view.findViewById<Button>(R.id.btnOpenProfileChat).setOnClickListener {
            openProfileChat()
        }
    }

    private fun openProfileChat() {
        val currentUserId = requireContext()
            .getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
            .getString(KEY_USER_ID, null)
            .orEmpty()

        if (currentUserId.isEmpty()) {
            Toast.makeText(requireContext(), "Effettua il login per aprire la chat", Toast.LENGTH_SHORT).show()
            return
        }

        startActivity(
            Intent(requireContext(), ChatActivity::class.java).apply {
                putExtra(ChatActivity.EXTRA_OTHER_USER_ID, DEFAULT_SUPPORT_USER_ID)
                putExtra(ChatActivity.EXTRA_OTHER_USER_NAME, "Supporto MyZubster")
            }
        )
    }

    companion object {
        private const val PREFS_NAME = "myzubster_prefs"
        private const val KEY_USER_ID = "user_id"
        private const val DEFAULT_SUPPORT_USER_ID = "support"
    }
}
