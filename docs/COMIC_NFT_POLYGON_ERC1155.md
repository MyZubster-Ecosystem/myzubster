# MyZubster Comic NFT — Polygon ERC-1155 batch pipeline

This pipeline prepares and batch-mints comic images without exposing wallet keys or sending an unreviewed transaction.

## Safety model

- Source images are hashed with SHA-256 during metadata generation.
- Artwork and metadata must be pinned to IPFS before minting.
- The mint command performs a gas estimate and defaults to dry-run mode.
- A real mint requires the exact environment flag `CONFIRM_MINT=YES`.
- Deployment outside the local Hardhat network requires `CONFIRM_DEPLOY=YES`.
- Never commit a private key or seed phrase. Use a temporary shell environment or a hardware-wallet-compatible deployment workflow.

NFT ownership does not transfer copyright, trademark, personality, or commercial-use rights unless separate terms explicitly grant them. Do not include clinical records, private contact information, credentials, or other sensitive data in public metadata.

## 1. Generate metadata

After pinning the source artwork directory to IPFS:

```bash
npm run nft:comic1155:metadata -- \
  --input docs/visuals/comic \
  --output build/comic-1155-metadata \
  --image-base-uri ipfs://ARTWORK_DIRECTORY_CID
```

Review every generated JSON file and `manifest.json`. Then pin the complete metadata output directory to IPFS.

## 2. Test locally

```bash
npm run nft:compile
npm run nft:comic1155:test
```

## 3. Deploy to Polygon Amoy first

Use the Amoy testnet before considering Polygon mainnet:

```bash
export PRIVATE_KEY='use-a-secure-local-secret-source'
export POLYGON_AMOY_RPC_URL='your-authorized-rpc-url'
export CONFIRM_DEPLOY=YES
npm run nft:comic1155:deploy:amoy
```

Record the returned contract address.

## 4. Dry-run the batch mint

```bash
export COMIC_1155_CONTRACT='0x...'
export NFT_RECIPIENT='0x...'
export METADATA_BASE_URI='ipfs://METADATA_DIRECTORY_CID'
export COMIC_MANIFEST='build/comic-1155-metadata/manifest.json'
npm run nft:comic1155:mint:amoy
```

The command displays network, signer, recipient, item count, and estimated gas without sending a transaction.

## 5. Explicitly authorize a mint

Only after reviewing the dry run:

```bash
export CONFIRM_MINT=YES
npm run nft:comic1155:mint:amoy
```

Repeat the same review process for Polygon mainnet. Mainnet deployment or minting is not automatic and must not be represented as completed until the transaction is independently verified on-chain.
