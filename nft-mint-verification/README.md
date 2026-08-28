# MyZubster NFT Mint Verification Core

This module verifies the evidence expected from an ERC-721 mint without requiring production RPC credentials or deployment configuration.

A valid mint must satisfy all of these conditions:

- the receipt is successful;
- the transaction targets an allowlisted NFT contract;
- the receipt contains `Transfer(0x0, owner, tokenId)` from that contract;
- the current on-chain owner matches the declared wallet;
- the on-chain `tokenURI` is non-empty;
- when a metadata URI is supplied, it matches the on-chain value;
- the observed chain ID matches the expected chain ID.

The module accepts injected owner/tokenURI readers so tests remain deterministic and do not depend on Sepolia, mainnet, RPC keys or live contracts.

## Current boundary

This is verification logic only. It does not connect to an RPC endpoint, persist NFT records, mint tokens, deploy contracts, move MYZ, create marketplace listings or store private keys.

Runtime integration must separately provide an approved RPC provider, chain-specific contract allowlist, authenticated user/wallet context and replay-safe persistence.

## Test

```bash
cd nft-mint-verification
npm install --ignore-scripts
npm test
```
