package com.myzubster.models

import com.google.gson.annotations.SerializedName

data class Skill(
    val id: String,
    val title: String,
    val description: String,
    val category: String,
    val type: SkillType,
    val userId: String,
    val location: SkillLocation,
    val address: String,
    val priceXmr: Double? = null,
    val status: SkillStatus,
    val distanceKm: Double? = null
)

data class SkillLocation(
    val lat: Double,
    val lng: Double
)

enum class SkillType {
    @SerializedName("offerta")
    OFFERTA,

    @SerializedName("richiesta")
    RICHIESTA
}

enum class SkillStatus {
    @SerializedName("attivo")
    ATTIVO,

    @SerializedName("completato")
    COMPLETATO,

    @SerializedName("scaduto")
    SCADUTO
}
