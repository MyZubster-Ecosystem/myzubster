# Private geolocation

MyZubster stores exact coordinates and addresses only as AES-256-GCM ciphertext. Public API responses are derived from a separate projection with one of three visibility levels:

- `private`: no coordinates or city; country may be shown;
- `approximate`: coordinates rounded to two decimals (roughly kilometre-scale), without street address;
- `public`: exact coordinates and address, only after explicit consent.

NFT metadata never contains coordinates or street addresses, including for public records. It may contain city/country plus a SHA-256 commitment to the encrypted off-chain payload.

## Encryption key

Generate a 32-byte base64 key:

```bash
openssl rand -base64 32
```

Configure it only in the deployment secret store:

```dotenv
LOCATION_ENCRYPTION_KEY=<base64-32-byte-key>
LOCATION_ENCRYPTION_KEY_VERSION=v1
```

Never commit the key. Back it up separately from the database; losing it makes private locations unrecoverable.

## Request contract

```json
{
  "location": {
    "lat": 44.0637353,
    "lng": 12.5678873,
    "address": "Private address",
    "city": "Rimini",
    "country": "IT",
    "visibility": "approximate",
    "consentGranted": true,
    "consentVersion": "location-privacy-v1"
  }
}
```

New location writes fail closed if consent or the encryption key is missing.

## Legacy migration

Existing plaintext positions must be migrated before calling the deployment privacy-ready. The migration defaults to dry-run and forces legacy locations to `private` because no prior consent may be inferred.

```bash
npm run privacy:migrate-locations
npm run privacy:migrate-locations -- --apply
```

Take a database backup first. Review the dry-run count and verify the encryption key before using `--apply`.

Historical observations committed to `data/observations.geojson` are also treated as legacy-unverified. Their public geometry, coordinate fields, street addresses, and direct map links are redacted. A maintainer may republish a projection only after recording explicit consent under the current policy.
