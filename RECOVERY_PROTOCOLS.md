# MyZubster Recovery & Maintenance Protocols

This document outlines the procedures required for a Backup Maintainer to take over critical services.

## 1. General Principles
- **No Shared Secrets:** Backup maintainers use their own scoped credentials.
- **Sanitized Data:** Recovery tests must use sanitized/test data, never production PII.
- **Reproducibility:** If a service cannot be started via `docker-compose up` using the provided `.env.example`, the protocol is considered FAILED.

## 2. API/Backend Recovery Procedure
**Target:** Restore API functionality on a new VPS.

1. **Environment Setup:**
   - Provision a Linux VPS (Ubuntu 22.04 recommended).
   - Install Docker and Docker Compose.
2. **Configuration:**
   - Clone the `myzubster` repository.
   - Copy `.env.example` to `.env`.
   - Populate `.env` with new service-specific credentials (DB_URL, API_KEYS).
3. **Data Restoration:**
   - Pull the latest sanitized database snapshot from [Secure Storage Location].
   - Run `docker-compose up -d`.
4. **Verification:**
   - Execute `curl -f http://localhost:port/health`.
   - Run `npm test` to ensure core logic integrity.

## 3. Database (MongoDB/Qdrant) Recovery
**Target:** Restore vector and relational data.

1. **Procedure:**
   - Deploy containerized instance via `docker-compose`.
   - Import snapshot: `docker exec -i mongodb mongoimport --db myzubster < snapshot.json`.
2. **Validation:**
   - Run the `test-fixtures/db-check.py` script to verify data consistency.

## 4. Emergency Contact & Authorization
- **Authorization to take over:** Requires explicit DAO vote or Multi-sig trigger.
- **Escalation Path:** [Defined in DAO Governance Docs]
