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


## Public checkpoint and provenance evidence

The N4K48 pilot now has a public, reviewable evidence branch:

- [Pilot evidence branch](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/tree/pilot/n4k48-tested-checkpoint)
- [Tested checkpoint `305d89ee6444210d52a1af27cbce54fc844ad51b`](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/commit/305d89ee6444210d52a1af27cbce54fc844ad51b)
- [Pilot Node evidence](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/pilot/n4k48-tested-checkpoint/pilot-tests/N4K48-PILOT-NODE-EVIDENCE.md)
- [Comics provenance commit `aeb49554da678b9bc5ba80f25d1f8af06b2b5f25`](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/commit/aeb49554da678b9bc5ba80f25d1f8af06b2b5f25)
- [`n4k48-comic-001` provenance evidence](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/pilot/n4k48-tested-checkpoint/pilot-tests/N4K48-COMIC-001-PROVENANCE.md)

For the tested checkpoint the published evidence records 54/54 Python tests passing and 7/7 Pilot Node automated checks passing. This supports the classification **locally tested / publicly reviewable evidence** for the local pilot implementation.

The provenance evidence does not change the rights or NFT boundary: `rights_status` remains `TO_VERIFY`; `n4k48-comic-001` remains `NFT_CANDIDATE / PROPOSED_FOR_REVIEW`; no mint, token ID, transaction hash or commercial-rights claim is implied.
