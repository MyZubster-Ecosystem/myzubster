# Hardware Knowledge Cards — Evidence-backed draft

Date: 2026-10-07

Purpose: represent hardware/IoT knowledge already evidenced in MyZubster without turning repository presence into automatic certification.

These records are **evidence-backed drafts** for the Knowledge Graph / Contributor Passport layer. They do not impersonate contributor-owned public Knowledge Cards. Publication from a personal MyZubster account remains an explicit owner action.

## Status rules

- `PROPOSED` — candidate knowledge relationship, not yet owner-published.
- `DOCUMENTED` — supported by identifiable public repository/PR/contribution evidence.
- `TESTED` — a bounded technical checkpoint has been independently reproduced.
- `VERIFIED` — reserved for a stronger review/verification appropriate to the claim.

Hardware knowledge here means practical integration/prototyping/IoT work. It does **not** imply formal engineering credentials, electrical safety certification, product certification, or authorship of every related component.

---

## HKC-HW-001 — Daniel Ioni / MyZubster hardware & IoT integration

**Owner / subject:** Daniel Ioni / MyZubster maintainer context  
**Domain:** Hardware integration / IoT / Arduino / ESP32 / smart-garden data flows  
**State:** `DOCUMENTED`  
**Public-card state:** `PROPOSED — OWNER PUBLICATION PENDING`

### Supported scope

The MyZubster repository contains a dedicated Arduino/ESP32 integration layer for smart-garden and environmental sensing, including:

- `arduino/README.md` — Arduino examples for smart gardens, pH/EC sensing, Wi-Fi and cloud upload;
- `arduino/docs/wiring.md` — Arduino Uno and ESP32 DevKit wiring guidance;
- `arduino/components/components.md` — controller/component inventory;
- `arduino/examples/WifiUpload/WifiUpload.ino` — ESP32 Wi-Fi + HTTP upload to MyZubster API;
- `arduino/examples/PhEcSensor/PhEcSensor.ino`;
- additional environmental sensor examples for light, pressure and soil moisture.

This supports a claim of **practical MyZubster hardware/IoT integration knowledge at the project-maintainer layer**.

### Boundary

This record does not claim:
- formal electronics/engineering qualification;
- sole authorship of all Arduino code;
- independent laboratory validation of sensor accuracy;
- electrical/product safety certification.

### Passport link target

`Contributor Passport → Daniel Ioni → Hardware & IoT Integration`

Suggested relation:
`CONTRIBUTOR → DOCUMENTED_KNOWLEDGE → HARDWARE/IoT INTEGRATION`

---

## HKC-HW-002 — @foxxx009 Arduino sensor data ingestion

**Owner / subject:** @foxxx009  
**Domain:** Arduino / sensor data ingestion / IoT integration  
**State:** `DOCUMENTED`  
**Public-card state:** `PROPOSED — EXPLICIT CONSENT / OWNER PUBLICATION PENDING`

### Evidence

The public `CONTRIBUTORS.md` records:

- contributor: `@foxxx009`;
- PR/contribution reference: `#177 (#144)`;
- description: **Arduino sensor data ingestion API**;
- historical reward record associated with that contribution.

Additional MyZubster Arduino documentation shows the surrounding technical context for pH/EC, ESP32/Wi-Fi and sensor upload, but the competence claim for @foxxx009 is intentionally bounded to the contribution explicitly attributed to that account.

### Boundary

Do not infer:
- physical assembly of every sensor;
- pH/EC calibration expertise beyond the evidenced contribution;
- formal hardware engineering credentials;
- ownership of the entire Arduino subsystem.

### Passport link target

`Contributor Passport → @foxxx009 → Arduino sensor data ingestion`

Suggested relation:
`CONTRIBUTOR → DOCUMENTED_CONTRIBUTION → ARDUINO SENSOR INGESTION`

---

## HKC-HW-003 — @Aming9303 environmental sensor adapter

**Owner / subject:** @Aming9303  
**Domain:** IoT / environmental evidence / sensor adapter integration  
**State:** `DOCUMENTED`  
**Technical adjacent state:** signed payment-webhook checkpoint separately `TESTED` in the Contributor Interoperability Matrix  
**Public-card state:** `PROPOSED — EXPLICIT CONSENT / OWNER PUBLICATION PENDING`

### Evidence

The public contributor evidence index includes:

- `@Aming9303` — **Environmental sensor adapter contract**;
- MyZubster PR `#859`;
- status: merged;
- domain: `IoT / Environmental Evidence`.

The Contributor Interoperability Matrix also lists environmental sensor adapters among @Aming9303's public work. The independently reproduced `TESTED` status in that matrix applies to the **signed payment webhook regression**, not automatically to the sensor adapter.

### Boundary

Therefore the sensor-adapter knowledge remains `DOCUMENTED`, not `TESTED`, until a dedicated adapter checkpoint is reproduced.

Do not infer:
- physical sensor installation;
- sensor calibration;
- electronics design;
- x402/escrow implementation unless supported by separate evidence.

### Passport link target

`Contributor Passport → @Aming9303 → Environmental sensor adapter integration`

Suggested relation:
`CONTRIBUTOR → DOCUMENTED_CONTRIBUTION → ENVIRONMENTAL SENSOR ADAPTER`

---

## Nicola / N4K48 — explicit hardware boundary

No electronics-hardware Knowledge Card is created for Nicola from the current evidence.

Supported knowledge remains in:
- independent Docker/runtime node;
- Node Bridge / interoperability;
- read-only API integration;
- semantic knowledge retrieval;
- local software/infrastructure operation.

A future hardware card should require a concrete public hardware contribution or reproducible physical/firmware checkpoint.

---

## Knowledge Graph mapping

```text
Daniel Ioni
  └─ DOCUMENTED_KNOWLEDGE → Hardware & IoT Integration
      ├─ Arduino / ESP32
      ├─ sensor data flows
      ├─ smart-garden integration
      └─ API/cloud bridge

@foxxx009
  └─ DOCUMENTED_CONTRIBUTION → Arduino sensor data ingestion API

@Aming9303
  └─ DOCUMENTED_CONTRIBUTION → Environmental sensor adapter integration

Nicola / N4K48
  └─ no electronics-hardware claim from current evidence
```

## Promotion path

For each contributor-owned public Knowledge Card:

`PROPOSED → OWNER CONSENT → OWNER-PUBLISHED KNOWLEDGE CARD → EVIDENCE LINK → REVIEW → optional TESTED/VERIFIED`

No MyZubster maintainer should publish a personal competence card on behalf of another contributor without explicit authorization.
