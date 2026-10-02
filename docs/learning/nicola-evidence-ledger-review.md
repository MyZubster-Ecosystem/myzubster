# Review evidence ledger — Nicola × MyZubster (2026-10-02)

This file records checks that can be made from the connected MyZubster side **without Nicola's additional testimony**. It is not a certification of personal competence, wallet ownership, or independent blockchain validation.

| Item | Evidence inspected | Result / limitation |
|---|---|---|
| GitHub account | Daniel explicitly identifies `nicolaususnicola-lgtm` as Nicola's account; repository commits queried with the connected GitHub account | Owner identification is Daniel's declaration, not an independent identity verification |
| Solidity experiment | [Repository Solidity source](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/contracts/MyZubsterProof.sol) and [source commit 2df5b391](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/commit/2df5b391f707eb0945dda9512ceb9387736b6402) | Actual source defines constructor-set `knowledgeHash`, `creator` and `timestamp`; commit is attributed to the GitHub account. This does not by itself prove contract deployment. |
| Ethereum Sepolia first deployment | [Repository report](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/docs/sepolia-proof.md) | Report identifies transaction `0x09dddd29aca76c9a425ba9cb45cefb1bfbe203b9628f5f9526e4a281012d4f20` and contract `0xabCF68e97a32eCa503942A563FF16F209ed45d11`, anchoring the **card URL string** hash. Direct independent explorer/RPC confirmation was not completed during this review. |
| Ethereum Sepolia versioned-payload proof | [V3 report](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/proofs/SEPOLIA_PROOF_V3.md) and [commit 14834783](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/commit/148347838cf7bd1c1b83853311fd7a543f5e50e1) | Report describes transaction `0x5c7717be6dc70e6416f8053c72bb1e2bec2b7c5462b23fcb9c4b1077f907fed4` and full-content-hash experiment; reporting a successful local verification is not the same as independently repeating it. |
| Nicola Comics local API | [Versioned test report](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/docs/nicola-comics/TEST-REPORT-2026-09-15.md) and [MyZubster issue #1176](https://github.com/MyZubster-Ecosystem/myzubster/issues/1176) | Local HTTP/manual test report records three comics, working `gallery`, `detail`, `candidate`, `next_steps`; no pytest run, public Zorgax end-to-end integration or NFT mint established. |
| Base Sepolia / MetaMask instruction | Daniel's firsthand declaration of in-person guided training | Network and training description captured; **no public Base Sepolia transaction hash** has been provided. These activities are distinct from the Ethereum Sepolia deployments above. |
| Ubuntu workstation setup | Daniel's firsthand declaration | Not independently corroborated by a setup log; neither proof of autonomous proficiency nor detailed hardware/user data is asserted. |

## Review actions

- Email sent to Nicola at an address previously used in exchanges with Daniel, requesting his review and public-consent decision. No reply has yet been received.
- The two narrative documents and this ledger remain in **draft PR #1434**. Do not merge or create a public Knowledge Card in Nicola's name until Nicola reviews the narratives and approves the proposed attribution.
- The explorer links can be opened by the reader from the upstream reports. In this review, direct explorer access was unsuccessful, so on-chain confirmation is **pending**, not assumed.
- No secret wallet or personal authentication information is requested or stored.
