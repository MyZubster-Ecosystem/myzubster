package com.myzubster.network

import com.myzubster.models.User
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

interface UserApiService {
    @POST("/api/users/register")
    suspend fun register(
        @Body request: RegisterRequest
    ): RegisterResponse

    @POST("/api/users/login")
    suspend fun login(
        @Body request: LoginRequest
    ): LoginResponse

    @GET("/api/users/profile/{userId}")
    suspend fun getProfile(
        @Path("userId") userId: String
    ): UserResponse

    @PUT("/api/users/profile/{userId}")
    suspend fun updateProfile(
        @Path("userId") userId: String,
        @Body request: UpdateProfileRequest
    ): UpdateResponse
}

data class RegisterRequest(
    val username: String,
    val email: String,
    val password: String,
    val phone: String? = null,
    val moneroAddress: String? = null,
    val skills: List<String> = emptyList(),
    val needs: List<String> = emptyList(),
    val avatarUrl: String? = null
)

data class RegisterResponse(
    val success: Boolean,
    val message: String,
    val user: User? = null,
    val token: String? = null
)

data class UpdateProfileRequest(
    val username: String? = null,
    val phone: String? = null,
    val moneroAddress: String? = null,
    val skills: List<String>? = null,
    val needs: List<String>? = null,
    val avatarUrl: String? = null
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val success: Boolean,
    val message: String,
    val user: User? = null,
    val token: String? = null
)

data class UserResponse(
    val success: Boolean,
    val message: String,
    val user: User? = null
)

data class UpdateResponse(
    val success: Boolean,
    val message: String,
    val user: User? = null
)
