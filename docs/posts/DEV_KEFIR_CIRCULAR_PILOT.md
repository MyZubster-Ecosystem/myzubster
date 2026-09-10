---
title: "From a Shared Kefir Culture to a Circular-Economy Pilot"
published: false
description: "How a volunteering experience inspired MyZubster's synthetic-first kefir traceability pilot."
tags: opensource, sustainability, blockchain, foodtech
---

# From a Shared Kefir Culture to a Circular-Economy Pilot

Some technology projects begin with a framework, a grant or a technical specification. This one began with a breakfast question:

**Why keep buying the same kind of product every morning if a living culture can be carefully maintained and used again?**

During my volunteering experience in community settings associated, in my personal account, with the Comunità Papa Giovanni, I learned about kefir. I wanted to help prepare yogurt-like fermented food for the morning routine. Instead of treating every breakfast as a new purchase, I began thinking about self-production, continuity and shared knowledge.

I obtained kefir grains through a direct person-to-person exchange and started maintaining my own culture. From there, the kitchen experiments expanded: fermented milk, fresh cheeses, ricotta-style preparations, and both sweet and savoury recipes.

This was my own initiative and a practical learning experience. It was not an official programme of the organisation, a clinical intervention or an authorized commercial food operation. I am not presenting it as proof of health benefits, quantified savings or food suitability for vulnerable people.

What stayed with me was the underlying model.

A kefir culture is not simply consumed. It is maintained, reproduced and passed on. Knowledge moves with it. Containers can return and be reused. Inputs, batches and outcomes can be observed. That pattern became one of the inspirations behind MyZubster.

## From domestic learning to an evidence-aware pilot

Today I still maintain kefir cultures at my home and at my grandmother's home. MyZubster is turning the lesson—not the unverified claims—into a candidate circular-economy pilot.

The proposed loop is:

```text
qualified input
    ↓
registered culture
    ↓
controlled fermentation batch
    ↓
quality check and human release
    ↓
reusable container
    ↓
distribution and return
    ↓
sanitation and reuse
```

The pilot begins with synthetic data. No food is distributed by the software demo.

MyZubster records public-safe identifiers for:

- culture lineage;
- production batches;
- process versions;
- quality-check evidence;
- reusable containers;
- container returns and sanitation;
- corrections and rejected events.

The events are signed and append-only. Their hashes can be grouped into a Merkle tree, while only a minimal Merkle root is anchored on a blockchain. Recipes, contact details, HACCP records, laboratory reports and any personal information remain off-chain.

Blockchain does not prove that food is safe or that a physical action occurred. It can help prove that a particular digital digest existed and was not silently changed. Food safety and batch release remain human responsibilities.

## What we want to measure

If the project reaches an authorized physical micro-pilot, the useful questions will be measurable:

- How many containers are returned?
- How many safe reuse cycles are completed?
- How much single-use packaging is avoided against a defined baseline?
- How much water and energy does cleaning and refrigeration require?
- How much product is rejected or becomes surplus?
- Can an independent reviewer reproduce the evidence trail?
- Are corrections visible rather than hidden?

A circular-economy claim only becomes meaningful when its baseline, method, unit and evidence source are clear.

## Safety before scaling

Before any real distribution, the pilot needs an authorized food operator, a defined site, HACCP responsibility, validated processing and shelf-life procedures, cold-chain controls where required, allergen and labeling review, and explicit permission from every participating organisation.

The first technical implementation is already connected to MyZubster:

- pilot charter: https://github.com/MyZubster-Ecosystem/myzubster/blob/main/docs/life/ventures/KEFIR_CIRCULAR_PILOT.md
- implementation tracker: https://linear.app/myzubster/issue/MYZ-155/pilot-kefir-circolare-integrazione-myzubster
- public repository: https://github.com/MyZubster-Ecosystem/myzubster
- website and visual chronicle: https://www.myzubster.com/fumetto

## A living metaphor for MyZubster

The strongest lesson was not that every product should be made at home. It was that communities can preserve useful capabilities instead of starting from zero every time.

A living culture survives through care, transmission and clear boundaries. An open-source ecosystem works in a similar way: knowledge is maintained, improved, shared and verified by people.

That is the bridge from my volunteering experience to MyZubster—and from a jar of kefir to a careful, measurable circular-economy experiment.

---

**Evidence note:** This article contains Daniel Ioni's personal recollection. It does not imply endorsement, affiliation, authorization or partnership by the Comunità Papa Giovanni, any associated community or therapeutic organisation. It makes no medical or therapeutic claims.
