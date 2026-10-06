# Independent Canonical Hash Reproduction

This procedure independently reproduces the SHA-256 integrity check for the published MyZubster digital identity artifact. It reads only the repository's public JSON file and does not transmit or print its identity fields.

## Deterministic canonicalization

1. Parse the input as JSON.
2. Remove the top-level `sha256_canonical_payload` member.
3. Sort every object's keys lexicographically, recursively.
4. Preserve array element order and JSON primitive values.
5. Serialize as compact JSON with no added whitespace.
6. Encode the resulting text as UTF-8 and calculate SHA-256.

## Reproduce the published result

Run from the repository root with Node.js 18 or newer:

```bash
node identity/hash-verification/verify-hash.mjs identity/MyZubster_Digital_Identity_Proof.json
```

The command exits with status `0` only when the calculated digest equals the digest embedded in the artifact. The published reference and expected successful result are:

```text
745b33a9cf939b6abf312a7e78e8ed0cb0bdb652db086bd25f12c85412de9dc4
```

The output contains only the file path, canonicalization description, comparison result, and hashes. It intentionally excludes names, email addresses, phone numbers, and other identity attributes.

## Verify deterministic and failure behavior

```bash
node --test identity/hash-verification/verify-hash.test.mjs
```

The tests independently cover a valid digest, payload tampering, object-key reordering, array-order preservation, and missing or malformed integrity references. This check establishes artifact integrity only; it does not establish legal or government identity.
