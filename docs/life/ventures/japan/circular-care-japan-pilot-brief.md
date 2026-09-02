# MyZubster Circular Care — Japan Pilot Integration Brief

Status: **CANDIDATE_PILOT_TRACK**  
Registry: `MZ-AHP-JP-001`  
Parent venture: `MZ-VENTURE-AHP-001`

This brief connects publicly evidenced Japanese AHP initiatives to the MyZubster Circular Care evidence model. It does **not** claim that Unicharm, Kao, Daio Paper, any municipality, school, facility or other organisation has agreed to participate in MyZubster.

## Track JAPAN-AHP-01 — Used diaper circularity

### Unicharm / RefF

Public program evidence supports horizontal recycling of used disposable diapers using recovered pulp, super-absorbent polymer and plastics as relevant material-flow categories.

Candidate MyZubster evidence flow:

`collection site -> traceable batch -> mass at collection -> treatment/recovery event -> recovered fraction -> destination/use -> verification -> report`

Candidate KPIs:

- kg collected;
- kg accepted/rejected;
- recovery yield by material fraction;
- secondary-material destination completeness;
- evidence completeness;
- verified mass-balance closure;
- processing cost per kg when authorized commercial data exists.

### Kao / Kamikatsu and Saijo

Kao publicly documents verification testing for used disposable diaper carbonization in Saijo and Kamikatsu. The MyZubster role would be evidence capture around collection, input mass, processing events, semi-carbonized output, intended destination/use and baseline methodology.

No CO2 benefit is to be reproduced or claimed by MyZubster unless the baseline, method and underlying measurements are explicitly authorized and independently reviewable.

## Track JAPAN-AHP-02 — Menstrual product access + circularity extension

### Unicharm / School Sofy

School Sofy provides a useful candidate infrastructure layer because physical dispensers, sites, sealed products and lot identifiers create a bounded distribution flow. MyZubster could extend that flow with post-consumer collection design only after site/operator authorization.

Candidate evidence flow:

`product lot -> site/dispenser -> replenishment -> distribution/usage proxy -> collection boundary -> treatment route -> evidence report`

### Kao / School Laurier

School/Workplace Laurier provides another candidate site network for distribution and replenishment evidence. Circular recovery must remain a separate future module unless a real collection/treatment route is confirmed.

### Daio Paper / Elis Scholarship Napkin

The scholarship program is relevant as a distribution/equity reference. It is not currently treated as a recycling pilot. MyZubster could measure product provenance and program delivery, with any circularity layer added only through a separately authorized post-consumer pilot.

## MyZubster integration contract

For every Japanese candidate, MyZubster stores these concepts separately:

- `publicCapabilityEvidence` — public evidence that a program exists;
- `relationshipState` — whether the organisation has explicitly engaged with MyZubster;
- `pilotScopeState` — whether site, data boundary and measurement scope are agreed;
- `materialFlowEvidence` — authorized event-level evidence;
- `verificationState` — `PENDING`, `VERIFIED`, or `REJECTED`;
- `commercialState` — quotations/contracts/revenue only when separately evidenced.

## Activation gate

A candidate may move toward `PILOT_SCOPE_IN_DEFINITION` only when at least one real organisation or site explicitly engages and the following are bounded:

1. contact/interest evidence;
2. named site or operating context;
3. authorized data boundary;
4. baseline and KPI definitions;
5. product/material-flow schema;
6. evidence-sharing permission;
7. privacy/legal review appropriate to Japan;
8. human verification before environmental claims.

Until then all records remain **candidate references**, not partners or confirmed pilots.
