# Community UX Feedback 001 — 30-second clarity

**Source:** public Instagram community feedback by `cano_sat`, shared with the project maintainer on 2026-08-23.

**Scope:** external UX observation. The public handle is recorded only for contribution attribution; no legal identity, employment, partnership or endorsement is inferred.

## Core observation

A newcomer can struggle to identify MyZubster's main thread because the public story moves quickly among Zorgax, GitHub, privacy/crypto, robotics, environment, LIFE, metaverse, characters, space-station concepts and urban observations.

The feedback proposes a simpler public order:

1. What is MyZubster?
2. What problem does it solve?
3. How does it work concretely?
4. Show one real case.
5. Only then explain the wider ecosystem.

It also recommends reducing slide density: one public visual should communicate one main idea instead of behaving like a compressed technical document.

## Adopted UX requirement

A first-time visitor should be able to understand the main MyZubster loop within approximately 30 seconds without already knowing internal project vocabulary.

Canonical first-level narrative:

**OBSERVE → REPORT → ACT → VERIFY → IMPACT**

Secondary systems such as Zorgax, LIFE, robotics, marketplace, metaverse, identity, rewards and other modules should appear after the core loop is understood.

## Evidence boundary

The Rimini example must preserve the distinction between real evidence and narrative illustration. A Chronicle may explain a cleanup/reporting workflow but does not prove the physical event by itself. Real photographs, repository records and applicable verification workflows remain separate sources.

## Implementation

The first implementation is proposed in branch `zorgax/clarity-first-home-001`:

- a new clarity-first public home;
- the five-step core loop;
- a real Rimini evidence reference separated from the Porta Galliana narrative workflow;
- the wider ecosystem moved behind an explicit `Explore the ecosystem` action;
- first-visit identity onboarding removed as the blocking public entry experience.

## Contributor path

The feedback is treated as a material community contribution. If the contributor later provides a GitHub alias and wants direct repository participation, that alias can be linked to this record or to the corresponding issue/PR. No identity mapping is guessed automatically.
