# MyZubster Metaverse Crypto Bridges

## Goal

Link an authenticated MyZubster/Zorgax identity to public wallets used by external crypto metaverses without custody.

Initial registry:

- Decentraland — MANA — Ethereum
- The Sandbox — SAND — Polygon/Ethereum/Base metadata; read-only SAND balance currently uses Ethereum by default

## Wallet ownership verification

A public wallet address alone is not considered verified.

Flow:

1. User links the public EVM address.
2. `POST /api/metaverse/bridge/links/:worldId/challenge` creates a five-minute nonce and exact message.
3. Wallet signs that exact text using `personal_sign` / EIP-191-style signing.
4. `POST /api/metaverse/bridge/links/:worldId/verify` asks a configured EVM JSON-RPC node for the Ethereum signed-message hash and uses the chain's `ecrecover` precompile in read-only mode to recover the signer address.
5. MyZubster sets `verifiedAt` only when the recovered address exactly matches the linked wallet.
6. The nonce is deleted after successful verification, preventing normal replay of the completed challenge.

Required deployment variable: `EVM_VERIFICATION_RPC_URL` or `ETHEREUM_RPC_URL`.

The signed text explicitly states that it proves wallet ownership only and does not authorize transfers, token approvals or spending.

## Read-only balances

After signature verification:

`GET /api/metaverse/bridge/portfolio/:worldId`

can query the configured RPC for the world's ERC-20 balance using `balanceOf(address)`.

Current token references:

- MANA Ethereum: `0x0f5d2fb29fb7d3cfee444a200298f468908cc942`
- SAND Ethereum: `0x3845badade8e6dff049820680d1f14bd3903a5d0`

Both can be overridden via `MANA_TOKEN_CONTRACT` and `SAND_TOKEN_CONTRACT`.

NFT/LAND discovery is intentionally not faked. It remains `not-configured` until a dedicated read-only indexer or official provider API is selected and tested.

## Security boundary

- public wallet addresses only
- no seed phrases or private keys
- no custody
- no swaps
- no cross-chain bridge execution
- no token transfers
- no approvals
- no escrow
- no automatic claim that a wallet is verified unless cryptographic verification succeeded
