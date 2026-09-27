# MyZubster — Public Connected Journey

This page connects the currently evidenced MyZubster journey from community discovery to Marketplace exchange, payment boundaries, kefir handover evidence, public knowledge, mentorship, research and visual storytelling.

## One connected flow

```text
PERSON / COMMUNITY NEED
        ↓
MYZUBSTER + ZORGAX
        ↓
MARKETPLACE OFFER / REQUEST
        ↓
FREE EXCHANGE ───────────────┐
        │                    │
        └── or PAYMENT ──────┤
             provider check  │
             MYZ accounting  │
                             ↓
                     REAL-WORLD HANDOVER
                             ↓
                    RECEIVED → RECORDED
                             ↓
                  CANONICAL SHA-256 RECORD
                             ↓
                 OPTIONAL ON-CHAIN ANCHOR
                             ↓
                    INDEPENDENT VERIFIER
                             ↓
                    KNOWLEDGE / FEEDBACK
                             ↓
                 LEARN / MENTOR / REPRODUCE
                             ↓
                 RESEARCH / INDEPENDENT REVIEW
                             ↓
                       SHARE AGAIN
```

The knowledge loop is `SHARE → TRY → OBSERVE → IMPROVE → SHARE AGAIN`. A documented lesson can therefore become the starting point for another person's pilot, with Zorgax assisting the learning path while keeping human work and AI assistance distinguishable.

## Marketplace and payments

The Marketplace connects offers and requests for skills, local resources, community services and pilot exchanges. A `FREE` exchange bypasses payment; paid flows are a separate evidence layer. MYZ is an internal utility/accounting credit and must not be presented as proof of external crypto settlement. Payment evidence proves payment state only; it does not prove delivery, learning, safety or successful service fulfillment.

- Production: https://www.myzubster.com/
- Marketplace: https://www.myzubster.com/community-marketplace.html
- Marketplace repository: https://github.com/DanielIoni-creator/MyZubster-Marketplace
- Core implementation: https://github.com/MyZubster-Ecosystem/myzubster

## Nicola kefir pilot — real recorded handover + public commitment

The Nicola/N4K48 kefir pilot is the first concrete bridge between a Marketplace handover and the MyZubster Knowledge Protocol.

![Daniel H4X0R and Nicola n4k48 — kefir exchange](https://raw.githubusercontent.com/MyZubster-Ecosystem/MyZubster-Visual/main/visuals/knowledge-pilots/MyZubster%20-%20Daniel%20H4X0R%20scambio%20Kefir%20con%20Nicola%20n4k48%20-%20Cyberpunk.jpg)

![Daniel H4X0R and Nicola n4k48 — Knowledge to MYZ](https://raw.githubusercontent.com/MyZubster-Ecosystem/MyZubster-Visual/main/visuals/knowledge-pilots/MyZubster%20-%20Daniel%20H4X0R%20Nicola%20n4k48%20-%20Knowledge%20to%20MYZ%20Cyberpunk.png)

**Public KF-006 evidence page:** https://www.myzubster.com/knowledge-kf-006.html

Application evidence:

- Listing: `6aa9ee1b821964be0b43ff6e`
- Handover: `6aab8faca70ce84f926d0b41`
- Method: `HAND_DELIVERY`
- Payment required: `false`
- State: `RECORDED`
- `handedOverAt`: `2026-09-17T07:28:24.874Z`
- `receivedAt`: `2026-09-17T07:45:03.261Z`
- `recordedAt`: `2026-09-17T07:46:09.606Z`

Blockchain commitment evidence:

- Schema: `myzubster.marketplace-handover.v1`
- SHA-256: `ba9973f08ce86d16a3611c3cccbb9cc2cc779b9ea1cb6fd87a2e5864e557b6b9`
- Network: Base Sepolia
- Chain ID: `84532`
- Transaction: `0x998a98b1733312e248f74a1387319dae30aab8123a6115c517e4ffe0ef9584bf`
- Block: `46933575`
- Confirmed: `2026-09-17T08:57:18.000Z`
- Explorer: https://sepolia.basescan.org/tx/0x998a98b1733312e248f74a1387319dae30aab8123a6115c517e4ffe0ef9584bf

The independent verifier in the core repository reproduced the exact v1 commitment from the handover record and matched it against transaction calldata `MZ-HANDOVER-V1:<hash>` with `VERIFY_EXIT=0`.

Important boundary: the blockchain proves integrity/timestamp evidence for the commitment. It does **not** independently prove the physical event, participant identity, food safety, microbiology, health effects, successful fermentation, learning or scientific validity. The visual artwork is explanatory and is not part of that proof.

- Kefir repository: https://github.com/DanielIoni-creator/Myzubster-fermentation-kefir
- KF-006 evidence: https://github.com/DanielIoni-creator/Myzubster-fermentation-kefir/blob/main/knowledge/KF-006-NICOLA-PILOT.md
- Nicola profile: https://github.com/DanielIoni-creator/Nicola
- Verifier source: https://github.com/MyZubster-Ecosystem/myzubster/blob/main/scripts/verify-handover-commitment.js

## Public Knowledge Explorer

The kefir repository is also the first concrete dataset for the broader MyZubster Knowledge Protocol. Evidence classes remain distinct: `PERSONAL_PRACTICE`, `TRADITIONAL_PRACTICE`, `OBSERVATION`, `EXTERNAL_SOURCE`, `VERIFIED_GUIDANCE`. Community repetition never silently upgrades a claim to verified guidance.

Knowledge can now also be connected to a **learning/mentorship pathway**: someone documents what they actually learned while building or testing MyZubster, another participant tries to reproduce or extend it, and Zorgax assists explanation, decomposition and documentation. The resulting interaction becomes new evidence and feedback rather than automatic proof of mastery.

**Learn / transmit with Zorgax:** https://github.com/MyZubster-Ecosystem/myzubster/blob/main/docs/KNOWLEDGE-MENTORSHIP-PILOTS.md

Existing pilot nodes include Nicola and Yassen as separate cases. A Bologna sound-system pathway is documented as `PLANNED` only until participants, consent, scope and evidence exist; it can later use the `SOUNDSYSTEM → SND-###` namespace.

![Sound System Knowledge — planned pathway](https://raw.githubusercontent.com/MyZubster-Ecosystem/MyZubster-Visual/main/visuals/knowledge-pilots/MyZubster%20-%20Sound%20System%20Knowledge%20-%20Cyberpunk%20Community.jpg)

The Sound System image is a `PLANNED` pathway visual, not evidence of an active partnership, participant consent, completed learning, competence or safety validation.

### Future-dated Kefir & Knowledge visual

![Kefir & Knowledge Pilot — 22 September](https://raw.githubusercontent.com/MyZubster-Ecosystem/MyZubster-Visual/main/visuals/knowledge-pilots/MyZubster%20-%20Kefir%20%26%20Knowledge%20Pilot%20-%2022%20settembre.png)

`PLANNED / FUTURE-DATED VISUAL` — the image references 22 September 2026, which is later than this 17 September documentation update. It does not establish that a 22 September activity has already happened.

- KF-006 public evidence page: https://www.myzubster.com/knowledge-kf-006.html
- Knowledge Explorer: https://myzubster-knowledge.vercel.app/knowledge.html
- Read-only summary API: https://myzubster-knowledge.vercel.app/api/knowledge?action=summary
- Knowledge Protocol: https://github.com/DanielIoni-creator/Myzubster-fermentation-kefir/blob/main/MYZUBSTER-KNOWLEDGE-PROTOCOL.md
- Mentorship & Pilot Pathway: https://github.com/MyZubster-Ecosystem/myzubster/blob/main/docs/KNOWLEDGE-MENTORSHIP-PILOTS.md
- Nicola: https://github.com/DanielIoni-creator/Nicola
- Yassen: https://github.com/DanielIoni-creator/Yassen

## University and reproducible research

Research is a separate layer: `Question → protocol → consent/evidence plan → GitHub work → Zorgax support → measurements → review/reproduction → conclusions with limitations`.

- KF-006 public evidence page: https://www.myzubster.com/knowledge-kf-006.html
- University & Research: https://github.com/DanielIoni-creator/myzubster-university-research
- Research Lab: https://github.com/DanielIoni-creator/Myzubster-research-lab
- Student Profiles: https://github.com/DanielIoni-creator/Myzubster-student-profile
- Developer Support: https://github.com/DanielIoni-creator/Myzubster-developer-support
- Knowledge Mentorship: https://github.com/MyZubster-Ecosystem/myzubster/blob/main/docs/KNOWLEDGE-MENTORSHIP-PILOTS.md

No README, visual, issue or pilot record by itself establishes a formal university partnership, scientific validation, funding or institutional endorsement.

## Circular evidence — Denmark concept visual

![Circular Evidence Denmark Pilot](https://raw.githubusercontent.com/MyZubster-Ecosystem/MyZubster-Visual/main/visuals/knowledge-pilots/MyZubster_Circular_Evidence_Denmark_Pilot.png)

`CONCEPT / PILOT VISUAL` — this visual illustrates a possible Denmark circular-evidence pathway. It does not by itself establish a Denmark pilot, partnership, participant activity or verified outcome.

## Visual and comic layer

The Comic Universe is the narrative navigation layer around the evidence system. Visuals explain how components connect; they are not evidence that an event, payment, partnership or scientific result occurred.

- Connected visual evidence journey: https://github.com/MyZubster-Ecosystem/MyZubster-Visual/blob/main/docs/CONNECTED-EVIDENCE-JOURNEY.md
- KF-006 public evidence page: https://www.myzubster.com/knowledge-kf-006.html
- Interactive comic: https://www.myzubster.com/fumetto
- Visual repository: https://github.com/MyZubster-Ecosystem/MyZubster-Visual
- Nicola: https://github.com/DanielIoni-creator/Nicola
- Kefir: https://github.com/DanielIoni-creator/Myzubster-fermentation-kefir
- Marketplace: https://github.com/DanielIoni-creator/MyZubster-Marketplace
- University & Research: https://github.com/DanielIoni-creator/myzubster-university-research

## Evidence rule

MyZubster deliberately keeps these layers separate:

`VISUAL ≠ LISTING ≠ PAYMENT ≠ HANDOVER ≠ RECEIPT ≠ RECORDED APP STATE ≠ ON-CHAIN COMMITMENT ≠ KNOWLEDGE RECORD ≠ LEARNING INTERACTION ≠ DEMONSTRATED COMPETENCE ≠ KNOWLEDGE VALIDATION ≠ SCIENTIFIC VALIDATION`.

They can be connected by identifiers and provenance, but one state never silently proves the next.


## 🎨 Recent visual archive — 21–27 Sep 2026

The latest visual assets found in the project Drive archive are catalogued here so the documentation and MyZubster narrative stay synchronized. The binary originals remain in the Drive archive; until a public GitHub mirror is available, the links below point to the source files.

| Date | Visual | Topic | Source |
|---|---|---|---|
| 24 Sep 2026 | `MyZubster-ecosistema-facebook.png` | Facebook / community entry point | [Drive source](https://drive.google.com/file/d/1Pp-ZG7f-WRBPO5hgNBEs0rd3aHzO7_Fp/view?usp=drivesdk) |
| 27 Sep 2026 | `MyZubster_Sepolia_ETH_E2E_Payment_Flow.png` | Base Sepolia / ETH E2E payment-flow visual | [Drive source](https://drive.google.com/file/d/1573x9yWlbFS9u3EmKacpQf6EwZchQyE7/view?usp=drivesdk) |
| 21 Sep 2026 | `MyZubster_University_Living_Lab_LIFE_Visual.png` | University / Living Lab / LIFE | [Drive source](https://drive.google.com/file/d/1nC1qYon10ia6H8KoE32kyA1efMtm0FIy/view?usp=drivesdk) |
| 21 Sep 2026 | `MyZubster_Nicola_Software_Cyberpunk.png` | Nicola / software / technical narrative | [Drive source](https://drive.google.com/file/d/1QpTKRkPAXUqekf_I4C09zI0vJ54KFFM4/view?usp=drivesdk) |
| 21 Sep 2026 | `MyZubster_Story_Kefir_Zorgax_Google_GitHub_Tor_Metaverso.png` | Kefir → Zorgax → Google/GitHub/Tor/Metaverse story | [Drive source](https://drive.google.com/file/d/1bl1kd44CWUHwqgeVNdpSg-dlYxl9l3hH/view?usp=drivesdk) |
| 26 Sep 2026 | `Come funziona MyZubster per i donatori di kefir.png` | Kefir donor workflow | [Drive source](https://drive.google.com/file/d/139JyeGqKpQforoyK9nReFIyxl7U_TV9w/view?usp=drivesdk) |
| 26 Sep 2026 | `Donatore di Kefir a Rimini e Riccione.png` | Local kefir donor / Rimini / Riccione | [Drive source](https://drive.google.com/file/d/1uY6PbLv-TxL5buXaTccEJMzrLoquRjzu/view?usp=drivesdk) |

**Publication boundary:** these are visual communication assets. A visual does not by itself prove a completed pilot, partnership, payment, authorization, identity, adoption or scientific result; those claims remain tied to their corresponding evidence and status documentation.

**Public mirror TODO:** copy the binary originals into the appropriate GitHub visual repository before using raw.githubusercontent.com image URLs in public pages.

## 🖼️ Interactive visual gallery

The latest visual set is mirrored in the main MyZubster repository. **Click a thumbnail to open the full-resolution asset.**

<a href="https://raw.githubusercontent.com/MyZubster-Ecosystem/myzubster/feat/nft-system-mvp-2026-08-22/docs/visuals/2026-09-27/Come%20funziona%20MyZubster%20per%20i%20donatori%20di%20kefir.png"><img src="https://raw.githubusercontent.com/MyZubster-Ecosystem/myzubster/feat/nft-system-mvp-2026-08-22/docs/visuals/2026-09-27/Come%20funziona%20MyZubster%20per%20i%20donatori%20di%20kefir.png" alt="Kefir donor workflow" width="420"></a>
<a href="https://raw.githubusercontent.com/MyZubster-Ecosystem/myzubster/feat/nft-system-mvp-2026-08-22/docs/visuals/2026-09-27/Donatore%20di%20Kefir%20a%20Rimini%20e%20Riccione.png"><img src="https://raw.githubusercontent.com/MyZubster-Ecosystem/myzubster/feat/nft-system-mvp-2026-08-22/docs/visuals/2026-09-27/Donatore%20di%20Kefir%20a%20Rimini%20e%20Riccione.png" alt="Kefir donor / Rimini / Riccione" width="420"></a>
<a href="https://raw.githubusercontent.com/MyZubster-Ecosystem/myzubster/feat/nft-system-mvp-2026-08-22/docs/visuals/2026-09-27/MyZubster-ecosistema-facebook.jpg"><img src="https://raw.githubusercontent.com/MyZubster-Ecosystem/myzubster/feat/nft-system-mvp-2026-08-22/docs/visuals/2026-09-27/MyZubster-ecosistema-facebook.jpg" alt="Facebook / community" width="420"></a>
<a href="https://raw.githubusercontent.com/MyZubster-Ecosystem/myzubster/feat/nft-system-mvp-2026-08-22/docs/visuals/2026-09-27/MyZubster_Nicola_Software_Cyberpunk%281%29.png"><img src="https://raw.githubusercontent.com/MyZubster-Ecosystem/myzubster/feat/nft-system-mvp-2026-08-22/docs/visuals/2026-09-27/MyZubster_Nicola_Software_Cyberpunk%281%29.png" alt="Nicola / software / Knowledge" width="420"></a>
<a href="https://raw.githubusercontent.com/MyZubster-Ecosystem/myzubster/feat/nft-system-mvp-2026-08-22/docs/visuals/2026-09-27/MyZubster_Sepolia_ETH_E2E_Payment_Flow.png"><img src="https://raw.githubusercontent.com/MyZubster-Ecosystem/myzubster/feat/nft-system-mvp-2026-08-22/docs/visuals/2026-09-27/MyZubster_Sepolia_ETH_E2E_Payment_Flow.png" alt="Base Sepolia / ETH E2E payment flow" width="420"></a>
<a href="https://raw.githubusercontent.com/MyZubster-Ecosystem/myzubster/feat/nft-system-mvp-2026-08-22/docs/visuals/2026-09-27/MyZubster_Story_Kefir_Zorgax_Google_GitHub_Tor_Metaverso%281%29.png"><img src="https://raw.githubusercontent.com/MyZubster-Ecosystem/myzubster/feat/nft-system-mvp-2026-08-22/docs/visuals/2026-09-27/MyZubster_Story_Kefir_Zorgax_Google_GitHub_Tor_Metaverso%281%29.png" alt="Kefir → Zorgax → Google/GitHub/Tor/Metaverse" width="420"></a>
<a href="https://raw.githubusercontent.com/MyZubster-Ecosystem/myzubster/feat/nft-system-mvp-2026-08-22/docs/visuals/2026-09-27/MyZubster_University_Living_Lab_LIFE_Visual%281%29.png"><img src="https://raw.githubusercontent.com/MyZubster-Ecosystem/myzubster/feat/nft-system-mvp-2026-08-22/docs/visuals/2026-09-27/MyZubster_University_Living_Lab_LIFE_Visual%281%29.png" alt="University / Living Lab / LIFE" width="420"></a>

> **Evidence boundary:** these are documentation and narrative visuals. They do not independently establish a partnership, scientific validation, production deployment, payment, identity or completed pilot.

Source collection: [docs/visuals/2026-09-27](https://github.com/MyZubster-Ecosystem/myzubster/tree/feat/nft-system-mvp-2026-08-22/docs/visuals/2026-09-27).
