# Circular Care Mass-Balance Pilot — Experimental Protocol v0.1

**Status:** PROPOSED / NOT YET EXPERIMENTALLY VALIDATED  
**Purpose:** university review and controlled proof-of-concept.  
**Scope:** absorbent products such as diapers, adult incontinence products and sanitary pads.

## 1. Research question

Can a controlled, documented lab-scale process produce a reproducible mass balance for absorbent-product material fractions, with evidence whose integrity and version can be independently checked?

This protocol does **not** assume that recovered materials are safe, reusable, recyclable at industrial scale, economically viable, environmentally preferable or regulatorily approved.

## 2. Primary outcome

For each trial record:

`M_initial = Σ M_recovered + M_residual + M_loss`

and calculate:

`closure (%) = (Σ M_recovered + M_residual + M_loss) / M_initial × 100`

The university/reviewer should define an acceptable closure tolerance before interpreting results.

## 3. Staged sample plan

### Stage A — controlled materials
Begin with laboratory-defined clean/unused materials or representative components. Record composition when known, supplier/source, sample ID and conditioning.

### Stage B — post-consumer material
Only after institutional approval and an appropriate risk assessment. Used absorbent products may involve biological, hygiene, waste-handling, storage, transport and disposal requirements. The responsible institution determines whether and how this stage may proceed.

No participant should improvise decontamination, chemical treatment or biological-waste handling from this document.

## 4. Minimum equipment and metrology record

The qualified laboratory defines suitable equipment. For every weighing instrument record:

- instrument ID/model;
- measurement range and resolution;
- calibration/verification status where applicable;
- date/time of measurement;
- operator or pseudonymous operator ID where appropriate;
- measurement uncertainty or laboratory-defined uncertainty method;
- environmental/conditioning information when relevant.

## 5. Trial record

Each trial receives a unique ID and records:

1. protocol version;
2. sample ID and sample definition;
3. initial mass;
4. documented process steps;
5. recovered fraction names and masses;
6. residual fraction mass;
7. measured or estimated losses and the estimation method;
8. uncertainty information;
9. deviations from protocol;
10. raw data file references;
11. analysis script/version where used;
12. reviewer notes.

The detailed separation/treatment procedure must be authored or approved by the responsible qualified laboratory before experimentation.

## 6. Replication and controls

Before data collection, the study team should define:

- number of independent repetitions;
- controls/reference samples appropriate to the chosen process;
- acceptance criteria;
- treatment of missing data and outliers;
- stopping/exclusion rules;
- statistical analysis plan.

These choices should be versioned before results are interpreted where feasible.

## 7. Evidence package

Suggested structure:

```text
circular-care/
  protocol/
    protocol-v0.1.md
  trials/
    TRIAL-001/
      metadata.json
      raw-data/
      processed-data/
      analysis/
      evidence-manifest.json
  reports/
  hashes/
```

Do not publish personal, confidential, restricted, unsafe or institutionally protected data merely to make the project public.

## 8. Canonical evidence manifest

Each completed evidence package should identify:

- project and trial ID;
- protocol version;
- file names and versions;
- canonicalization method;
- SHA-256 digest(s);
- creation timestamp;
- reviewer/status field;
- corrections/amendments without silently overwriting prior evidence.

## 9. Optional blockchain anchoring

After the evidence package is frozen, its canonical SHA-256 commitment may optionally be anchored on a suitable blockchain.

The anchor can support verification that a particular digital commitment existed by a point in time and that later files match that commitment.

It does **not** prove:
- the physical sample identity;
- that recycling actually occurred;
- measurement accuracy;
- material safety or fitness for reuse;
- environmental benefit;
- scientific validity;
- regulatory approval;
- university or manufacturer endorsement.

## 10. Analysis and reporting

Report at minimum:

- mass balance and closure for each trial;
- aggregate results across repetitions;
- uncertainty;
- protocol deviations;
- unexplained losses;
- limitations;
- negative/null results as well as positive results;
- distinction between measured facts, calculated values and interpretation.

Environmental claims require additional appropriate evidence (for example a defined lifecycle or comparative methodology); mass recovery alone is not proof of environmental benefit.

## 11. Review gates

**Gate 0 — protocol review:** qualified university/laboratory review before experimental work.  
**Gate 1 — safety/ethics/regulatory review:** institutional requirements satisfied for the chosen samples and methods.  
**Gate 2 — controlled proof-of-concept:** Stage A trials completed and evidence frozen.  
**Gate 3 — replication:** predefined repetitions/controls completed.  
**Gate 4 — qualified scientific review:** methods, data and interpretation reviewed.  
**Gate 5 — industrial evaluation:** only after evidence supports escalation; manufacturers/recyclers independently evaluate relevance and scale-up.

Passing one gate does not imply passing the next.

## 12. MyZubster / Zorgax role

MyZubster may organize project identity, evidence provenance, GitHub records and optional cryptographic commitments. Zorgax may assist documentation, consistency checks and analysis workflows.

Human investigators remain responsible for experimental decisions, measurements, safety, interpretation and approval. AI-generated content must not be recorded as an experimental observation unless independently verified and clearly labelled.

## 13. Versioning

- Protocol ID: `MYZ-CC-MASS-BALANCE`
- Version: `0.1`
- State: `PROPOSED`
- Validation state: `NOT YET EXPERIMENTALLY VALIDATED`

Any university adaptation should create a new version and preserve the previous protocol and change history.


## 14. Hospital Waste Stream Pilot — PROPOSED

A second-stage study may evaluate absorbent products arising from a **real hospital waste stream**, but only after the responsible institution has classified the relevant waste stream and approved the sampling and handling pathway.

### Governance-first flow

```text
HOSPITAL / HEALTHCARE FACILITY
        ↓
WASTE / HYGIENE RESPONSIBLE FUNCTION
        ↓
WASTE CLASSIFICATION + RISK ASSESSMENT
        ↓
UNIVERSITY / QUALIFIED RESEARCH PROTOCOL
        ↓
AUTHORIZED WASTE OPERATOR / APPROVED SAMPLING PATH
        ↓
CONTROLLED SAMPLE + CHAIN OF CUSTODY
        ↓
AUTHORIZED MEASUREMENTS / PROCESS
        ↓
MASS-BALANCE DATASET
        ↓
EVIDENCE MANIFEST + SHA-256
        ↓
OPTIONAL BLOCKCHAIN ANCHOR
        ↓
ANALYSIS / REPLICATION / QUALIFIED REVIEW
```

Hospital-origin absorbent waste must **not** be assumed to have one uniform classification or risk profile. The hospital, qualified waste/safety professionals and the competent research institution must determine whether a proposed sample can be collected, transported, stored, treated and studied, and under which conditions.

MyZubster participants should not directly retrieve hospital waste or improvise handling, decontamination, storage or transport outside an institutionally approved procedure.

### Research comparison

Where approved, the study may compare:

- **Stage A:** clean/unused or laboratory-defined absorbent materials;
- **Stage B:** an institutionally approved real-world healthcare waste sample.

Potential research outcomes include differences in measured mass balance, recoverable fractions, residuals, variability and process limitations. Any safety, recyclability, environmental or industrial conclusion requires evidence beyond the mass-balance result itself.

### Chain of custody and privacy

For every authorized real-world sample, the protocol should define sample ID, custody transfers, timestamps, responsible roles, storage/transport conditions and permitted evidence. Patient-identifying or unnecessary personal/clinical information must not be placed in the public GitHub/blockchain evidence package.

### Validation boundary

A hospital or university supplying/allowing a sample does **not** by itself endorse MyZubster, certify a recycling process, approve recovered material for reuse, or establish scientific validity. Those conclusions require separate documented evaluation.

**Track status:** `PROPOSED / REQUIRES INSTITUTIONAL APPROVAL BEFORE REAL-WASTE TESTING`.
