# Private Geolocation NFT MVP

This feature creates privacy-preserving location attestations that are suitable for later NFT minting without placing exact GPS coordinates in public metadata.

## API

- `GET /api/nft/geolocation/schema`
- `POST /api/nft/geolocation/verify`
- `POST /api/nft/geolocation/attest`

## Privacy model

Exact latitude/longitude are accepted only as verification inputs. Public attestation metadata contains:

- `locationVerified`
- disclosure scope (`verified-only`, `country`, `region`, or `city`)
- optional coarse labels allowed by that scope
- `evidenceHash` (SHA-256)
- geofence radius and verification result
- verification version and timestamp

Exact coordinates are intentionally omitted from the output.

A caller-provided nonce of at least 16 characters is required before hashing location evidence. This reduces trivial guessing attacks against low-entropy coordinate inputs.

## Example attestation request

```json
{
  "location": { "latitude": 44.4949, "longitude": 11.3426 },
  "geofence": {
    "center": { "latitude": 44.495, "longitude": 11.3425 },
    "radiusMeters": 250
  },
  "timestamp": "2026-08-25T00:00:00.000Z",
  "nonce": "0123456789abcdef0123456789abcdef",
  "evidenceId": "observation-123",
  "disclosureScope": "region",
  "labels": {
    "country": "Italy",
    "region": "Emilia-Romagna"
  },
  "activityType": "permaculture-observation"
}
```

## Example public metadata

```json
{
  "type": "myzubster-private-geolocation-attestation",
  "activityType": "permaculture-observation",
  "verificationVersion": "private-geolocation-v1",
  "locationVerified": true,
  "locationScope": "region",
  "country": "Italy",
  "region": "Emilia-Romagna",
  "evidenceHash": "sha256:...",
  "geofence": {
    "verified": true,
    "radiusMeters": 250
  },
  "verifiedAt": "2026-08-25T00:00:00.000Z"
}
```

## Important boundary

This MVP does **not** mint a token on a blockchain. It produces a verified, privacy-preserving metadata/attestation payload (`mintReady: true`) that can be passed to a separate NFT minting layer after project-specific authorization and evidence validation.

It also does not claim that browser/device GPS is inherently trustworthy. Anti-spoofing, trusted-device attestation, human review, sensor correlation, or stronger cryptographic location proofs are separate layers.
