package com.myzubster.models

data class User(
    val id: String,
    val username: String,
    val email: String,
    val password: String,
    val phone: String?,
    val moneroAddress: String?,
    val skills: List<String>,
    val needs: List<String>,
    val rating: Float,
    val avatarUrl: String?,
    val createdAt: String
)
