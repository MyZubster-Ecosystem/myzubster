# MyZubster 5-minute quickstart — Publish one observation

## Primary use case
**I want to document something I directly observed in my local environment or public space and leave a public, verifiable record that others can review.**

Primary CTA: **Submit an observation**.

Target user: a resident, contributor, developer, researcher, civic observer or community member with a GitHub account and one piece of public evidence.

## Before you start
You need only:

- a GitHub account;
- one thing you directly observed;
- an approximate date and location;
- one public evidence link, or a clear statement explaining what evidence exists and where it can safely be published.

No maintainer credentials, API keys, wallet secrets or local development environment are required.

If this is your first MyZubster action, start a timer before opening the form.

## What counts as success
You have succeeded when a new public GitHub issue exists in `MyZubster-Ecosystem/myzubster` using the **🌍 Submit a MyZubster observation** form and contains:

- category;
- direct observation;
- observation date;
- approximate location;
- at least one public evidence link or a clear statement of evidence awaiting safe publication;
- first-action status;
- approximate completion time;
- the contributor declaration.

The issue URL is the reproducible public evidence of the submission. A maintainer does not need to approve the issue for the submission itself to exist.

## Browser-only path
1. Start a timer.
2. Open `https://github.com/MyZubster-Ecosystem/myzubster/issues/new/choose`.
3. Choose **🌍 Submit a MyZubster observation**.
4. Select a category.
5. Describe only what you directly observed.
6. Add date and approximate location.
7. Add a public photo/source/dataset link, or explain what evidence exists.
8. Keep interpretation separate from observed facts.
9. Mark whether this is your first MyZubster action and select the elapsed-time range.
10. Confirm the contributor declarations and submit.

Target time: **5 minutes**. Maximum acceptable time for Phase 1: **10 minutes**.

## Expected output
After submission, GitHub should display a public issue with a URL shaped like:

`https://github.com/MyZubster-Ecosystem/myzubster/issues/<number>`

The issue body should visibly contain your observation, evidence, approximate location, completion-time range and declarations.

That URL is the first-success artifact for the quickstart.

## Example
Observation: `A public drinking-water point was available and being used during a local public event.`

Location: `Rimini, Emilia-Romagna, Italy`

Evidence: a public repository photo or official source URL.

Interpretation, if any, should be placed in the optional interpretation field and must not be presented as directly observed fact.

## Common failure modes

### I do not have a public photo URL
Do not upload sensitive or private material just to complete the quickstart. In the evidence field, explain what evidence you have and where it could safely be published later.

### I am unsure whether something is fact or interpretation
Put only directly observed details in **What did you observe?**. Put hypotheses, causal explanations or conclusions in the optional interpretation field.

### The exact location is sensitive
Use only a broad area such as city, district or park. Do not publish precise locations for vulnerable people, species or private residences when disclosure could create risk.

### GitHub asks me to sign in
A GitHub account is required for this first public-action flow. Sign in and reopen the issue form; no MyZubster-specific account is required.

### The form takes more than 10 minutes
Still submit if the evidence is safe and valid, select the correct time range, and use **What slowed you down?** to document the friction. Those reports are product evidence for improving onboarding.

## Safety and evidence boundaries
Do not publish credentials, private addresses, unnecessary personal data, or sensitive exact locations when disclosure could create risk. Avoid identifiable faces unless there is a legitimate and appropriate reason to publish them.

A submitted observation does **not** automatically prove:

- environmental impact;
- scientific validity;
- causation;
- partnership or endorsement;
- institutional support;
- commercial adoption;
- deployment of MyZubster infrastructure.

## How this supports adoption metrics
A qualifying issue opened by a non-maintainer can count as one verifiable external MyZubster action for the weekly adoption scorecard. Duplicate, spam, unverifiable, founder-only or purely promotional submissions should not count toward IWAU.

For first-time external users, the `Time to complete this submission` field provides a simple self-reported time-to-first-success measure. Phase 1 aims for a median below 10 minutes and a target experience near 5 minutes.

## Next step after first success
After the issue exists, an external user may optionally improve the evidence by adding a repository photo, structured metadata, code, a test, or a pull request. Those higher-effort actions are classified separately by the Adoption Radar.
