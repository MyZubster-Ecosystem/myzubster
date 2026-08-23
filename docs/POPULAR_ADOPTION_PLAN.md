# MyZubster — Popular Adoption Plan

## Objective
Move MyZubster from a founder-led ecosystem into a product that is independently used, tested, integrated and discussed by people who are not part of the core maintainer circle.

## Primary public use case
**Publish one local observation with public evidence.**

User problem: **I want to document something I directly observed in my local environment or public space and leave a public, verifiable record that others can review.**

Primary CTA: **Submit an observation**.

Target user: resident, contributor, developer, researcher, civic observer or community member with a GitHub account and one piece of public evidence.

First-success path: `docs/QUICKSTART_OBSERVATION.md` → GitHub issue form `🌍 Submit a MyZubster observation`.

Success evidence: a public observation issue containing category, direct observation, date, approximate location, evidence and contributor declarations. Maintainer approval is not required for the submission itself to exist.

## North-star metric
**Independent Weekly Active Users (IWAU):** unique external users who complete at least one verifiable MyZubster action in a 7-day period (for example: submit a qualifying observation, call a documented API successfully, contribute a validated asset, run a reproducible demo, or integrate a MyZubster component).

Do not count maintainer-only activity, stars, passive page views, unchanged forks, indexation, spam, duplicates or unverifiable claims as adoption.

## Adoption ladder
1. DISCOVERY — someone finds the project.
2. INTEREST — star/watch/comment without concrete use.
3. FORK — fork exists but no meaningful independent modification.
4. CONTRIBUTION — external code/content/test contribution.
5. INTEGRATION — third-party project imports or integrates a MyZubster component.
6. DEPLOYMENT — independent reproducible deployment or live use.
7. VERIFIED_ADOPTION — repeated independent use with public evidence.

## Phase 1 — Make the first useful action obvious
Target: 0–30 days.

- One public landing path with one primary CTA: **Submit an observation**.
- One 5-minute quickstart for a real action.
- One public demo that works without maintainer intervention.
- One copy-paste API example with expected output.
- One contribution path for non-developers and one for developers.
- `/fumetto` remains the storytelling entry point, but each chapter must lead to a concrete action or evidence source.

### Exit criteria
- 10 independent successful quickstart completions.
- 5 external issue reports, test reports or contributions.
- Median time-to-first-success < 10 minutes for the primary flow.

## Phase 2 — Turn users into repeat users
Target: 30–90 days.

- Add lightweight identity/provenance for external users.
- Publish examples created by independent users.
- Add a public `SHOWCASE.md` for real integrations and demos.
- Add reproducible starter kits for Gateway/API, observations and visual contributions.
- Track weekly return usage without counting maintainer activity.

### Exit criteria
- 25 IWAU.
- 10 external contributors with at least 2 returning contributors.
- 3 independent integrations or deployments.

## Phase 3 — Build network effects
Target: 3–6 months.

- Make third-party integrations easier than internal customization.
- Publish stable schemas and versioned API examples.
- Encourage external communities to create their own MyZubster use cases while preserving evidence boundaries.
- Create a public adoption dashboard sourced only from verifiable evidence.

### Exit criteria
- 100 IWAU.
- 20+ substantive external contributors.
- 5+ independent integrations.
- 3+ independently maintained demos or deployments.

## Phase 4 — Popularity threshold
Target: 6–18 months, evidence dependent.

Treat MyZubster as "taking root" only when independent activity continues without founder prompting.

Suggested threshold:
- 100+ recurring independent users;
- 20–50 substantive external contributors;
- 5–10 independent integrations;
- at least 3 third-party projects that depend on or actively use MyZubster components;
- organic mentions and technical references that can be verified publicly.

## Product priorities
1. **Primary use case:** publish one verifiable local observation.
2. **Quickstart:** first success in minutes, not hours.
3. **Evidence:** every adoption claim links to public proof.
4. **Reliability:** public endpoint/deployment status must be reproducible.
5. **Contributor UX:** external users must know exactly what to do next.
6. **Storytelling:** Comic Universe explains the ecosystem but never substitutes for working product evidence.

## Weekly scorecard
Publish only metrics that can be independently checked where practical:

- IWAU
- new external contributors
- returning external contributors
- external PRs merged
- independent integrations
- independent deployments
- reproducible demos
- external technical issues opened
- qualifying observation submissions
- successful quickstart runs
- median time-to-first-success

## Evidence boundary
Do not infer partnership, endorsement, commercial adoption, payment, market value, institutional support, environmental impact, scientific validation or production deployment unless explicit evidence supports the claim.

## Immediate backlog
- [x] Define one primary public use case and CTA: **Submit an observation**.
- [x] Create the first 5-minute quickstart and observation issue form. External timing validation is still required before #626 can be considered complete.
- [ ] Create a reproducible public demo.
- [ ] Add `SHOWCASE.md` for independent integrations and deployments.
- [ ] Add a weekly adoption scorecard template.
- [ ] Fix reliable production deployment flow before promoting `/fumetto` as current production evidence.
- [ ] Connect Comic Universe chapters to real actions, not only narrative pages.
