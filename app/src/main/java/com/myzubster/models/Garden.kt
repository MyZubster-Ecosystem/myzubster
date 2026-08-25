package com.myzubster.models

import java.util.UUID

/**
 * Represents a urban green space or sustainability project within the pilot program.
 * Linked to the 'Verde urbano e sostenibilità' pilot.
 */
data class Garden(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val location: String,
    val sustainabilityMetrics: SustainabilityMetrics,
    val status: PilotStatus = PilotStatus.PROPOSED,
    val bountyAmount: Double = 0.0,
    val verificationRequired: Boolean = true
)

data class SustainabilityMetrics(
    val greenAreaSqM: Double,
    val biodiversityIndex: Double,
    val carbonSequestrationEstimate: Double
)

enum class PilotStatus {
    PROPOSED,
    VALIDATED,
    APPROVED,
    FUNDED,
    ACTIVE,
    VERIFIED,
    REWARDED,
    REPORTED
}