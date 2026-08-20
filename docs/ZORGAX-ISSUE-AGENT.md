# Zorgax GitHub Issue Agent

Zorgax can act as a **proposal agent** for GitHub Issues in the MyZubster ecosystem.

Zorgax is a virtual/fictional AI persona. An Issue created through this capability is automated content and **must not be treated as a human decision, scientific conclusion, partnership approval, contract, endorsement, or institutional position**.

## Endpoints

### `GET /api/zorgax/issues/status`

Shows whether write access is enabled and which repositories are allowed.

### `POST /api/zorgax/issues/propose`

Builds a sanitized Issue draft but does not publish it.

### `POST /api/zorgax/issues/publish`

Publishes the same structured proposal to GitHub, but only when all write guardrails are satisfied.

## Required configuration for writes

```bash
ZORGAX_GITHUB_WRITE_ENABLED=true
ZORGAX_GITHUB_ALLOWED_REPOS=MyZubster-Ecosystem/myzubster
ZORGAX_GITHUB_TOKEN=<server-side GitHub token or GitHub App installation token>
ZORGAX_ADMIN_KEY=<long random server-side approval key>
```

The caller must also provide:

```text
x-zorgax-admin-key: <matching approval key>
```

Writes are disabled by default.

## Production GitHub App

Use a dedicated **GitHub App** so Issues are visibly authored by an automation identity rather than a maintainer account.

The exact production setup is documented in [`docs/ZORGAX-GITHUB-APP-SETUP.md`](ZORGAX-GITHUB-APP-SETUP.md), and a safe runtime-variable template is available in [`.env.zorgax.example`](../.env.zorgax.example).

Recommended permissions are intentionally minimal:

- **Issues: Read and write**
- **Metadata: Read-only**

Do not grant repository administration, Contents, Pull requests, Secrets, Actions write access, organization administration, or other permissions that the Issue Agent does not need.

## Guardrails

1. Repository allowlist: Zorgax may only write to explicitly allowed repositories.
2. Feature flag: GitHub writes are disabled unless `ZORGAX_GITHUB_WRITE_ENABLED=true`.
3. Human authorization gate: publication requires a separate server-side admin key.
4. Server-side credential: the GitHub token is never accepted from the browser/request body.
5. Secret screening: drafts that appear to contain credentials/private keys are rejected.
6. Disclosure: every Issue clearly states that Zorgax is a virtual/fictional AI persona.
7. Claim classes: evidence can be `verified`, `uncertain`, `speculative`, or `fictional`.
8. Human decision authority: Zorgax can propose; maintainers decide priority, acceptance, closure, implementation, partnerships and commitments.

## Intended uses

Good candidates for Zorgax Issues include:

- CI/test failures that need investigation;
- environmental/data anomalies with provenance;
- missing documentation;
- possible bugs;
- narrowly scoped improvements;
- technical debt;
- observations that require human verification.

Zorgax should not autonomously use this capability to:

- accept or announce partnerships;
- commit money or budgets;
- speak on behalf of LIFE consortium members;
- claim scientific verification not present in the evidence;
- expose private/sensitive data;
- merge code or approve its own proposals.

## Operating model

```text
event / observation
       ↓
Zorgax analysis
       ↓
structured Issue proposal
       ↓
secret + repository + claim checks
       ↓
human authorization gate
       ↓
GitHub Issue
       ↓
maintainer review
       ↓
optional human-approved PR / action
```
