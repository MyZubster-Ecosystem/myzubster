# MyZubster Identity Verifier

This verifier checks the integrity and minimum technical claims of the public MyZubster Digital Identity Proof.

## Run

```bash
node identity/verifier/verify.mjs identity/MyZubster_Digital_Identity_Proof.json
```

The command exits with status `0` only when every structural and integrity check passes. Invalid JSON, unreadable files, malformed fields, and digest mismatches produce machine-readable JSON and a non-zero exit status.

## Test

```bash
node --test identity/verifier/verify.test.mjs
```

The tests use synthetic data and cover a valid proof, payload tampering, invalid structure, malformed JSON, and deterministic key ordering. They do not collect or require private data, credentials, network access, or external secrets.

The verifier checks:

- the JSON is readable;
- the project is `MyZubster`;
- the document explicitly does **not** claim to be a government/legal identity document;
- a project subject is present;
- the public MyZubster GitHub organisation is referenced;
- the stored SHA-256 is well formed;
- the locally calculated canonical SHA-256 matches the stored digest.

A successful verification means the public technical identity artifact is internally consistent with the verifier rules. It does **not** prove legal identity, government identity, SPID/CIE ownership, biometric identity, or formal membership in any cultural group.

## Evidence links

The identity tree may also reference optional evidence under `identity/evidence/`, including physical/symbolic evidence. Those records are supporting context and must not be promoted into stronger claims than their documentation supports.

## Next step

The next version should verify an Ed25519-signed credential and status/revocation record so that integrity does not depend only on a self-declared digest.
