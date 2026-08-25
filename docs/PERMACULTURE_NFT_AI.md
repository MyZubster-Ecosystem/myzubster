# Permaculture NFT + AI

This module creates privacy-first permaculture sites, generates preliminary AI-assisted designs, and prepares verifiable NFT metadata without publishing exact geolocation.

## Flow

```text
authenticated site creation
  → encrypted exact location + public projection
  → privacy-safe planning context
  → Ollama plan or deterministic fallback
  → human review required
  → canonical NFT metadata + SHA-256 commitments
  → optional off-chain simulation
```

Production minting is not enabled by this module.

## AI privacy boundary

The AI receives only a structured planning context:

- site type and area;
- climate zone, soil texture and slope class;
- enumerated water sources, goals and constraints.

It never receives the site name, owner ID, address, city, latitude, longitude, encrypted payload, wallet, or free-form notes. This also limits prompt-injection risk. Model output containing coordinate/address-like data is rejected before persistence.

`PERMACULTURE_AI_MODE` supports:

- `hybrid` (default): try Ollama, then use the deterministic rules engine;
- `ollama`: require Ollama and fail if unavailable;
- `rules`: deterministic local planning only.

Every plan includes an input commitment and `humanReviewRequired: true`. It is a preliminary design, not agronomic, geological, hydrological, construction, fire-safety, or regulatory approval.

## NFT boundary

NFT metadata contains only:

- a pseudonymous site ID;
- coarse design attributes;
- plan and encrypted-location SHA-256 commitments;
- country/city labels only when allowed by the location projection.

It never contains coordinates, street address, owner identity, wallet, or the encrypted payload itself. Preparing metadata does not mint anything. After a real mint is eventually recorded, that design version is immutable; a different plan must use a new site/design version.

`POST /api/permaculture/:siteId/nft/simulate` works only with `NFT_MINT_MODE=simulation` and always returns `onChain: false`. Otherwise it fails closed with `NFT_RUNTIME_NOT_CONFIGURED`.

## Configuration

```dotenv
JWT_SECRET=<long-random-secret>
LOCATION_ENCRYPTION_KEY=<base64-or-hex-32-byte-key>
LOCATION_ENCRYPTION_KEY_VERSION=v1
PERMACULTURE_AI_MODE=hybrid
PERMACULTURE_OLLAMA_MODEL=qwen2.5:3b
PERMACULTURE_AI_TIMEOUT_MS=45000
OLLAMA_URL=http://127.0.0.1:11434
NFT_MINT_MODE=disabled
```

Keep all secrets in the deployment secret manager.

## API

Create a private site:

```http
POST /api/permaculture
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "name": "Community design 001",
  "siteType": "community",
  "isPublic": false,
  "profile": {
    "areaSqm": 1200,
    "climateZone": "mediterranean",
    "soilTexture": "clay",
    "slope": "gentle",
    "waterSources": ["rainwater"],
    "goals": ["food_production", "biodiversity", "water_resilience"],
    "constraints": ["water_scarcity"]
  },
  "location": {
    "lat": 44.000001,
    "lng": 12.000001,
    "country": "IT",
    "visibility": "private",
    "consentGranted": true
  }
}
```

Generate and review a plan:

```http
POST /api/permaculture/:siteId/ai-plan
Authorization: Bearer <token>
```

Prepare privacy-safe NFT metadata:

```http
POST /api/permaculture/:siteId/nft/prepare
Authorization: Bearer <token>
```

Other endpoints:

- `GET /api/permaculture` — public sites;
- `GET /api/permaculture/mine` — authenticated owner's sites;
- `GET /api/permaculture/:siteId` — public site detail;
- `GET /api/permaculture/:siteId/location/private` — owner/admin exact location;
- `GET /api/permaculture/nft/:metadataHash` — metadata for a public site.

## On-chain activation checklist

Before real minting, configure and review the deployed ERC-721 contract, chain ID, contract address, signer custody, authorization, idempotency, transaction receipt verification, reorg handling, persistence, metadata hosting and operational monitoring. Until then keep `NFT_MINT_MODE=disabled`.
