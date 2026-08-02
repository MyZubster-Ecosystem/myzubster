package com.myzubster.models

import com.google.gson.annotations.SerializedName

/**
 * Modello per Orti / Giardini con supporto geolocalizzazione.
 */
data class Garden(
    val id: String,
    val name: String,
    val description: String? = null,
    val address: String? = null,
    val gps: GardenLocation? = null,
    val geocoding: GeocodingInfo? = null,
    val size: String? = "medium",
    val status: String? = "active",
    val photos: List<String>? = emptyList(),
    val ownerId: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

data class GardenLocation(
    val lat: Double,
    val lng: Double
)

data class GeocodingInfo(
    val displayName: String? = null,
    val type: String? = null,
    val category: String? = null,
    val osmId: String? = null,
    val osmType: String? = null,
    val importance: Double? = 0.0
)
