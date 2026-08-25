# Permaculture NFT + AI

This module creates privacy-first permaculture sites, generates preliminary AI-assisted designs, and prepares verifiable NFT metadata without publishing exact geolocation.

## Flow

```text
authenticated site creation
  → encrypted exact location + public projection
  → privacy-safe planning context
  → optional in-memory photo analysis with local Ollama Vision
  → Ollama plan or deterministic fallback
  → human review required
  → canonical NFT metadata + plan/photo SHA-256 commitments
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

## Photo recognition and advice

An authenticated owner can upload one JPEG, PNG or WebP image (maximum 8 MB). The vision model separates visible evidence from hypotheses and returns:

- observable water, soil, vegetation, biodiversity, infrastructure and risk elements;
- signs associated with the twelve permaculture principles;
- missing evidence that a single image cannot provide;
- prioritized actions, rationale, timeframe and confidence;
- an overall classification: clear signals, partial signals, insufficient evidence, or not permaculture.

The image is held only in process memory for the request and is not saved. The database stores the structured result and a SHA-256 image digest, not the photo or its base64 representation. The service does not identify people, transcribe personal data, infer an address/GPS position, or claim a certain diagnosis of species, disease, soil, drainage or hydrology from one image. Sensitive model output is rejected before persistence.

Photo bytes are sent only to the configured Ollama endpoint. By default, that endpoint must be loopback (`localhost`, `127.0.0.1` or `::1`). Setting `PERMACULTURE_VISION_ALLOW_REMOTE=true` is an explicit privacy opt-in and must be covered by a separate processor/privacy review.

The implementation uses [Ollama Vision](https://docs.ollama.com/capabilities/vision) with [structured outputs](https://docs.ollama.com/capabilities/structured-outputs). The default model is [Qwen2.5-VL](https://ollama.com/library/qwen2.5vl); its Ollama page specifies Ollama 0.7.0 or newer.

## NFT boundary

NFT metadata contains only:

- a pseudonymous site ID;
- coarse design attributes;
- plan and encrypted-location SHA-256 commitments;
- the latest photo-analysis commitment, when an analysis exists;
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
PERMACULTURE_VISION_MODEL=qwen2.5vl:3b
PERMACULTURE_VISION_TIMEOUT_MS=90000
PERMACULTURE_VISION_ALLOW_REMOTE=false
NFT_MINT_MODE=disabled
```

Keep all secrets in the deployment secret manager.

Install the local vision model before using the endpoint:

```bash
ollama pull qwen2.5vl:3b
```

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

Analyze a photo and receive evidence-based advice:

```bash
curl -X POST "http://localhost:5003/api/permaculture/<siteId>/photo-analysis" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: image/jpeg" \
  --data-binary @garden.jpg
```

The response includes `observations`, `permacultureSignals`, `missingEvidence`, `recommendations`, `cautions`, `overallAssessment`, confidence values and `humanReviewRequired: true`. Retrieve the most recent stored result without re-uploading the image:

```http
GET /api/permaculture/:siteId/photo-analysis/latest
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
- `POST /api/permaculture/:siteId/photo-analysis` — owner/admin in-memory photo analysis;
- `GET /api/permaculture/:siteId/photo-analysis/latest` — owner/admin latest structured result;
- `GET /api/permaculture/nft/:metadataHash` — metadata for a public site.

## On-chain activation checklist

Before real minting, configure and review the deployed ERC-721 contract, chain ID, contract address, signer custody, authorization, idempotency, transaction receipt verification, reorg handling, persistence, metadata hosting and operational monitoring. Until then keep `NFT_MINT_MODE=disabled`.
