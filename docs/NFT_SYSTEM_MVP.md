# MyZubster NFT System MVP

This MVP introduces an ownership layer for MyZubster without making the MyZubster account itself an NFT.

## Model

- MyZubster account: identity and application profile
- GitHub OAuth: verified identity signal and provenance source
- Character: application-level avatar/lore, optionally minted later
- NFT assets: character, comic, item, badge
- Marketplace: MYZ-denominated listings

## Non-custodial design

The backend never stores private keys and does not mint or transfer tokens on behalf of users in this MVP.

The intended flow is:

1. Create an NFT asset draft in MyZubster.
2. Prepare metadata and content externally/on IPFS.
3. User wallet or marketplace contract performs the mint.
4. Client submits `chainId`, `contractAddress`, `tokenId`, and `mintTxHash` to MyZubster.
5. MyZubster persists the chain identity and provenance.

The same pattern is used for sales: settlement happens through a wallet/contract, and MyZubster records a completed sale only after a transaction hash is available.

## API

### Assets

- `GET /api/nft`
- `POST /api/nft`
- `GET /api/nft/:assetId`
- `POST /api/nft/:assetId/confirm-mint`

`GET /api/nft` supports `type`, `status`, and `ownerWallet` query filters.

### Marketplace

- `GET /api/marketplace`
- `POST /api/marketplace/list`
- `POST /api/marketplace/:listingId/confirm-sale`
- `POST /api/marketplace/:listingId/cancel`

Prices are recorded in MYZ units via `priceMyz`. This MVP does not implement payment settlement or exchange-rate logic.

## GitHub provenance

An asset may record:

```json
{
  "github": {
    "repo": "MyZubster-Ecosystem/myzubster",
    "commit": "<commit-sha>",
    "path": "docs/assets/example.png"
  },
  "contentHash": "sha256:..."
}
```

This allows a future verifier to connect source history, asset content, mint transaction, and current ownership.

## Example draft

```json
{
  "type": "comic",
  "metadataUri": "ipfs://...",
  "contentHash": "sha256:...",
  "github": {
    "repo": "MyZubster-Ecosystem/myzubster",
    "commit": "ff4f283...",
    "path": "docs/assets/myzubster-digital-identity.png"
  },
  "edition": {
    "number": 1,
    "supply": 100
  },
  "attributes": {
    "issue": 1,
    "editionName": "Genesis"
  }
}
```

## Security work required before production minting

Before enabling public production writes, the API must add authenticated user ownership checks, wallet-signature verification, chain receipt verification, contract allowlists, replay protection, rate limiting, and authorization for listing/cancel/sale operations.

The current API is an MVP data model and integration surface, not a trustless marketplace contract.
