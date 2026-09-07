# MyZubster Comic NFT — Base Sepolia

## Status

This document records the first testnet NFT deployment for the MyZubster Comic Universe.

**Network:** Base Sepolia  
**Chain ID:** 84532  
**Collection:** MyZubster Comic Universe  
**Symbol:** `MYZCOMIC`  
**Contract:** `0x89f20a2697bc2e7746b5FC8dD5229Fb54C00Bb03`  
**Token ID:** `0`  
**Owner:** `0xF0d3518F23dA9962b34AE6d803cD2Ab5c6e6A08B`

Contract explorer:

https://sepolia.basescan.org/address/0x89f20a2697bc2e7746b5FC8dD5229Fb54C00Bb03

Mint transaction:

https://sepolia.basescan.org/tx/0x9258c3c33dbb91ebef27f43477918746eca49288eab44c3a3f54d48b300485f0

Mint block: `46489142`

## Comic #001

**Name:** MyZubster Comic #001 — La Città Come Organismo  
**Classification:** `FICTION / CONCEPT`  
**Public Comic Universe:** https://www.myzubster.com/fumetto

Canonical repository artwork used for the first NFT:

`docs/visuals/storytelling/MyZubster_Comic_01_La_Citta_Come_Organismo.png`

### IPFS

Artwork CID:

`Qmb7M27Ufh5jA5soeEwkZs8vWW7FwftuZoAoSmLuNiLBxQ`

Artwork URI:

`ipfs://Qmb7M27Ufh5jA5soeEwkZs8vWW7FwftuZoAoSmLuNiLBxQ`

Metadata CID:

`QmRRQCJ5Lp9mxR3bG5FMZxj15CwSVw5oGRb1BFHs6UUSE3`

Metadata URI / tokenURI:

`ipfs://QmRRQCJ5Lp9mxR3bG5FMZxj15CwSVw5oGRb1BFHs6UUSE3`

The metadata is also versioned in this repository at:

`nft/metadata/001-la-citta-come-organismo.json`

## On-chain verification

After the mint transaction was confirmed, the contract returned:

```text
ownerOf(0)
0xF0d3518F23dA9962b34AE6d803cD2Ab5c6e6A08B

tokenURI(0)
ipfs://QmRRQCJ5Lp9mxR3bG5FMZxj15CwSVw5oGRb1BFHs6UUSE3
```

This confirms that token `#0` exists on Base Sepolia, is owned by the recorded test wallet, and resolves to the expected IPFS metadata.

## Architecture

```text
MyZubster Comic artwork
        ↓
IPFS artwork CID
        ↓
NFT metadata JSON
        ↓
IPFS metadata CID
        ↓
MyZubsterComicNFT (ERC-721)
        ↓
Base Sepolia
        ↓
Token #0
```

## Contract

The collection contract is:

`contracts/MyZubsterComicNFT.sol`

It uses:

- ERC-721
- ERC721URIStorage
- Ownable mint authorization
- per-token IPFS metadata URIs
- a `ComicMinted` event for verifiable issuance

Only the contract owner can mint new Comic NFTs.

## Local test

Compile:

```bash
npm run nft:compile
```

Run the local smoke test:

```bash
npm run nft:test:local
```

The validated local flow covers:

```text
deploy → name/symbol → mint → ownerOf → tokenURI
```

## Base Sepolia deployment

The Hardhat config reads the EVM private key from the environment:

```text
PRIVATE_KEY
```

Never commit a private key, mnemonic, wallet password, or seed phrase.

Deploy:

```bash
npm run nft:deploy:base-sepolia
```

The current public deployment is already recorded above. Re-running the deploy command creates a new contract and therefore a different collection address.

## Minting Comic #001

The mint script is:

`scripts/nft/mint-comic-001.js`

It targets the recorded Base Sepolia contract and metadata URI.

```bash
npm run nft:mint:comic-001
```

Do **not** re-run this command merely to verify token `#0`: it will mint another token. Use read-only contract calls or BaseScan instead.

An optional recipient can be supplied through:

```text
NFT_RECIPIENT=0x...
```

## RPC propagation note

During the first deployment and mint, the public Base Sepolia RPC briefly returned stale read results immediately after confirmed transactions. The deployment and mint scripts therefore include retry/wait logic for post-transaction reads.

The original mint was subsequently verified successfully through `ownerOf(0)` and `tokenURI(0)`.

## IPFS persistence

The artwork and metadata were added to an IPFS node and pinned locally during the initial test.

A local pin alone does **not** guarantee permanent public availability. Before any production/mainnet release, MyZubster should add redundant pinning through at least one independent pinning provider or additional IPFS node and periodically verify retrievability of both CIDs.

## Testnet-only status

This deployment is a technical test and proof of integration on **Base Sepolia**. It is not a Base mainnet release and should not be represented as a production-market NFT sale.

The `FICTION / CONCEPT` classification in Comic metadata describes the narrative work. NFT ownership represents ownership of the token; it does not automatically transfer copyright, trademark rights, commercial licensing rights, or rights over third-party material unless separate terms explicitly say so.

## Next steps

1. Add redundant IPFS pinning.
2. Add automated contract tests in the repository test suite.
3. Add a read-only NFT panel to `https://www.myzubster.com/fumetto`.
4. Display contract address, chain, token ID and metadata verification publicly.
5. Define licensing/collector terms before any mainnet mint or sale.
6. Review contract security and deployment procedure before Base mainnet.
