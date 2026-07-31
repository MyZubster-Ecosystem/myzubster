package com.myzubster

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.myzubster.network.RegisterRequest
import com.myzubster.network.UserApiService
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class SignUpActivity : AppCompatActivity() {
    private lateinit var userApiService: UserApiService

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_signup)

        userApiService = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(UserApiService::class.java)

        val usernameEditText = findViewById<EditText>(R.id.usernameEditText)
        val emailEditText = findViewById<EditText>(R.id.emailEditText)
        val passwordEditText = findViewById<EditText>(R.id.passwordEditText)
        val confirmPasswordEditText = findViewById<EditText>(R.id.confirmPasswordEditText)
        val phoneEditText = findViewById<EditText>(R.id.phoneEditText)
        val signUpButton = findViewById<Button>(R.id.signUpButton)

        signUpButton.setOnClickListener {
            val username = usernameEditText.text.toString().trim()
            val email = emailEditText.text.toString().trim()
            val password = passwordEditText.text.toString()
            val confirmPassword = confirmPasswordEditText.text.toString()
            val phone = phoneEditText.text.toString().trim().ifBlank { null }

            when {
                username.isEmpty() || email.isEmpty() || password.isEmpty() || confirmPassword.isEmpty() -> {
                    Toast.makeText(this, "Compila tutti i campi obbligatori", Toast.LENGTH_SHORT).show()
                }

                password != confirmPassword -> {
                    Toast.makeText(this, "Le password non coincidono", Toast.LENGTH_SHORT).show()
                }

                else -> register(username, email, password, phone)
            }
        }
    }

    private fun register(username: String, email: String, password: String, phone: String?) {
        lifecycleScope.launch {
            try {
                val response = userApiService.register(
                    RegisterRequest(
                        username = username,
                        email = email,
                        password = password,
                        phone = phone
                    )
                )

                if (response.success) {
                    Toast.makeText(
                        this@SignUpActivity,
                        response.message.ifBlank { "Registrazione completata" },
                        Toast.LENGTH_SHORT
                    ).show()

                    startActivity(Intent(this@SignUpActivity, LoginActivity::class.java))
                    finish()
                } else {
                    Toast.makeText(
                        this@SignUpActivity,
                        response.message.ifBlank { "Registrazione non riuscita" },
                        Toast.LENGTH_SHORT
                    ).show()
                }
            } catch (exception: Exception) {
                Toast.makeText(
                    this@SignUpActivity,
                    "Errore di rete: ${exception.localizedMessage ?: "sconosciuto"}",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }

    companion object {
        private const val BASE_URL = "https://api.myzubster.com/"
    }
}
