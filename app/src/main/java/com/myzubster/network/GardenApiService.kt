package com.myzubster.network

import com.myzubster.models.Garden
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface GardenApiService {
    @GET("/api/gardens")
    suspend fun getGardens(): List<Garden>

    @GET("/api/gardens/{id}")
    suspend fun getGarden(@Path("id") id: String): Garden

    @POST("/api/gardens")
    suspend fun createGarden(@Body garden: Garden): Garden

    @POST("/api/gardens/pilot")
    suspend fun createPilotGarden(@Body garden: Garden): Garden
}