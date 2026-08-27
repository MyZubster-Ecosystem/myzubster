# MyZubster LIFE — Community activity categories

## Status and purpose

**COMMUNITY PARTICIPATION TAXONOMY / PREPARATORY / NOT AN OFFICIAL EU LIFE CATEGORY LIST**

This document extends the MyZubster LIFE-aligned participation model with community activities already compatible with the wider MyZubster ecosystem: music, sport, creative practice, education, volunteering, culture, inclusion and citizen science.

These tracks support engagement, communication, dissemination, skills, inclusion and territorial participation. They do **not** become eligible LIFE actions merely because they are listed here. A LIFE-aligned activity needs a documented connection to an environmental objective, an appropriate work package or pilot, measurable outputs and the required project approval.

## Categories

| ID | Category | LIFE-aligned use |
|---|---|---|
| music-performing-arts | Music & performing arts | Public engagement, environmental storytelling, community events and place activation |
| sport-movement-outdoor | Sport, movement & outdoor | Active mobility, nature access, inclusive outdoor participation and territorial observation |
| visual-arts-making | Visual arts & creativity | Environmental communication, reuse-oriented making and public interpretation |
| education-workshops | Education & workshops | Environmental literacy, digital skills, schools, training and replication |
| volunteering-community-care | Volunteering & community care | Authorised stewardship, maintenance, inclusion and collective action |
| culture-territory-traditions | Culture, territory & traditions | Local knowledge, heritage, sustainable place identity and intergenerational exchange |
| wellbeing-inclusion | Wellbeing & inclusion | Accessible participation, social cohesion and safe community involvement |
| citizen-science-environment | Citizen science & environment | Biodiversity, water, waste, climate and other protocol-based observations |

## Evidence contract

Every proposed activity should have one public GitHub issue or pull request containing:

1. category ID and short title;
2. environmental, territorial or participation objective;
3. responsible maintainer or explicitly opted-in contributor;
4. place, period and authorisation status;
5. expected public output or deliverable;
6. measurable indicator, even when simple and aggregate;
7. evidence links and validation state;
8. privacy, consent, safeguarding, copyright and licensing notes where applicable.

Recommended lifecycle:

~~~text
IDEA
→ PUBLIC ISSUE
→ SCOPE + SAFETY REVIEW
→ PLANNED ACTIVITY
→ AUTHORISED EXECUTION
→ EVIDENCE / DELIVERABLE
→ REVIEW
→ VERIFIED CONTRIBUTION
~~~

## Minimum evidence by category

- **Music / performing arts:** programme, location/date, authorised media, rights information and documented outcome.
- **Sport / outdoor:** route or activity plan, safety/accessibility boundary, aggregate participation and observable result.
- **Visual arts / creativity:** licensed deliverable, provenance, materials/process notes and objective link.
- **Education / workshops:** learning objective, reusable material, aggregate participation and feedback.
- **Volunteering / community care:** authorised scope, safety roles, before/after or equivalent evidence and validation.
- **Culture / territory:** sources, local context, permissions and public output.
- **Wellbeing / inclusion:** accessibility and safeguarding design, data minimisation and aggregate feedback.
- **Citizen science / environment:** protocol, authorised dataset, provenance, quality status and reviewer.

## Privacy and safety boundary

Do not publish participant lists, precise sensitive locations, health information, minors' identities, private correspondence, biometric data or unlicensed media. Use aggregate participation counts and privacy-preserving evidence. Real-world activities require the relevant permissions, safety controls and responsible adults or organisations where applicable.

## Claim boundary

Use exact status language:

- **proposed** — an issue exists;
- **planned** — scope and responsible roles are documented;
- **performed** — execution evidence exists;
- **verified contribution** — evidence has been reviewed;
- **authorised pilot activity** — the competent pilot authority approved it.

None of these statuses alone proves LIFE funding, EU/CINEA endorsement, employment, payment, partnership or consortium membership.

## Implementation

The canonical frontend taxonomy lives in frontend/src/data/lifeCommunityActivities.js.

The public portal renders these categories in the LIFE view and routes new proposals to GitHub. Changes to the taxonomy must update the frontend data, its tests and this document together.
