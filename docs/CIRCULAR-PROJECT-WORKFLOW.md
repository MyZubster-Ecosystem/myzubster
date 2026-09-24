# MyZubster Circular Project Workflow

This reusable workflow lets a garden, water-reuse pilot, kefir project, compost system, repair/reuse activity, circular-care experiment, community event or other circular-economy project use the same evidence-first structure.

## Core flow

1. **Capture** — the user provides text, measurements, documents or photos.
2. **Review with Zorgax** — Zorgax describes what is visible or stated, separates observations from assumptions, and flags privacy risks.
3. **Structure** — Zorgax prepares a project README, media index and optional community-help issues.
4. **Human approval** — nothing is published to GitHub or MyZubster until the user explicitly approves the proposed destination and content.
5. **Publish** — approved material can be committed to the selected GitHub repository and linked back to the MyZubster profile/project.
6. **Community contribution** — questions become issues or contribution requests so relevant communities can help.
7. **Metaverse/Comics link** — the MyZubster project can expose a public-safe link for a character, place or project card in the Metaverse/Comics layer.

## Common project fields

- **Project name**
- **Project type** — garden/permaculture, water, fermentation/kefir, compost, repair/reuse, circular care, materials, event, agriculture, other
- **Location** — use an approximate/public-safe location unless exact coordinates are intentionally public
- **Objective**
- **Materials/resources involved**
- **Current state**
- **Photos/media**
- **Problem or question**
- **Interventions/actions**
- **Measurements/results**
- **Evidence/source**
- **Help wanted from the community**
- **Next experiment**
- **GitHub repository**
- **MyZubster profile/project link**
- **Metaverse/Comics link**

## Photo review rules

Before proposing a GitHub commit, Zorgax should:

- describe only what can reasonably be observed;
- avoid claiming a plant disease, species, chemical condition or technical cause as certain from a photo alone;
- flag visible people, faces, vehicle plates, street numbers, addresses, private documents, precise coordinates or other sensitive details;
- offer a public-safe caption and filename;
- ask for explicit approval before publishing the image;
- preserve the original privately when the public version needs cropping/redaction, when supported.

Suggested repository layout:

```text
project-name/
├── README.md
├── media/
│   ├── README.md
│   └── YYYY-MM-DD-short-description.jpg
├── evidence/
│   └── observations.md
├── experiments/
│   └── YYYY-MM-DD-experiment.md
└── community/
    └── help-wanted.md
```

## README template

```md
# <Project name>

## Objective
<What this project is trying to improve, reuse, regenerate or learn>

## Context
- Type:
- Approximate location:
- Started:
- Maintainer(s):

## Resources / materials
- ...

## Current state
<Observed state. Keep observations separate from interpretations.>

## Photos
| Date | Image | Observation | Public-safe? |
|---|---|---|---|
| YYYY-MM-DD | media/example.jpg | ... | yes/no |

## Problems / questions
- ...

## Interventions
- ...

## Measurements and results
- ...

## Evidence
- ...

## Help wanted
- [ ] Advice
- [ ] Data review
- [ ] Field experience
- [ ] Code / automation
- [ ] Research reference
- [ ] Local collaboration

## Next experiment
<small, testable next step>

## Links
- MyZubster:
- GitHub:
- Metaverse/Comics:
```

## Community issue template

```md
# Help wanted: <short question>

## Project
<link or name>

## What I observe
<facts only>

## What I already tried
- ...

## Photos/evidence
- ...

## What help I need
<specific question>

## Privacy
I reviewed the attached material and intentionally approved the public information included here.
```

## Evidence principle

GitHub history can provide a useful public audit trail for project documentation and contributions, but a commit by itself does not prove that a scientific, environmental or social claim is correct. Measurements, methods and external validation should be recorded separately when needed.
