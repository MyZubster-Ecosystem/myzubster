# MyZubster Use Case — Assisted Technical Diagnostics at Urban Lab

**Status:** field demonstration / self-reported use case  
**Date:** 2026-08-21  
**Context:** in-person demonstration at Urban Lab  
**Vehicle discussed:** KuKirin G2 Max electric scooter  

## What happened

During an in-person visit at Urban Lab, Daniel demonstrated how an AI-assisted MyZubster workflow can support a real technical question. The immediate problem was a KuKirin G2 Max that would not power on.

The assistance did not claim to identify the failed component remotely. Instead, it proposed an ordered diagnostic path intended to reduce unnecessary replacement of parts:

1. verify battery output voltage;
2. verify that battery voltage reaches the controller input;
3. inspect the main battery/controller connectors;
4. inspect the cable running through the stem toward the display/power controls, especially at bend and entry points;
5. verify whether the display/power circuit receives supply;
6. investigate the controller only after the upstream power path has been checked.

The safety boundary was explicit: do not short wires to force startup and do not open the lithium battery pack merely to perform this diagnostic sequence.

## Why this matters for MyZubster

This field demonstration illustrates a practical path from a real-world problem to a structured digital workflow:

`physical problem -> assisted diagnosis -> technician checks -> evidence -> verified contribution -> reputation -> optional MYZ bounty record`

The purpose is not to replace the technician. The system should help organize troubleshooting, preserve evidence and make useful contributions auditable.

## Proposed ecosystem integration

### 1. Physical service layer

A participating workshop or technician performs measurements and physical inspection. The workshop remains responsible for the actual repair decision and safe handling of the vehicle.

### 2. Assistance layer

MyZubster can present model-specific diagnostic checklists, documentation references and an ordered set of tests. AI output is advisory and must distinguish observed facts from hypotheses.

### 3. Evidence layer

With the customer's consent, a service event can record non-sensitive evidence such as:

- vehicle model;
- symptom;
- measurements taken;
- components checked;
- diagnostic result;
- repair outcome;
- hashes or references to supporting artifacts when appropriate.

Personal data should be minimized. Government identity documents, private keys and unnecessary customer information do not belong in a public service record.

### 4. Bounty and contribution layer

A useful diagnostic contribution could later become a MyZubster bounty. Examples include creating a reproducible diagnostic checklist, documenting a confirmed connector failure pattern, improving a repair guide or independently verifying a procedure.

The existing bounty lifecycle can represent this as:

`OPEN -> CLAIMED -> SUBMITTED -> UNDER_REVIEW -> VERIFIED -> MYZ_RECORDED`

`MYZ_RECORDED` means an internal MyZubster reward/accounting entry exists. It must not be described as fiat or blockchain settlement without separate evidence.

### 5. Reputation layer

Only reviewed, auditable events should affect contributor reputation. A technician should not gain reputation merely for claiming expertise; reputation should derive from verified contributions and outcomes.

### 6. Metaverse / digital-twin layer

A future MyZubster metaverse interface could represent the workshop, vehicle or service event as a digital object linked to the underlying evidence. The visual/metaverse representation is a navigation and interaction layer, not the source of truth. Verification remains anchored in signed records, hashes, evidence and the relevant registry.

## Demonstration value

The Urban Lab interaction is useful because it shows MyZubster beginning from an ordinary, concrete need rather than from abstract decentralization terminology. A person can ask for help with a vehicle, receive a structured diagnostic path, have a technician validate the physical facts, and potentially turn the resulting knowledge into a reusable contribution for the wider ecosystem.

## Evidence status

This document records Daniel's account of the demonstration. It is **not** an endorsement, partnership agreement or testimonial by Urban Lab, and it does not claim that Urban Lab has joined MyZubster. Any future public statement describing Urban Lab as a partner, verifier or participating node requires explicit authorization from Urban Lab.

## Next implementation steps

- define a generic `service-event` JSON schema;
- add consent/privacy fields and evidence hashes;
- connect verified service contributions to the Bounty Platform Engine;
- derive reputation only after review;
- build a simple workshop-facing diagnostic UI;
- optionally create metaverse/digital-twin views that resolve back to the canonical service record.
