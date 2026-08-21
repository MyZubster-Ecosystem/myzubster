---
title: "Building an Open Digital MRV Infrastructure for Circular Water: the MyZubster LIFE 2026 Concept"
published: false
description: "How MyZubster proposes to connect circular water, IoT data, evidence provenance, MRV, digital environmental passports and European replication."
tags: life, sustainability, iot, opensource
cover_image:
---

# Building an Open Digital MRV Infrastructure for Circular Water

Environmental projects increasingly generate large volumes of data from treatment plants, sensors, laboratories, municipal systems and operational infrastructure.

The problem is not only collecting more data.

The real challenge is turning heterogeneous environmental data into **traceable, interoperable and scientifically validated evidence** that can support operational decisions, environmental reporting and replication.

This is the direction behind the **MyZubster LIFE 2026 concept**.

> The objective is not to build another environmental dashboard.  
> The objective is to demonstrate an open digital infrastructure that makes circular resource flows measurable, verifiable and replicable.

## The starting point: circular water

The proposed LIFE concept focuses first on **water reuse**.

The flagship demonstration idea is to digitally follow reclaimed wastewater through a chain such as:

**treatment → quality verification → availability → reuse → verified environmental benefit**

The proposed demonstration area is **Cesena–Rimini, Emilia-Romagna, Italy**.

The concept is currently structured for the LIFE 2026 **Circular Economy and Quality of Life** programme, under the Standard Action Project model.

## Why this matters

Environmental utilities and public authorities already operate complex infrastructure and monitoring systems.

Typical data sources may include:

- wastewater treatment operational data;
- online sensors;
- laboratory analysis;
- microbiological and chemical quality parameters;
- reclaimed-water volumes;
- reuse destinations;
- timestamps;
- geospatial information;
- environmental-performance indicators.

These datasets often remain fragmented across different organisations and technical systems.

That fragmentation makes it difficult to answer a simple but important question:

**Can we demonstrate, with reliable evidence, how much water was actually recovered, reused and converted into measurable environmental benefit?**

## The MyZubster role

Within the proposed architecture, MyZubster would act as the **Digital Infrastructure & Replication Technology Partner**.

The planned contribution includes:

- interoperability architecture;
- APIs;
- IoT and data integration;
- geospatial layers;
- evidence provenance;
- MRV workflows;
- dashboards and decision-support interfaces;
- open-source components;
- replication tools.

The digital layer would connect physical infrastructure and environmental evidence with scientific validation.

A simplified architecture is:

```text
PHYSICAL INFRASTRUCTURE
        ↓
SENSORS / OPERATIONAL DATA
        ↓
MYZUBSTER DATA LAYER
        ↓
MRV ENGINE
        ↓
SCIENTIFIC VALIDATION
        ↓
DASHBOARD / DECISION SUPPORT
        ↓
ENVIRONMENTAL IMPACT
        ↓
REPLICATION KIT
```

## From monitoring to evidence

One of the core ideas is to move from simple monitoring toward **evidence packages**.

A monitoring value alone is not enough.

For environmental MRV, a useful digital record should be able to associate data with context such as:

- origin;
- location;
- timestamp;
- quantity;
- quality;
- destination;
- measurement source;
- supporting evidence;
- environmental indicators.

This creates the basis for stronger provenance and auditability.

## A Digital Environmental Passport for Reclaimed Water

The LIFE concept explores the idea of a **Digital Environmental Passport for Reclaimed Water**.

For each verified reclaimed-water flow, the digital record could include:

```json
{
  "origin": "treatment facility",
  "quality": "validated parameters",
  "quantity": "verified volume",
  "destination": "reuse destination",
  "timestamp": "measurement time",
  "location": "geospatial reference",
  "indicators": {
    "primary_water_saved": "...",
    "energy": "...",
    "co2_equivalent": "..."
  },
  "evidence": "linked MRV records"
}
```

The final indicators would need to be defined and validated by the scientific and infrastructure partners.

The point is not to create a token or a marketing label.

The point is to create a **structured digital environmental record** that connects operational data to verifiable environmental outcomes.

## Proposed consortium logic

The current working concept defines complementary roles rather than treating software as the entire project.

### Public authority

A municipality or public authority would provide governance, policy integration, stakeholder engagement, urban demonstration and territorial replication.

### Scientific validation

A scientific or environmental body would define baseline, indicators, MRV methodology, data-quality rules, impact assessment and validation protocols.

### Water reuse technical partner

A specialist technical partner would contribute expertise on water reuse, water quality, monitoring technologies, sensor integration, circular-water methodology and technical validation.

### Infrastructure demonstration partner

A water or environmental utility would provide operational infrastructure, access to relevant data, sensors, real-world testing, demonstration conditions and industrial scalability.

### MyZubster

MyZubster would connect those layers through the digital architecture.

The proposed work-package logic includes a dedicated **Digital Environmental Infrastructure** work package and a **Replication & EU Uptake** work package.

## Why open source and interoperability matter

A LIFE project should not end as a one-off deployment that only works for one city.

The proposed MyZubster approach therefore includes a **Replication Kit** with elements such as open software components, API specifications, common data models, MRV methodology, sensor-integration guidelines, governance framework, deployment handbook, procurement guidance, training material and an exploitation/sustainability model.

The ambition is to make the Cesena–Rimini demonstration transferable to additional European municipalities and utilities without rebuilding the complete digital infrastructure from scratch.

## From a water pilot to an urban environmental layer

Water is the proposed first use case, but the architecture is designed to be extensible.

At urban scale, the same digital layer could potentially integrate selected datasets related to water, waste, energy, climate, biodiversity and environmental quality.

The important design principle is that each domain should retain its scientific methodology while sharing a common approach to:

**data → evidence → MRV → validation → impact → replication**

## What is still open

This is a **project concept under development**, not a claim that the final LIFE consortium or pilot has already been approved.

Several elements still need to be jointly defined with partners: final demonstration perimeter, environmental baseline, quantitative targets, accessible datasets, sensor interfaces, validation methodology, partner commitments, budget allocation, governance and data-sharing arrangements.

The current indicative project scale is **€2.5–4.0 million**, but the final budget would need to be reconstructed bottom-up from eligible LIFE activities.

## What we are looking for

We are interested in discussions with organisations that could contribute as:

- public applicant or coordinator;
- water utility or environmental infrastructure partner;
- scientific validation partner;
- circular-economy specialist;
- MRV and LCA expert;
- municipality or territorial replication partner;
- European project and consortium-building partner.

The strongest fit is with organisations that already operate real infrastructure, datasets or environmental programmes and want to convert those assets into **measurable and replicable environmental outcomes**.

## GitHub

MyZubster is being developed openly.

GitHub organisation:

**https://github.com/MyZubster-Ecosystem**

Main repository:

**https://github.com/MyZubster-Ecosystem/myzubster**

## Final thought

The value of environmental digitalisation is not the number of dashboards we can build.

It is whether we can connect **physical infrastructure, scientific evidence, digital interoperability and public governance** in a way that produces environmental results that can be measured, verified and replicated.

That is the problem MyZubster is trying to work on.

---

If you are working on **circular water, environmental MRV, IoT monitoring, scientific validation or European LIFE projects**, I would be glad to connect and compare approaches.
