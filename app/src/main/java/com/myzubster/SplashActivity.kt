package com.myzubster

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity

class SplashActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        Handler(Looper.getMainLooper()).postDelayed({
            navigateAfterSplash()
        }, SPLASH_DELAY_MS)
    }

    private fun navigateAfterSplash() {
        val token = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
            .getString(KEY_AUTH_TOKEN, null)
            .orEmpty()

        val destination = if (token.isNotBlank()) {
            MainActivity::class.java
        } else {
            LoginActivity::class.java
        }

        startActivity(Intent(this, destination))
        finish()
    }

    companion object {
        private const val SPLASH_DELAY_MS = 2_000L
        private const val PREFS_NAME = "myzubster_prefs"
        private const val KEY_AUTH_TOKEN = "auth_token"
    }
}
