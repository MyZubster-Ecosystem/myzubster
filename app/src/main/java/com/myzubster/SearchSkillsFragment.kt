package com.myzubster

import android.content.Context.MODE_PRIVATE
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.Spinner
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.myzubster.models.Skill
import com.myzubster.network.ApiService
import com.myzubster.network.ChatApiService
import com.myzubster.network.StartChatRequest
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class SearchSkillsFragment : Fragment() {
    private lateinit var apiService: ApiService
    private lateinit var chatApiService: ChatApiService
    private lateinit var skillAdapter: SkillAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        return inflater.inflate(R.layout.fragment_search_skills, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val retrofit = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        apiService = retrofit.create(ApiService::class.java)
        chatApiService = retrofit.create(ChatApiService::class.java)
        skillAdapter = SkillAdapter(onContactClick = ::startChatForSkill)

        val categorySpinner = view.findViewById<Spinner>(R.id.spinnerSearchCategory)
        val radiusEditText = view.findViewById<EditText>(R.id.etSearchRadius)
        val searchButton = view.findViewById<Button>(R.id.btnSearchSkills)
        val skillsRecyclerView = view.findViewById<RecyclerView>(R.id.recyclerViewSkills)

        categorySpinner.adapter = ArrayAdapter(
            requireContext(),
            android.R.layout.simple_spinner_dropdown_item,
            CATEGORIES
        )

        skillsRecyclerView.layoutManager = LinearLayoutManager(requireContext())
        skillsRecyclerView.adapter = skillAdapter

        searchButton.setOnClickListener {
            val radius = radiusEditText.text.toString().toDoubleOrNull() ?: DEFAULT_RADIUS_KM
            searchSkills(categorySpinner.selectedItem.toString(), radius)
        }

        searchSkills(CATEGORIES.first(), DEFAULT_RADIUS_KM)
    }

    private fun searchSkills(category: String, radiusKm: Double) {
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val response = apiService.getNearbySkills(
                    lat = DEFAULT_LAT,
                    lng = DEFAULT_LNG,
                    radius = radiusKm
                )

                if (response.success) {
                    skillAdapter.submitList(filterByCategory(response.skills, category))
                } else {
                    Toast.makeText(requireContext(), response.message, Toast.LENGTH_SHORT).show()
                }
            } catch (exception: Exception) {
                Toast.makeText(
                    requireContext(),
                    "Errore ricerca: ${exception.localizedMessage ?: "sconosciuto"}",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }

    private fun startChatForSkill(skill: Skill) {
        val currentUserId = getCurrentUserId()
        if (currentUserId.isEmpty()) {
            Toast.makeText(requireContext(), "Effettua il login per contattare l'utente", Toast.LENGTH_SHORT).show()
            return
        }

        if (skill.userId == currentUserId) {
            Toast.makeText(requireContext(), "Questa competenza è tua", Toast.LENGTH_SHORT).show()
            return
        }

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val response = chatApiService.startChat(
                    StartChatRequest(
                        requesterId = currentUserId,
                        receiverId = skill.userId,
                        skillId = skill.id
                    )
                )

                if (response.success && !response.chatId.isNullOrBlank()) {
                    openChat(
                        chatId = response.chatId,
                        receiverId = response.receiverId ?: skill.userId,
                        receiverName = response.receiverName ?: skill.title
                    )
                } else {
                    Toast.makeText(
                        requireContext(),
                        response.message.ifBlank { "Impossibile avviare la chat" },
                        Toast.LENGTH_SHORT
                    ).show()
                }
            } catch (exception: Exception) {
                Toast.makeText(
                    requireContext(),
                    "Errore apertura chat: ${exception.localizedMessage ?: "sconosciuto"}",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }

    private fun openChat(chatId: String, receiverId: String, receiverName: String) {
        val intent = Intent(requireContext(), ChatActivity::class.java).apply {
            putExtra(ChatActivity.EXTRA_CHAT_ID, chatId)
            putExtra(ChatActivity.EXTRA_RECEIVER_ID, receiverId)
            putExtra(ChatActivity.EXTRA_RECEIVER_NAME, receiverName)
        }
        startActivity(intent)
    }

    private fun filterByCategory(skills: List<Skill>, category: String): List<Skill> {
        return if (category == CATEGORY_ALL) skills else skills.filter { it.category == category }
    }

    private fun getCurrentUserId(): String {
        return requireContext()
            .getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
            .getString(KEY_USER_ID, null)
            .orEmpty()
    }

    companion object {
        private const val BASE_URL = "https://api.myzubster.com/"
        private const val PREFS_NAME = "myzubster_prefs"
        private const val KEY_USER_ID = "user_id"
        private const val DEFAULT_LAT = 0.0
        private const val DEFAULT_LNG = 0.0
        private const val DEFAULT_RADIUS_KM = 10.0
        private const val CATEGORY_ALL = "Tutte"

        private val CATEGORIES = listOf(
            CATEGORY_ALL,
            "Casa",
            "Tecnologia",
            "Lingue",
            "Musica",
            "Sport",
            "Altro"
        )
    }
}
