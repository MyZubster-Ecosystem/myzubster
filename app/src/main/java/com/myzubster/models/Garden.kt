package com.myzubster.models

import java.util.UUID

data class Garden(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val location: String,
    val description: String,
    val isPilotProject: Boolean = false,
    val pilotName: String? = null,
    val status: GardenStatus = GardenStatus.ACTIVE
)

enum class GardenStatus {
    ACTIVE,
    MAINTENANCE,
    INACTIVE
}