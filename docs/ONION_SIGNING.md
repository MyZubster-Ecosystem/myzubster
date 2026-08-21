# MyZubster signed onion publication

This document turns the decentralized-onion proposal into an operational workflow.

## 1. Generate the signing key locally

Use Node.js 20+:

```bash
node tools/onion/onionctl.mjs keygen .myzubster/keys/onion-private.pem .myzubster/keys/onion-public.pem
```

The repository already ignores `*.pem`, so neither key should be committed accidentally. The private key must remain local/offline. The public key can be copied into a future signed manifest or published separately after review.

## 2. Sign the manifest

```bash
node tools/onion/onionctl.mjs sign \
  docs/decentralized-onion.manifest.json \
  .myzubster/keys/onion-private.pem \
  docs/decentralized-onion.manifest.signed.json
```

The signature uses Ed25519. The signed payload is the canonical JSON representation of the manifest with the `signature` field removed. Canonicalization recursively sorts object keys and preserves array order.

## 3. Verify locally

```bash
node tools/onion/onionctl.mjs verify docs/decentralized-onion.manifest.signed.json
```

For stricter key pinning, provide the expected public key explicitly:

```bash
node tools/onion/onionctl.mjs verify \
  docs/decentralized-onion.manifest.signed.json \
  .myzubster/keys/onion-public.pem
```

A verifier must check all three conditions:

- Ed25519 signature is valid;
- canonical payload SHA-256 matches the signed metadata;
- calculated public-key ID matches the signed `key_id`.

## 4. Produce a root digest

```bash
node tools/onion/onionctl.mjs root docs/decentralized-onion.manifest.signed.json
```

Publish the resulting canonical SHA-256 through more than one discovery path. At minimum, MyZubster should maintain one content-addressed path and one provider-independent mirror.

Current bootstrap discovery paths:

1. GitHub raw manifest;
2. Google Drive `MyZubster Onion Root Record`.

The Drive record is a discovery mirror only. It is not authoritative unless its advertised root matches a correctly signed manifest.

## 5. Publish to IPFS and IPNS

This step requires a connected IPFS node and therefore cannot be executed by the GitHub repository alone.

Example with Kubo/IPFS CLI:

```bash
CID=$(ipfs add -Q docs/decentralized-onion.manifest.signed.json)
ipfs pin add "$CID"
```

Create a dedicated IPNS publishing key once:

```bash
ipfs key gen myzubster-onion
```

Publish the CID:

```bash
ipfs name publish --key=myzubster-onion "/ipfs/$CID"
```

Resolve it independently:

```bash
ipfs name resolve /ipns/<IPNS_NAME>
```

Only after successful independent resolution should `current_root.ipns`, `current_root.cid` and the discovery `ipns` list be populated in the manifest.

## 6. Independent retrieval rule

A client should not trust a transport merely because it returned data. The recommended sequence is:

```text
GitHub / Drive / DNSLink / IPNS / .onion
               |
               v
        retrieve manifest
               |
               v
       Ed25519 verify locally
               |
               v
        compare root/CID/hash
               |
               v
      accept authoritative state
```

Tor `.onion`, HTTPS gateways and ordinary web mirrors are interchangeable transport paths from the trust-model perspective. Authenticity comes from signature and content addressing, not from the transport.

## 7. Key rotation

When rotating a signing key:

1. publish the new public key in a manifest signed by the old valid key;
2. mark the old key with a retirement timestamp;
3. publish the new signed root through at least two discovery paths;
4. retain the previous manifest CID/SHA-256 in `continuity`;
5. do not delete historical signed manifests.

If the old key is believed compromised, stop using it immediately and require explicit maintainer recovery plus independent verifier confirmation before clients accept a replacement root.

## Current implementation status

- Local Ed25519 key generation: implemented.
- Local manifest signing: implemented.
- Local signature/hash/key-ID verification: implemented.
- GitHub discovery path: active on `decentralize-onion` branch.
- Independent Google Drive root record: active.
- IPFS/IPNS publication: pending a connected node and locally controlled IPNS key.
- Tor onion mirror: optional/pending.

Do not claim IPNS or Tor availability until those endpoints are actually deployed and independently testable.
