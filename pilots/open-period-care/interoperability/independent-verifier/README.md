# Open Period Care — Independent Interoperability Verification

This directory contains the reproducible external verifier for the MyZubster Open Period Care node.

## Purpose

The verifier demonstrates that an independent machine can:

- connect to the public node over HTTPS;
- retrieve the node manifest;
- independently recalculate the manifest SHA-256;
- retrieve Knowledge Cards;
- independently recalculate Knowledge Card SHA-256 values;
- retrieve Evidence Payload v1 records;
- independently recalculate payload SHA-256 values;
- compare payload hashes with the manifest;
- verify published evidence states;
- generate a machine-readable PASS/FAIL report.

No SSH access, VPS credentials, database credentials or private infrastructure access are required.

## Target

https://bridge.myzubster.com/open-period-care

## Tested configuration

- Node: `open-period-care`
- Service version: `0.9.0`
- Mode: `read-only`
- Manifest schema: `myzubster.node.manifest.v1`
- Evidence schema: `myzubster.circular-care.evidence.v1`
- Verifier: `myzubster-opc-independent-verifier`
- Verifier version: `1.0.0`
- Runtime: Node.js `v24.21.0`
- Containerized: `true`

## Verification result

Tested at: `2026-10-05T10:30:00.863Z`

Result: `PASS — independent interoperability verified`

Manifest SHA-256:

`a173b0c4253643b68f692fb35b0cf49ee60f41c9c4d741de389fc26ecc52c43d`

### KC-OPC-001

Card SHA-256:

`360b98cce04f34f56f479dd51122c8e46abeacb1b467ff602cb5d7c51dc213b0`

Payload SHA-256:

`73d864cd49295408859f197bba7f170b3722a978909a27e90a82d04683eb3d85`

Evidence state: `SUPPORTED`

### KC-OPC-002

Card SHA-256:

`6a3c346501205328a00f4aa3f5d01e8dc3753d4001a7c7869f58556c22b47e47`

Payload SHA-256:

`a576fc507109a2db4507d8abdafbce6dac151bb5b57cebccba8a331dcf1f5ae7`

Evidence state: `SUPPORTED`

## Evidence boundary

This verification demonstrates technical interoperability and deterministic integrity.

It does not establish clinical validation, laboratory validation, regulatory approval, product effectiveness, scientific peer review or physical-world verification.

`SUPPORTED` remains distinct from `TESTED` and `VERIFIED`.

## Status

- Open Period Care node: READY
- Independent Docker verifier: READY
- External HTTPS connectivity: TESTED
- Manifest integrity: TESTED
- Knowledge Card integrity: TESTED
- Evidence Payload integrity: TESTED
- Cross-machine interoperability: TESTED
- Clinical/laboratory validation: NOT CLAIMED
