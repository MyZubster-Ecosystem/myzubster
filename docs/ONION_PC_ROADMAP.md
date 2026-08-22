# MyZubster Decentralized Onion — PC Roadmap

This checklist contains the operations that must be completed from a trusted PC or infrastructure controlled by the project. These steps are intentionally not faked or marked complete until independently verifiable.

## 1. Prepare the trusted PC

- [ ] Clone/update `MyZubster-Ecosystem/myzubster` and checkout the `decentralize-onion` branch (or `main` after PR #574 is merged).
- [ ] Install Node.js and Kubo/IPFS.
- [ ] Confirm `node`, `ipfs` and `git` work locally.
- [ ] Use a trusted machine and encrypted storage for private keys.

## 2. Generate the Ed25519 onion signing identity

- [ ] Run `node tools/onion/onionctl.mjs keygen`.
- [ ] Keep the private key local/offline. Never commit it, upload it to Drive, paste it into issues, or send it by email/chat.
- [ ] Back up the private key securely in encrypted/offline storage.
- [ ] Record only the public key / key identifier in the public manifest.

## 3. Sign and verify the onion manifest

- [ ] Sign `docs/decentralized-onion.manifest.json` with the locally controlled Ed25519 key.
- [ ] Run the local verifier against the signed manifest.
- [ ] Calculate and record the canonical SHA-256 root.
- [ ] Confirm no secret or personal identity document is present in the manifest.

## 4. Bootstrap IPFS/IPNS

- [ ] Start the local IPFS daemon.
- [ ] Add the signed manifest to IPFS and record the returned CID.
- [ ] Pin the CID on the controlled node.
- [ ] Generate a dedicated IPNS key named for the MyZubster onion root.
- [ ] Export an encrypted/offline backup of the IPNS key. Never commit the export.
- [ ] Publish the CID under the dedicated IPNS name.
- [ ] Resolve the IPNS name independently and confirm it returns the expected CID.

## 5. Configure GitHub Actions secrets

Repository secrets required by the publication workflow:

- [ ] `ONION_ED25519_PRIVATE_KEY_B64` — base64 representation of the signing private key, added only through GitHub repository Actions secrets.
- [ ] `IPNS_KEY_EXPORT_B64` — base64 representation of the exported IPNS key, added only through GitHub repository Actions secrets.

Never put either value in repository files, commits, issues, PR comments, Drive documents, screenshots, or chat messages.

## 6. Run the publication workflow

- [ ] Manually run the onion publication GitHub Actions workflow.
- [ ] Confirm Ed25519 signature verification succeeds.
- [ ] Confirm `ipfs add` succeeds.
- [ ] Confirm `ipfs name publish` succeeds.
- [ ] Confirm `ipfs name resolve` returns the same CID.
- [ ] Preserve the non-secret publication receipt/artifact.

## 7. Update the public root records

After successful publication, update only public/non-secret values:

- [ ] `current_root.cid`
- [ ] `current_root.ipns`
- [ ] `current_root.sha256`
- [ ] Ed25519 public key / key identifier
- [ ] IPNS discovery entry
- [ ] verified retrieval endpoints
- [ ] continuity pointer to the previous manifest root when rotating state

## 8. Google Drive uploads / mirrors

Upload or update the following public artifacts on Drive:

- [ ] Signed onion manifest (`decentralized-onion.manifest.signed.json`).
- [ ] Non-secret publication receipt containing CID, IPNS name, SHA-256, public signing key identifier and timestamp.
- [ ] Update the existing `MyZubster Onion Root Record` with the verified CID, IPNS name and canonical SHA-256.
- [ ] Keep identity/evidence public files mirrored where intended.
- [ ] Verify the Drive copy hashes to the same value as the canonical public artifact where byte-for-byte mirroring is required.

Do **not** upload private Ed25519 keys, IPNS private-key exports, seed phrases, passwords, recovery codes, government identity documents, or GitHub secret values to Drive.

## 9. Multipath verification

- [ ] Retrieve/resolve the root through GitHub.
- [ ] Retrieve/resolve the public record through Drive.
- [ ] Resolve the IPNS name through IPFS.
- [ ] Compare CID/SHA-256/signature across independent paths.
- [ ] Add a second independent IPFS pin/provider when available.
- [ ] Add DNSLink only after the domain record is controlled and verified.
- [ ] Add a Tor `.onion` mirror only after it is actually online and independently testable.

## 10. Close bootstrap issue

Issue #575 can be closed only when:

- [ ] the manifest is signed with a locally controlled key;
- [ ] signature verification succeeds;
- [ ] a real CID exists;
- [ ] a real IPNS name resolves to that CID;
- [ ] at least two independent public discovery/retrieval paths agree on the root;
- [ ] no private key or secret has been published.

## Security rule

Public decentralization metadata belongs in GitHub/Drive/IPFS. Private signing material stays under local/project control. A public endpoint must never be claimed as active before it has been tested.