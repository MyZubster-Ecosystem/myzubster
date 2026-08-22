# MyZubster NFT System MVP

This MVP introduces an ownership layer for MyZubster without making the MyZubster account itself an NFT.

## Model

- MyZubster account: identity and application profile
- GitHub OAuth: verified identity signal and provenance source
- Character: application-level avatar/lore, optionally minted as an NFT
- NFT assets: character, comic, item, badge
- Marketplace: MYZ-denominated listings

## Character NFT contract

The repository now includes `contracts/MyZubsterCharacter.sol`, an ERC-721 Character NFT contract with these MVP rules:

- mint is performed directly by the user's wallet (`msg.sender`)
- one Character NFT per wallet
- configurable maximum supply
- ERC-721 token URI metadata
- owner-controlled pause/unpause for emergency response
- MyZubster never receives or stores the user's wallet private key

The contract intentionally does not implement MYZ payments yet. Character minting and marketplace payment settlement remain separate concerns.

## Sepolia deployment

Install dependencies and compile:

```bash
npm install
npm run nft:compile
```

Set deployment variables locally. Never commit the real deployer key:

```bash
export EVM_RPC_URL_11155111='https://YOUR_SEPOLIA_RPC'
export EVM_DEPLOYER_PRIVATE_KEY='0xYOUR_PRIVATE_KEY'
export CHARACTER_NFT_MAX_SUPPLY=10000
```

Deploy:

```bash
npm run nft:deploy:sepolia
```

The deployment script prints the deployed address and the backend allowlist variable, for example:

```text
CHAIN_ID=11155111
MYZUBSTER_CHARACTER_CONTRACT=0x...
NFT_CONTRACT_ALLOWLIST_11155111=0x...
```

Configure the runtime with:

```text
EVM_RPC_URL_11155111=https://...
NFT_CONTRACT_ALLOWLIST_11155111=0x...
```

`EVM_DEPLOYER_PRIVATE_KEY` is a deployment-only secret and should not be stored in the MyZubster web runtime after deployment.

## Non-custodial mint flow

The intended Character NFT flow is:

1. User signs in to MyZubster.
2. User requests a wallet challenge.
3. User signs the challenge in their wallet.
4. MyZubster verifies and links the wallet to the authenticated account.
5. User creates a `character` NFT draft.
6. The browser wallet calls `mintCharacter(metadataUri)` directly on the allowed ERC-721 contract.
7. The wallet returns the transaction hash.
8. Client submits `chainId`, `contractAddress`, `tokenId`, and `mintTxHash` to MyZubster.
9. MyZubster verifies the RPC receipt, contract allowlist, and ERC-721 `Transfer(0x0, owner, tokenId)` log before marking the asset `minted` / verified on-chain.

## API

### Wallet

- `POST /api/wallet/challenge`
- `POST /api/wallet/verify`

Wallet verification uses a short-lived, one-time challenge signed by the wallet and linked to the authenticated MyZubster user.

### Assets

- `GET /api/nft`
- `POST /api/nft`
- `GET /api/nft/:assetId`
- `POST /api/nft/:assetId/confirm-mint`

`GET /api/nft` supports `type`, `status`, and `ownerWallet` query filters.

NFT write operations are JWT-authenticated, and Character NFT creation/confirmation is bound to the authenticated user and verified wallet.

### Marketplace

- `GET /api/marketplace`
- `POST /api/marketplace/list`
- `POST /api/marketplace/:listingId/confirm-sale`
- `POST /api/marketplace/:listingId/cancel`

Prices are recorded in MYZ units via `priceMyz`. This MVP does not yet implement trustless MYZ settlement.

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

This lets a verifier connect source history, asset content, mint transaction, and current ownership.

## Security boundary

Already included in this MVP:

- authenticated NFT writes
- wallet ownership challenge/signature verification
- challenge expiry and one-time nonce use
- Character creator ownership checks
- RPC chain ID validation
- per-chain NFT contract allowlist
- transaction receipt verification
- ERC-721 mint event verification
- non-custodial private-key model

Still required before a production marketplace launch:

- authenticated marketplace ownership checks
- on-chain MYZ payment and NFT transfer verification for sales
- sale replay protection
- contract audit
- metadata pinning/immutability policy
- rate limiting for wallet/NFT writes
- production monitoring and alerting
- legal/product review of token/NFT sale flows in target jurisdictions

The current system is an MVP integration and verification layer, not a production-audited marketplace.
