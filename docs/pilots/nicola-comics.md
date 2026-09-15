# Nicola Comics pilot

This document records the upstream integration boundary for the participant-authored **Nicola Comics × MyZubster** pilot tracked in issue #1176.

## Public pilot endpoint

- Base URL: `https://myzubster-mvp.onrender.com`
- Catalog: `GET /api/comics`
- Detail: `GET /api/comics/{comic_id}`
- Zorgax adapter: `POST /api/zorgax/ask`

The pilot is intentionally read-only. Public Zorgax integration should map only to the verified actions `gallery`, `detail`, `candidate`, and `next_steps`.

## Provenance and verification

The public pilot implementation and configuration work are maintained by GitHub user `nicolaususnicola-lgtm` in `nicolaususnicola-lgtm/myzubster-mvp` and documented in MyZubster issue #1176.

The public endpoint has been reported as returning three comic entries. `n4k48-comic-001` remains `NFT_CANDIDATE / PROPOSED_FOR_REVIEW`; `rights_status` remains `TO_VERIFY`. `contract_address`, `token_id`, and `transaction_hash` must remain unset unless independently verifiable on-chain evidence exists.

## Integration rule

MyZubster must not imply that an NFT was minted, that rights were verified, or that an on-chain transaction occurred unless evidence is available. The public Zorgax flow should preserve the distinction between verified catalog data and `TO_VERIFY` fields.

## Completion criterion

A documented end-to-end check should demonstrate:

`public Zorgax request -> gallery -> detail/card -> image -> candidate -> rights/on-chain status`

without exposing local machines, private participant data, secrets, or unsupported payment/mint functionality.

Related: #1176

Co-authored-by: N4K48 <nicolaususnicola@gmail.com>
