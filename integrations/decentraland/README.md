# MyZubster Decentraland SDK7 vertical slice

This directory contains an experimental, reproducible Decentraland SDK7 scene. It renders three public, unverified MyZubster demonstration markers in one local preview parcel:

- `myz-rimini-place-001`
- `myz-rimini-plant-001`
- `myz-life-env-001`

The scene is an independent interoperability proof. It does not claim a Decentraland partnership, endorsement, LAND ownership, production deployment, or scientific validation.

## Interaction

Each sphere is a native SDK7 ECS entity with a pointer collider. Hovering shows an inspection prompt. Clicking a marker expands its in-world label to show the provenance boundary:

- source: `MyZubster`;
- public: `true`;
- verified: `false`;
- LIFE environmental demo: `scientificallyValidated=false`.

Clicking again collapses the label. The interaction deliberately exposes validation state instead of presenting a rendered object as proof of scientific verification.

## Local validation

Use Node.js 22:

```bash
npm ci --ignore-scripts
export DCL_DISABLE_ANALYTICS=true
npm run lint
npm run build
npm run start -- --no-client --no-watch --port 8000
```

Open the Decentraland Bevy Web preview against `http://127.0.0.1:8000` and enter as a guest.

The CI gate validates the built bundle and the scene entity served by the local preview realm. GPU rendering remains a manual check because Decentraland Bevy Web requires a working WebGPU implementation, which is not reliably available on hosted headless runners.

## Publishing boundary

The repository deliberately contains no deployment credential. Publishing requires a separately authorized Decentraland World/NAME or LAND permission. Record the final World or LAND URL and deployment evidence here only after an authorized deployment succeeds.
