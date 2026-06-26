package com.myzubster

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.myzubster.network.LoginRequest
import com.myzubster.network.UserApiService
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class LoginActivity : AppCompatActivity() {
    private lateinit var userApiService: UserApiService

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        userApiService = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(UserApiService::class.java)

        val emailEditText = findViewById<EditText>(R.id.etEmail)
        val passwordEditText = findViewById<EditText>(R.id.etPassword)
        val loginButton = findViewById<Button>(R.id.btnLogin)
        val registerLinkTextView = findViewById<TextView>(R.id.tvRegisterLink)

        loginButton.setOnClickListener {
            val email = emailEditText.text.toString().trim()
            val password = passwordEditText.text.toString()

            if (email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Inserisci email e password", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            login(email, password)
        }

        registerLinkTextView.setOnClickListener {
            startActivity(Intent().setClassName(this, "$packageName.RegisterActivity"))
        }
    }

    private fun login(email: String, password: String) {
        lifecycleScope.launch {
            try {
                val response = userApiService.login(LoginRequest(email, password))

                if (response.success && !response.token.isNullOrBlank()) {
                    getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
                        .edit()
                        .putString(KEY_AUTH_TOKEN, response.token)
                        .apply()

                    startActivity(Intent().setClassName(this@LoginActivity, "$packageName.MainActivity"))
                    finish()
                } else {
                    Toast.makeText(
                        this@LoginActivity,
                        response.message.ifBlank { "Login non riuscito" },
                        Toast.LENGTH_SHORT
                    ).show()
                }
            } catch (exception: Exception) {
                Toast.makeText(
                    this@LoginActivity,
                    "Errore di rete: ${exception.localizedMessage ?: "sconosciuto"}",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }

    companion object {
        private const val BASE_URL = "https://api.myzubster.com/"
        private const val PREFS_NAME = "myzubster_prefs"
        private const val KEY_AUTH_TOKEN = "auth_token"
    }
}
