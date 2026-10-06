# MyZubster Knowledge Mentorship & Pilot Pathway

MyZubster can preserve not only knowledge about things, but also knowledge about **how people learn to build, test, document and help others**.

The practical loop is:

```text
BUILD / TRY
    ↓
LEARN
    ↓
DOCUMENT WHAT ACTUALLY HAPPENED
    ↓
SHARE WITH ANOTHER PERSON OR GROUP
    ↓
ZORGAX ASSISTS THE LEARNING PATH
    ↓
THE PARTICIPANT TRIES / BUILDS / OBSERVES
    ↓
EVIDENCE + FEEDBACK
    ↓
IMPROVE THE KNOWLEDGE
    ↓
HELP THE NEXT PILOT
```

This extends the MyZubster loop `SHARE → TRY → OBSERVE → IMPROVE → SHARE AGAIN` to human learning and mentorship.

## What can be transmitted

Examples include lessons learned while building MyZubster, open-source development practices, using GitHub, structuring a project, working with Zorgax, documenting evidence, reproducing a workflow, contributing improvements, and teaching the resulting practice to another participant.

Knowledge should be split into traceable records rather than presented as automatically verified truth. Useful evidence types remain `PERSONAL_PRACTICE`, `TRADITIONAL_PRACTICE`, `OBSERVATION`, `EXTERNAL_SOURCE` and `VERIFIED_GUIDANCE`. Mentorship or repetition by multiple people does not automatically promote a statement to `VERIFIED_GUIDANCE`.

## Roles

**Mentor / contributor** — shares a documented practice or lesson learned.

**Participant** — tries the practice, asks questions, builds or reproduces something, and can contribute observations back.

**Zorgax** — assists with explanation, decomposition, documentation, missing-information checks and navigation through the MyZubster ecosystem. AI assistance must remain distinguishable from work performed by the person.

**Reviewer / researcher** — where appropriate, evaluates evidence, methodology, reproducibility and limitations independently from the learning interaction.

## Pilot cases

### Nicola

Nicola is an existing public pilot node connected to MyZubster/Zorgax, the KF-006 kefir evidence path and University & Research. The documented evidence should distinguish what Nicola did, what Zorgax assisted with, what was recorded digitally and what has or has not received independent/scientific review.

- https://github.com/DanielIoni-creator/Nicola
- https://www.myzubster.com/knowledge-kf-006.html

### Yassen

Yassen is an existing participant/profile node that can be used to document a separate learning and assistance pathway. Results must be attributed to the specific case and must not be generalized without evidence.

- https://github.com/DanielIoni-creator/Yassen

### Bologna sound-system participants — planned pilot

A future sound-system learning pilot can document how participants learn, reproduce and improve relevant technical/open-source practices with MyZubster and Zorgax. Until participants, consent, scope and evidence exist, this remains **PLANNED** and must not be presented as an active partnership, completed pilot or verified outcome.

The sound-system pathway can use the `SOUNDSYSTEM → SND-###` Knowledge Protocol namespace while keeping appropriate electrical, hearing, structural and event-safety boundaries.

## Suggested learning record

A pilot learning record can contain:

```json
{
  "schema": "myzubster.learning-pilot.v1",
  "pilotId": "LRN-###",
  "participant": "public identifier or consented profile",
  "topic": "what is being learned",
  "mentorContribution": "documented contribution",
  "zorgaxAssistance": "documented AI assistance",
  "participantWork": "work actually performed by the participant",
  "evidence": [],
  "observations": [],
  "reviewState": "UNREVIEWED",
  "limitations": []
}
```

`UNKNOWN` should be preserved whenever a fact is missing. Do not invent outcomes, skills gained, participation, consent, measurements or external validation.

## Connected knowledge network

This mentorship path connects to the existing public evidence journey:

**Community → Zorgax → Marketplace/project → activity → evidence → Knowledge Protocol → mentorship/reproduction → research/review → improved knowledge → share again.**

Canonical journey: https://github.com/MyZubster-Ecosystem/myzubster/blob/main/docs/MYZUBSTER-PUBLIC-JOURNEY.md

Machine-readable ecosystem map: https://github.com/MyZubster-Ecosystem/myzubster/blob/main/ecosystem.json

University & Research: https://github.com/DanielIoni-creator/myzubster-university-research

Knowledge/Kefir pilot: https://github.com/DanielIoni-creator/Myzubster-fermentation-kefir

## Evidence boundary

A successful mentoring interaction is evidence that an interaction occurred only to the extent documented. It does not by itself prove mastery, competence, employability, health outcomes, safety, scientific validity or institutional endorsement. Those require evidence appropriate to the claim.

## Contributor Pilot Nodes

Small verified contributions can become the entry point to an independent contributor pilot. The canonical pathway, reward states, opt-in rules and machine-readable schema are documented in:

- `docs/CONTRIBUTOR-PILOT-NODES.md`
- `docs/schemas/contributor-pilot-node.v1.schema.json`

A completed bounty does not automatically create a node. The contributor must opt in, and only documented evidence may be attached to the resulting passport/pilot.
