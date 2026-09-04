# MZ-AHP-OS-001 — Bench Test Protocol v0.3-draft

Status: `INTERNAL SCREENING METHOD / NOT A CERTIFICATION STANDARD`

This protocol creates reproducible early-stage bench evidence for design iteration. It does not replace applicable standards, accredited laboratory testing, toxicological review, product-safety assessment or regulatory requirements.

## Common rules

- Test at least 3 specimens per design revision for each quantitative screening method when material is available.
- Record specimen ID, design version, material lots, date, operator and equipment.
- Record raw values; never enter a pass merely because a target exists in the design.
- Unless otherwise stated, condition specimens in a stable indoor environment before testing and record temperature/humidity if measured.
- A simple 0.9% w/v sodium-chloride solution may be used as an **internal screening fluid**. It is not a validated substitute for urine in certification testing.
- Human wear testing is outside this protocol.

## D1 — Dimensions and dry mass

1. Measure overall length, rear/front panel width, crotch width and core envelope.
2. Measure finished dry specimen mass.
3. Record deviation from the drawing and from the 36.0 g allocated draft target.
4. Report mean, minimum, maximum and individual values.

No tolerance is considered validated in v0.3.

## A1 — Free absorbency screening

Purpose: compare design revisions under one repeatable internal method.

1. Weigh the dry specimen (`m0`).
2. Place the specimen flat in a leak-safe tray.
3. Apply three 75 mL doses of screening fluid to the core centerline, 5 minutes apart.
4. Wait 10 minutes after the final dose.
5. Remove free/unabsorbed liquid without squeezing the absorbent core and weigh the specimen (`m1`).
6. Record retained mass `m1 - m0` and any visible leakage.

The 225 mL total load is a **draft screening condition**, not a performance claim or infant-use requirement.

## A2 — Acquisition-time screening

For the same three 75 mL doses, time from dose application until no free liquid is visibly pooled on the topsheet at the dosing point. Record each acquisition time separately.

This is an internal visual endpoint and is not a standardized acquisition method.

## R1 — Rewet screening

1. Five minutes after the final A1 dose, place a pre-weighed stack of clean absorbent paper over the central loaded area.
2. Apply a flat 2 kg load over the test area for 60 seconds.
3. Reweigh the paper stack.
4. Record mass gain as `rewet_g`.

Document paper type, contact area and load geometry so future runs use the same setup.

## L1 — Leakage observation

After A1/R1, inspect and photograph:

- backsheet wet-through;
- side leakage;
- end leakage;
- adhesive/lamination failure;
- core displacement.

Record each as `NONE / OBSERVED / NOT_ASSESSED`; this is not a certified leakage rating.

## F1 — Fastening integrity screening

1. Close each fastening tab on the intended landing zone using a repeatable overlap mark.
2. Open/reclose for 5 cycles.
3. Record tearing, delamination, hook/loop failure or loss of attachment.
4. If force equipment is available, record measured peel/shear data separately with equipment details.

No validated minimum force is defined in v0.3.

## S1 — Wet structural integrity

After fluid screening, lift and manipulate the specimen using a documented sequence. Record core breakup, migration, layer separation and elastic/fastener failure. Photographs are required for any observed failure.

## P1 — Packaging screening

For prototype packs record:

- package mass and unit count;
- mass allocation per unit;
- seal/closure observations;
- handling damage after a documented manual drop/transport simulation;
- label/lot readability.

## C1 — Circular-route compatibility gate

This gate cannot be passed by bench design alone. Record only:

- collection route confirmed? `true/false`;
- treatment operator acceptance confirmed? `true/false`;
- treatment evidence reference;
- recovered fractions measured? `true/false`;
- destination evidence available? `true/false`.

If any field is unsupported, circular outcome remains `NOT_VERIFIED`.

## Evidence output

Each run should produce a machine-readable or tabular record containing raw measurements, photos/references, deviations and operator notes. Results belong in `evidence-index.json` only after the evidence artifact exists.

## Claim boundary

Passing this internal screening protocol does **not** establish infant safety, dermatological suitability, regulatory compliance, certified absorbency, leak protection, recyclability or environmental benefit.