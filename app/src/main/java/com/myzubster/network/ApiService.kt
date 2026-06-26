package com.myzubster.network

import com.myzubster.models.Skill
import com.myzubster.models.SkillLocation
import com.myzubster.models.SkillStatus
import com.myzubster.models.SkillType
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {
    @GET("/api/skills/nearby")
    suspend fun getNearbySkills(
        @Query("lat") lat: Double,
        @Query("lng") lng: Double,
        @Query("radius") radius: Double
    ): SkillsResponse

    @POST("/api/skills")
    suspend fun createSkill(
        @Body request: CreateSkillRequest
    ): SkillResponse

    @GET("/api/skills/user/{userId}")
    suspend fun getUserSkills(
        @Path("userId") userId: String
    ): SkillsResponse
}

data class CreateSkillRequest(
    val title: String,
    val description: String,
    val category: String,
    val type: SkillType,
    val userId: String,
    val location: SkillLocation,
    val address: String,
    val priceXmr: Double? = null,
    val status: SkillStatus = SkillStatus.ATTIVO
)

data class SkillResponse(
    val success: Boolean,
    val message: String,
    val skill: Skill? = null
)

data class SkillsResponse(
    val success: Boolean,
    val message: String,
    val skills: List<Skill> = emptyList()
)
