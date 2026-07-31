package com.myzubster

import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.Spinner
import android.widget.Switch
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.myzubster.models.SkillLocation
import com.myzubster.models.SkillType
import com.myzubster.network.ApiService
import com.myzubster.network.CreateSkillRequest
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class CreateSkillActivity : AppCompatActivity() {
    private lateinit var apiService: ApiService

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_create_skill)

        apiService = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)

        val titleEditText = findViewById<EditText>(R.id.etSkillTitle)
        val descriptionEditText = findViewById<EditText>(R.id.etSkillDescription)
        val categorySpinner = findViewById<Spinner>(R.id.spinnerCategory)
        val typeSwitch = findViewById<Switch>(R.id.switchSkillType)
        val typeLabelTextView = findViewById<TextView>(R.id.tvSkillTypeLabel)
        val priceEditText = findViewById<EditText>(R.id.etPriceXmr)
        val addressEditText = findViewById<EditText>(R.id.etAddress)
        val createButton = findViewById<Button>(R.id.btnCreateSkill)

        categorySpinner.adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_dropdown_item,
            CATEGORIES
        )

        typeSwitch.setOnCheckedChangeListener { _, isChecked ->
            typeLabelTextView.text = if (isChecked) "Tipo: Richiesta" else "Tipo: Offerta"
        }

        createButton.setOnClickListener {
            val title = titleEditText.text.toString().trim()
            val description = descriptionEditText.text.toString().trim()
            val category = categorySpinner.selectedItem.toString()
            val type = if (typeSwitch.isChecked) SkillType.RICHIESTA else SkillType.OFFERTA
            val priceXmr = priceEditText.text.toString().trim().toDoubleOrNull()
            val address = addressEditText.text.toString().trim()

            when {
                title.isEmpty() || description.isEmpty() || address.isEmpty() -> {
                    Toast.makeText(this, "Compila titolo, descrizione e indirizzo", Toast.LENGTH_SHORT).show()
                }

                else -> createSkill(title, description, category, type, priceXmr, address)
            }
        }
    }

    private fun createSkill(
        title: String,
        description: String,
        category: String,
        type: SkillType,
        priceXmr: Double?,
        address: String
    ) {
        lifecycleScope.launch {
            try {
                val response = apiService.createSkill(
                    CreateSkillRequest(
                        title = title,
                        description = description,
                        category = category,
                        type = type,
                        userId = getCurrentUserId(),
                        location = SkillLocation(DEFAULT_LAT, DEFAULT_LNG),
                        address = address,
                        priceXmr = priceXmr
                    )
                )

                if (response.success) {
                    Toast.makeText(
                        this@CreateSkillActivity,
                        response.message.ifBlank { "Competenza creata" },
                        Toast.LENGTH_SHORT
                    ).show()
                    finish()
                } else {
                    Toast.makeText(
                        this@CreateSkillActivity,
                        response.message.ifBlank { "Creazione non riuscita" },
                        Toast.LENGTH_SHORT
                    ).show()
                }
            } catch (exception: Exception) {
                Toast.makeText(
                    this@CreateSkillActivity,
                    "Errore salvataggio: ${exception.localizedMessage ?: "sconosciuto"}",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }

    private fun getCurrentUserId(): String {
        return getSharedPreferences(PREFS_NAME, MODE_PRIVATE).getString(KEY_USER_ID, null).orEmpty()
    }

    companion object {
        private const val BASE_URL = "https://api.myzubster.com/"
        private const val PREFS_NAME = "myzubster_prefs"
        private const val KEY_USER_ID = "user_id"
        private const val DEFAULT_LAT = 0.0
        private const val DEFAULT_LNG = 0.0

        private val CATEGORIES = listOf(
            "Casa",
            "Tecnologia",
            "Lingue",
            "Musica",
            "Sport",
            "Altro"
        )
    }
}
