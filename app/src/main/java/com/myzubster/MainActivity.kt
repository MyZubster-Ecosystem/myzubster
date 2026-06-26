package com.myzubster

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.bottomnavigation.BottomNavigationView

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        if (savedInstanceState == null) {
            supportFragmentManager.beginTransaction()
                .replace(R.id.mainFragmentContainer, SearchSkillsFragment())
                .commit()
        }

        val bottomNavigationView = findViewById<BottomNavigationView>(R.id.bottomNavigationView)
        bottomNavigationView.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.navSearch -> {
                    supportFragmentManager.beginTransaction()
                        .replace(R.id.mainFragmentContainer, SearchSkillsFragment())
                        .commit()
                    true
                }

                R.id.navCreate -> {
                    startActivity(Intent(this, CreateSkillActivity::class.java))
                    true
                }

                R.id.navProfileChat -> {
                    supportFragmentManager.beginTransaction()
                        .replace(R.id.mainFragmentContainer, ProfileFragment())
                        .commit()
                    true
                }

                else -> false
            }
        }
    }
}
