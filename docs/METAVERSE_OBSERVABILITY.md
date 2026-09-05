# MyZubster Metaverse observability

This runbook covers the production health and request signals for Neon Plaza. It is intentionally aggregate-only: monitoring must help operators detect incidents without turning player activity into surveillance.

## Health endpoint

`GET /api/metaverse/health` returns `Cache-Control: no-store` and one of two states:

- `200 healthy`: MongoDB accepted a ping and aggregate world queries completed.
- `503 degraded`: MongoDB is disconnected or a ping/query failed.

The healthy response includes the MongoDB ping time, active-player count, recent-chat count for the last five minutes, age of the newest presence heartbeat, transport type and retention durations. It never includes player records, character names, chat messages, request bodies, authorization values, tokens or session IDs.

## Production signals and initial thresholds

Create Vercel alerts (or the equivalent log-based monitors) with these starting thresholds and tune them only after collecting a representative baseline:

| Signal | Warning threshold | Incident threshold |
| --- | --- | --- |
| Metaverse 5xx rate | at least 2% for 10 minutes | at least 5% for 5 minutes |
| Metaverse request latency | p95 above 1,000 ms for 10 minutes | p95 above 1,500 ms for 10 minutes |
| Health endpoint | one `503 degraded` result | two consecutive `503 degraded` results |
| Latest heartbeat age while players are expected | above 90 seconds | above 180 seconds |

The application emits a structured `metaverse_request` warning only for 5xx responses, a failed production storage gate or requests taking at least 1,500 ms. Normal polling is not logged by this middleware, keeping cost and noise bounded.

## Incident runbook

1. Query `/api/metaverse/health` and record the status, MongoDB ping time and timestamp.
2. Check the matching Vercel deployment and filter logs for `event=metaverse_request`.
3. If MongoDB is degraded, verify Atlas service health, network access rules, credentials and connection limits. Never paste the connection string into an issue or chat.
4. If only latency is elevated, compare Vercel function duration with MongoDB ping time and query latency before changing limits.
5. Run the Metaverse API tests and a two-browser presence/emote check after recovery.
6. Record the incident window, affected endpoints, aggregate impact and remediation in MYZ-38 or a linked issue.

## Rollback

If a deployment introduces errors, promote the last verified Vercel deployment or revert only the offending commit. Re-run `/api/metaverse/health`, `/api/metaverse/world`, join/sync/emote/leave tests and the two-browser production check before closing the incident.

## Privacy boundary

Production monitoring may retain aggregate counts, status codes, endpoint paths, durations and timestamps. It must not log or export chat content, player/character names, GitHub identities, authorization headers, cookies, tokens, request bodies, query strings, wallet data or Metaverse session IDs. Access to operational logs should follow least privilege and the hosting provider's configured retention policy.
