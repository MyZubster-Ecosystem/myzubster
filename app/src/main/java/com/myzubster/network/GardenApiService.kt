package com.myzubster.network

import com.myzubster.models.Garden
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

/**
 * API Service per la gestione degli Orti/Giardini con geolocalizzazione.
 */
interface GardenApiService {

    /**
     * Elenco di tutti gli orti (con filtri opzionali).
     */
    @GET("/api/gardens")
    suspend fun getGardens(
        @Query("status") status: String? = null,
        @Query("size") size: String? = null,
        @Query("limit") limit: Int? = 50,
        @Query("skip") skip: Int? = 0
    ): GardensResponse

    /**
     * Dettaglio di un orto.
     */
    @GET("/api/gardens/{id}")
    suspend fun getGardenById(
        @Path("id") gardenId: String
    ): GardenDetailResponse

    /**
     * Crea un nuovo orto (geocoding automatico se fornisci l'indirizzo).
     */
    @POST("/api/gardens")
    suspend fun createGarden(
        @Body request: CreateGardenRequest
    ): GardenDetailResponse

    /**
     * Aggiorna un orto.
     */
    @PUT("/api/gardens/{id}")
    suspend fun updateGarden(
        @Path("id") gardenId: String,
        @Body request: UpdateGardenRequest
    ): GardenDetailResponse

    /**
     * Elimina un orto.
     */
    @DELETE("/api/gardens/{id}")
    suspend fun deleteGarden(
        @Path("id") gardenId: String
    ): DeleteGardenResponse

    /**
     * Ricerca testuale: cerca orti per nome, descrizione o indirizzo.
     * Fallback automatico su geocoding Nominatim se la ricerca testuale
     * non produce risultati.
     */
    @GET("/api/gardens/search")
    suspend fun searchGardens(
        @Query("q") query: String
    ): GardensResponse

    /**
     * Ricerca per coordinate geografiche.
     */
    @GET("/api/gardens/nearby")
    suspend fun getNearbyGardens(
        @Query("lat") lat: Double,
        @Query("lng") lng: Double,
        @Query("radius") radius: Int? = 5000
    ): NearbyGardensResponse

    /**
     * Utility: geocodifica un indirizzo senza salvarlo.
     */
    @GET("/api/gardens/geocode")
    suspend fun geocodeAddress(
        @Query("q") query: String
    ): GeocodeResponse
}

// ---- Request Models ----

data class CreateGardenRequest(
    val name: String,
    val description: String? = null,
    val address: String? = null,
    val size: String? = "medium",
    val ownerId: String? = null
)

data class UpdateGardenRequest(
    val name: String? = null,
    val description: String? = null,
    val address: String? = null,
    val gps: GardenGpsRequest? = null,
    val size: String? = null,
    val status: String? = null,
    val ownerId: String? = null
)

data class GardenGpsRequest(
    val lat: Double,
    val lng: Double
)

// ---- Response Models ----

data class GardensResponse(
    val success: Boolean,
    val message: String? = null,
    val total: Int = 0,
    val gardens: List<Garden> = emptyList()
)

data class GardenDetailResponse(
    val success: Boolean,
    val message: String? = null,
    val data: Garden? = null
)

data class NearbyGardensResponse(
    val success: Boolean,
    val message: String? = null,
    val center: NearbyCenter? = null,
    val locationName: String? = null,
    val radius: Int = 5000,
    val total: Int = 0,
    val gardens: List<Garden> = emptyList()
)

data class NearbyCenter(
    val lat: Double,
    val lng: Double
)

data class DeleteGardenResponse(
    val success: Boolean,
    val message: String? = null
)

data class GeocodeResponse(
    val success: Boolean,
    val query: String? = null,
    val data: GeocodeData? = null
)

data class GeocodeData(
    val lat: Double,
    val lng: Double,
    val displayName: String? = null,
    val osmId: String? = null,
    val osmType: String? = null,
    val type: String? = null,
    val category: String? = null,
    val importance: Double? = 0.0
)
