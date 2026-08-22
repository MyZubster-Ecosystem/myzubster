# MyZubster NFT System MVP

This MVP introduces an ownership layer for MyZubster without making the MyZubster account itself an NFT.

## Model

- MyZubster account: identity and application profile
- GitHub OAuth: verified identity signal and provenance source
- Character: application-level avatar/lore, optionally minted as a Character NFT
- NFT assets: character, comic, item, badge
- Marketplace: MYZ-denominated listings
- Wallet: user-controlled, verified by signed challenge

## Non-custodial design

The backend never stores private keys and never signs mint/transfer transactions for users.

For the Character NFT MVP the flow is now:

1. User authenticates to MyZubster with a JWT.
2. Client requests `POST /api/wallet/challenge` with wallet address + chainId.
3. User signs the returned challenge in their wallet.
4. Client submits signature to `POST /api/wallet/verify`.
5. MyZubster recovers the signer address and stores that wallet as verified for the authenticated user.
6. User creates a `character` NFT draft with `POST /api/nft`.
7. The user wallet executes the mint on an allowlisted ERC-721 contract.
8. Client calls `POST /api/nft/:assetId/confirm-mint` with chainId, contract, tokenId, tx hash and owner wallet.
9. MyZubster fetches the receipt from the configured RPC, verifies success, contract allowlist, and an ERC-721 `Transfer(0x0, owner, tokenId)` event.
10. Only after that verification is the asset marked `minted`.

## Required environment variables

Configure an RPC and contract allowlist for every supported EVM chain. Example for chain ID `11155111` (Sepolia):

```env
EVM_RPC_URL_11155111=https://YOUR_SEPOLIA_RPC
NFT_CONTRACT_ALLOWLIST_11155111=0xYourCharacterContract
```

Fallback names are also supported:

```env
EVM_RPC_URL=https://YOUR_RPC
NFT_CONTRACT_ALLOWLIST=0xContractA,0xContractB
```

Do not put wallet private keys in MyZubster environment variables.

## API

### Wallet verification

Authenticated endpoints (`Authorization: Bearer <JWT>`):

- `POST /api/wallet/challenge`
- `POST /api/wallet/verify`
- `GET /api/wallet/me`

Challenge example:

```json
{
  "address": "0x...",
  "chainId": 11155111
}
```

The challenge expires after five minutes and is single-use after successful verification.

### Assets

Public reads:

- `GET /api/nft`
- `GET /api/nft/:assetId`

Authenticated writes:

- `POST /api/nft`
- `POST /api/nft/:assetId/confirm-mint`

`GET /api/nft` supports `type`, `status`, and `ownerWallet` query filters.

The verified mint endpoint currently accepts `character` assets only. It requires the NFT draft to belong to the authenticated user and the owner wallet to have completed MyZubster wallet verification for the same chain.

### Marketplace

- `GET /api/marketplace`
- `POST /api/marketplace/list`
- `POST /api/marketplace/:listingId/confirm-sale`
- `POST /api/marketplace/:listingId/cancel`

Prices are recorded in MYZ units via `priceMyz`. Payment settlement and sale receipt verification are not yet implemented.

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

This allows a verifier to connect source history, content, identity, mint transaction, and ownership.

## Character NFT example

Create the draft while authenticated:

```json
{
  "type": "character",
  "metadataUri": "ipfs://...",
  "contentHash": "sha256:...",
  "github": {
    "repo": "MyZubster-Ecosystem/myzubster",
    "commit": "ff4f283...",
    "path": "docs/assets/myzubster-digital-identity.png"
  },
  "attributes": {
    "characterVersion": 1,
    "githubVerified": true
  }
}
```

After the wallet mints, confirm it:

```json
{
  "chainId": 11155111,
  "contractAddress": "0x...",
  "tokenId": "1",
  "mintTxHash": "0x...",
  "ownerWallet": "0x...",
  "metadataUri": "ipfs://..."
}
```

A successful response includes `verifiedOnChain: true` and stores the verification block number on the asset.

## Security state

Implemented for Character NFT mint confirmation:

- JWT authentication on NFT writes
- creator ownership check
- wallet challenge/signature verification
- challenge expiry and one-time use
- RPC chain ID verification
- NFT contract allowlist
- successful transaction receipt check
- ERC-721 mint event verification (`Transfer` from zero address)

Still required before a production marketplace launch:

- authentication/authorization for all marketplace write operations
- on-chain verification of listing, transfer, payment and sale receipts
- MYZ token/marketplace contract allowlists
- replay/idempotency protections for sales
- rate limiting and abuse controls for wallet/NFT write APIs
- audited NFT and marketplace smart contracts
- production key/RPC secret management and monitoring

The backend remains non-custodial: possession of a MyZubster account never gives the server authority over the user's wallet.
