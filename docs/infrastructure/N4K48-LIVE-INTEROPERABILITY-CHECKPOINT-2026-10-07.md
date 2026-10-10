# N4K48 live interoperability checkpoint — 2026-10-07

## Status

**TESTED** — bounded technical interoperability checkpoint.

This document records the successful live test between the MyZubster contributor-verification infrastructure and the contributor-controlled N4K48 environment.

It does **not** establish complete decentralization, direct P2P networking, security certification, employment status, payment status, or any scientific/clinical validation.

## Canonical source

- Pull request: #1545 — `fix: harden Nicola catalog agent before authenticated bridge test`
- Merge commit: `0c00836a96b36d7c64de098dd26d39ac5ddaf98a`
- PR head used for the live checkpoint: `0be7a6e38d8266d1b29ac6367ad345c65a2d2490`

## Verified runtime references

- N4K48 agent SHA-256:
  `75ab34d21f668fa48383ac7070c717b074c868694c3042928e4532b5ccd34fa1`
- Deployed broker image:
  `sha256:8b12286214237c650d8f54edb96a49e635a70e8b9db87e47aec3ea912683a6c1`
- Deployed broker.py SHA-256:
  `57deb663ceb990c8ddd709f04ae646dd0dd87ff3fb33bbdfa0d28be0bddafca6`

## Live path tested

`VPS → authenticated HTTPS broker → N4K48 agent → local catalog → result returned to Bridge`

The N4K48 environment remained contributor-controlled and outbound-only for this pilot.

## Observed result

A live `gallery` job created on the VPS was acquired by the N4K48 agent and completed successfully.

The broker returned `state: done` with four titles:

1. Dall’idea software al metaverso
2. Il software prende forma
3. Verso Neon Plaza
4. Il ponte da costruire

Repeated reads returned the same completed result during the job TTL. After expiry, the broker returned the expected expired state.

This confirms the four-title result contract on the deployed bridge and successful end-to-end processing for this bounded test.

## Related broker checks

Before the participant-controlled live run, the broker contract suite and live broker checks covered:

- four-title gallery acceptance;
- five-title rejection;
- bounded error acceptance;
- arbitrary error rejection;
- authentication enforcement;
- lease expiry;
- lease reassignment;
- stale lease rejection;
- current lease acceptance.

## Pilot closure

After the live PASS:

- PR #1545 was merged;
- the participant test agent was instructed to stop and be removed;
- the node credential used for the pilot was rotated on the VPS;
- local broker health returned HTTP 200;
- the public node endpoint without authentication returned HTTP 401;
- the replacement node credential was present with the expected 64-character value length, without exposing its value.

The pilot credential is therefore no longer intended for reuse.

## Evidence semantics

- Technical interoperability: **TESTED**
- Merge linkage: **CANONICAL**
- Complete decentralization: **NOT_ESTABLISHED**
- Direct P2P: **NOT_ESTABLISHED**
- Security certification / pentest: **NOT_ESTABLISHED**
- Payment / bounty status: **NOT_INFERRED**

This checkpoint should be cited only within the bounded scope above.