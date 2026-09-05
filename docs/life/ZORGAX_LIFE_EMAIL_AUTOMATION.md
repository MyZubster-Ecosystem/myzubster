# Zorgax + LIFE email automation

This module lets verified MyZubster users voluntarily receive assistance by email from Zorgax, including LIFE 2027 updates.

## Consent model

Email assistance is disabled by default. A signed-in user must explicitly enable it and select one or more topics:

- `zorgax`
- `github`
- `life`
- `marketplace`
- `contributors`

The preferred destination is the verified GitHub email when available, then verified Google email, then the normal account email. Public GitHub addresses are never scraped or bulk-contacted.

Every message includes an unsubscribe link. Disabling email assistance also marks pending deliveries as skipped.

## Abuse controls

- maximum four sent messages per user in a rolling 30-day window;
- duplicate template/topic messages are suppressed for seven days;
- preference mutations are rate-limited;
- LIFE broadcasts require an authenticated `admin` or `moderator`;
- delivery is audited with `QUEUED`, `SENT`, `SKIPPED`, or `FAILED` state.

## LIFE flow

When a user opts into the `life` topic, Zorgax queues a LIFE 2027 welcome message. Authorized operators can create a LIFE update through `POST /api/zorgax/email/life/update`; only users who explicitly opted into LIFE receive it.

The queue worker runs daily through Vercel Cron at 08:00 UTC and requires `CRON_SECRET`.

## Participant profile automation playbook

The broadcast/delivery module above is separate from the event-driven participant profile workflow. To reproduce the bounded ChatGPT, Gmail and GitHub process piloted with Nicola, use [`participant-automation/README.md`](./participant-automation/README.md) and its templates.

That playbook requires participant-specific consent, an exact sender filter, data minimisation, anonymous evidence, branch and pull request delivery, and human review. It belongs to an internal MyZubster/Zorgax digital pilot and must not be represented as an approved or funded EU LIFE project.

## Deployment variables

Sending stays disabled until all SMTP settings exist:

- `ZORGAX_SMTP_HOST`
- `ZORGAX_SMTP_PORT` (default `587`)
- `ZORGAX_SMTP_USER`
- `ZORGAX_SMTP_PASS`
- `ZORGAX_EMAIL_FROM`
- `CRON_SECRET`
- `JWT_SECRET`

No SMTP credentials belong in the public repository.

## Boundaries

Zorgax email assistance must not treat interest as a partnership, job, contract, funded project, medical relationship, or payment commitment. LIFE Health or other sensitive personal/health information must never be broadcast through the general LIFE mailing topic.

