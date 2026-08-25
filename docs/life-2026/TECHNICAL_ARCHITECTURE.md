# LIFE 2026 — Technical Architecture

## Purpose

This document describes the public technical architecture for using MyZubster as an environmental MRV and evidence layer in circular-water and related environmental-monitoring demonstrators.

The architecture is designed to **integrate** existing systems rather than replace SCADA, laboratory, telemetry, GIS, monitoring, or utility platforms.

## Logical components

### 1. Data sources

Potential source classes include:

- SCADA and telemetry streams;
- laboratory measurements;
- sensor networks;
- hydrological and meteorological datasets;
- asset registries and geospatial references;
- operational records related to water flow, quality, treatment, and reuse.

No source is assumed to be public. Access is governed by the source owner and the applicable agreement.

### 2. Connectors and ingestion

MyZubster should support adapters for batch and near-real-time data ingestion. Each ingested record should preserve source identity, timestamp, acquisition method, and validation status.

The integration layer should support machine-readable exchange formats and avoid proprietary lock-in where practical.

### 3. Provenance and evidence layer

For each environmental record, the platform should maintain:

- source/asset identifier;
- timestamp;
- geolocation or spatial reference when permitted;
- source organisation or system identifier;
- measured or reported parameter;
- unit and method;
- provenance reference;
- validation status;
- supporting evidence reference or hash;
- relationship to the relevant KPI or monitoring period.

The platform must not represent a record as validated when validation has not occurred.

### 4. MRV processing

The MRV layer converts agreed source data into auditable project indicators. The exact formulas, thresholds, QA/QC rules, and uncertainty treatment must be defined with the relevant technical and scientific owners before deployment.

### 5. Dashboards and reporting

Dashboards should expose only the information appropriate for the user role. Public views, where used, must avoid personal data, restricted operational details, and information that could create security risks.

### 6. Replication package

The technical output should be reusable across multiple demonstrators through:

- documented connector interfaces;
- a reusable environmental evidence schema;
- configuration-driven KPI mappings;
- deployment and data-governance guidance;
- test datasets that are synthetic or explicitly cleared for publication.

## Security and governance principles

1. Data ownership remains with the relevant source owner unless a separate agreement states otherwise.
2. Least-privilege access should be used for all connectors and users.
3. Sensitive and personal data should be excluded, minimised, aggregated, or anonymised as required.
4. Credentials and infrastructure secrets must never be committed to the public repository.
5. Data lineage should remain auditable from source reference to KPI output.
6. Validation status and uncertainty must be explicit rather than implied.
7. Public datasets and synthetic examples should be clearly distinguished from non-public operational data.

## Relationship to MyZubster core architecture

The main repository architecture already establishes explicit ownership boundaries and auditability principles. This LIFE technical track extends that same approach to environmental records: source ownership, processing state, evidence, validation, and final indicator status must remain distinguishable and auditable.
