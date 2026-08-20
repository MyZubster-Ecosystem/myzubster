# Zorgax GitHub App setup

This document defines the production identity and least-privilege configuration for Zorgax when opening GitHub Issues.

## Recommended app identity

- App name: `MyZubster Zorgax`
- Suggested bot identity after installation: `myzubster-zorgax[bot]` or the GitHub-generated bot login associated with the App
- Homepage: `https://github.com/MyZubster-Ecosystem/myzubster`
- Installation target: `MyZubster-Ecosystem`
- Repository access: **Only selected repositories**
- Initial repository: `MyZubster-Ecosystem/myzubster`

## Repository permissions

Grant only:

- **Metadata: Read-only**
- **Issues: Read and write**

Do not grant Contents, Pull requests, Administration, Secrets, Actions or Members permissions for the first production version.

## Webhooks

Webhooks are not required for the first Issue Agent release. Leave them disabled unless a later version needs event-driven replies or triage.

## Required server configuration

Do not commit real values.

```bash
ZORGAX_GITHUB_WRITE_ENABLED=true
ZORGAX_GITHUB_ALLOWED_REPOS=MyZubster-Ecosystem/myzubster
ZORGAX_GITHUB_TOKEN=<installation-token-or-server-generated-token>
ZORGAX_ADMIN_KEY=<long-random-admin-authorization-key>
```

`ZORGAX_ADMIN_KEY` is an independent authorization boundary for the MyZubster publish endpoint and is not the GitHub credential.

## Preferred production authentication

For production, prefer GitHub App installation-token authentication rather than a long-lived personal access token.

A production deployment should store:

```bash
ZORGAX_GITHUB_APP_ID=<github-app-id>
ZORGAX_GITHUB_INSTALLATION_ID=<installation-id>
ZORGAX_GITHUB_PRIVATE_KEY=<secret-manager-reference-or-runtime-secret>
```

The private key must live in the deployment secret manager, never in Git, Drive, Slack, logs, Issue bodies or character memory.

The current Issue Agent accepts `ZORGAX_GITHUB_TOKEN`. A follow-up implementation can mint short-lived installation tokens from the App ID + installation ID + private key at runtime and pass that token internally to the publishing client.

## Human authority boundary

The GitHub App may:

- propose a structured Issue;
- publish an Issue when the server-side feature flag, allowlist and admin authorization all pass;
- identify itself clearly as Zorgax automation;
- attach evidence with explicit claim classes.

The GitHub App must not autonomously:

- approve partnerships or institutional commitments;
- approve budgets or contracts;
- claim scientific validation;
- merge Pull Requests;
- change repository settings;
- access secrets;
- treat its own Issue as evidence that a decision was accepted.

## Registration step that requires a GitHub owner/admin

GitHub requires an authenticated human owner/admin to register the App and approve its installation on the organization. This cannot be completed by repository code alone.

When registering the App in GitHub settings, use the values above, install it only on `MyZubster-Ecosystem/myzubster`, generate a private key, and place the resulting App/installation credentials only in the deployment secret manager.

## Verification checklist

After installation:

1. `GET /api/zorgax/issues/status` reports write capability enabled and only the expected repository in the allowlist.
2. `POST /api/zorgax/issues/propose` returns a draft without publishing.
3. A publish request without the admin key is rejected.
4. A publish request to a non-allowlisted repository is rejected.
5. A valid authorized publish creates an Issue whose author is the GitHub App bot identity.
6. The Issue title begins with `[ZORGAX]` and the body discloses automation and human-review requirements.
7. No GitHub credential or admin key appears in application logs.
