# MZ-AHP-OS-002 — Bench Test Protocol v0.3-draft

Status: `INTERNAL SCREENING METHOD / NOT A CERTIFICATION STANDARD`

This protocol creates reproducible early-stage bench evidence for design iteration. It does not replace applicable standards, accredited laboratory testing, toxicological review, skin-contact assessment, product-safety evaluation or regulatory requirements.

## Common rules

- Test at least 3 specimens per design revision for each quantitative screening method when material is available.
- Record specimen ID, version, material lots, date, operator and equipment.
- Record raw values; a design target is never automatically a pass criterion.
- A simple 0.9% w/v sodium-chloride solution may be used as an **internal screening fluid**. It does not reproduce menstrual fluid and is not a validated clinical/standard test medium.
- Human wear or skin testing is outside this protocol.

## D1 — Dimensions and dry mass

1. Measure overall length, body width, wing span if present and core envelope.
2. Measure pad mass, release-liner mass and wrapper mass separately.
3. Compare the measured system mass with the 9.70 g allocated draft target.
4. Report individual results plus mean/min/max.

No validated production tolerance exists in v0.3.

## A1 — Free absorbency screening

1. Weigh the unwrapped dry pad without release liner (`m0`).
2. Place it flat on a leak-safe horizontal fixture.
3. Apply three 10 mL doses of screening fluid to the center of the absorbent zone, 5 minutes apart.
4. Wait 10 minutes after the final dose.
5. Remove free/unabsorbed liquid without squeezing the core and weigh (`m1`).
6. Record retained mass `m1 - m0` and any visible leakage.

The 30 mL total dose is a **draft comparative stress condition**, not a claim about menstrual capacity or user need.

## A2 — Acquisition-time screening

For each 10 mL dose, record the time until no free liquid is visibly pooled at the dosing point. Keep dose placement and dispensing method constant between revisions.

This is an internal visual endpoint, not a standardized acquisition method.

## R1 — Rewet screening

1. Five minutes after the final A1 dose, place a pre-weighed clean absorbent-paper stack over the loaded area.
2. Apply a flat 1 kg load over a documented contact area for 60 seconds.
3. Reweigh the paper.
4. Record mass gain as `rewet_g`.

Document paper type and contact geometry for reproducibility.

## L1 — Leakage observation

Inspect and photograph:

- backsheet wet-through;
- edge leakage;
- end leakage;
- core displacement;
- delamination;
- wing/adhesive failure if present.

Record each as `NONE / OBSERVED / NOT_ASSESSED`.

## G1 — Garment adhesive screening

1. Apply the pad to a clean, documented fabric coupon using a repeatable pressure/time method.
2. Leave for a documented dwell time.
3. Remove and inspect for pad movement, adhesive transfer, fabric damage and residue.
4. Repeat placement/removal on fresh coupons for up to 3 cycles if the design intends repositioning.

No validated minimum peel/shear force is defined in v0.3.

## W1 — Wing integrity screening

For winged variants:

1. Wrap wings around a standard flat fabric/fixture width.
2. Hold under the same manual/static condition for a documented period.
3. Record tearing, delamination, adhesive failure or permanent deformation.

## S1 — Wet structural integrity

After A1/R1, lift and manipulate the pad using a documented sequence. Record core breakup, bunching, layer separation and shape loss.

## P1 — Wrapper and packaging screening

Record:

- release-liner mass and removal behavior;
- individual-wrapper mass;
- outer-pack mass and unit allocation;
- wrapper opening damage;
- seal/closure observations;
- basic manual handling/drop observations;
- lot/label readability.

## C1 — Circular-route compatibility gate

This gate requires operational evidence. Record only:

- collection route confirmed? `true/false`;
- treatment operator acceptance confirmed? `true/false`;
- treatment evidence reference;
- recovered fractions measured? `true/false`;
- destination evidence available? `true/false`.

If unsupported, circular outcome remains `NOT_VERIFIED`.

## Evidence output

Each run should preserve raw measurements, photos/references, deviations and operator notes. Evidence is linked from `evidence-index.json` only after the artifact exists.

## Claim boundary

Passing this internal protocol does **not** establish menstrual-use safety, dermatological suitability, regulatory compliance, certified absorbency, leak protection, adhesive suitability for clothing, recyclability or environmental benefit.