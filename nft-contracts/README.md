# MyZubster NFT contract core

This directory contains the isolated smart-contract slice extracted from the larger NFT marketplace MVP.

Included:

- `MyZubsterCharacter`: ERC-721 Character NFT with one-character-per-wallet, max supply and pause/unpause.
- `MyZubsterMarketplaceEscrow`: atomic ERC-20-for-ERC-721 settlement contract.
- `MockMYZ`: test-only ERC-20 used to validate settlement behavior without depending on deployment state.
- Hardhat compile/test tooling and CI.

This slice intentionally does **not** activate marketplace runtime routes, wallet writes, mint verification APIs, deployment scripts, production RPC configuration, or any on-chain deployment.

## Verification boundary

Passing CI proves that the contracts compile and the included local Hardhat tests pass. It does not prove contract audit status, mainnet/Sepolia deployment, MYZ token compatibility in production, economic safety, metadata immutability, or end-to-end marketplace readiness.

Before any public deployment, complete an independent smart-contract security review and explicitly approve chain, token and contract addresses.
