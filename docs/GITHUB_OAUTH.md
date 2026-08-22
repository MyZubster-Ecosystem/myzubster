# GitHub OAuth for MyZubster identity onboarding

The identity onboarding flow can verify that a GitHub account is controlled by the person creating a MyZubster identity.

## Required environment variables

```bash
GITHUB_OAUTH_CLIENT_ID=...
GITHUB_OAUTH_CLIENT_SECRET=...
GITHUB_OAUTH_CALLBACK_URL=https://YOUR_GATEWAY/api/auth/github/callback
FRONTEND_URL=https://YOUR_FRONTEND
JWT_SECRET=...
# Optional separate signing secret for OAuth state
GITHUB_OAUTH_STATE_SECRET=...
```

If `GITHUB_OAUTH_CALLBACK_URL` is omitted, the gateway derives it from `GATEWAY_PUBLIC_URL`.

## GitHub OAuth App configuration

Create a GitHub OAuth App and configure its Authorization callback URL to exactly match:

```text
https://YOUR_GATEWAY/api/auth/github/callback
```

The flow requests only `read:user user:email`.

## Security model

- The browser is redirected to GitHub for authorization.
- The gateway exchanges the authorization code server-side; the client secret never reaches the browser.
- The GitHub access token is used only to retrieve the authorized profile and verified email and is not persisted by MyZubster.
- The gateway returns a short-lived signed verification ticket (10 minutes), not the GitHub access token.
- Registration can submit that verification ticket. The backend verifies it and persists only GitHub account metadata (`id`, `login`, avatar/profile URLs and verification timestamp).
- OAuth `state` is a short-lived signed JWT to protect the callback flow.

## Endpoints

```text
GET  /api/auth/github/start
GET  /api/auth/github/callback
POST /api/auth/github/verify-ticket
POST /api/auth/register
```

`POST /api/auth/register` optionally accepts `githubVerificationToken` and binds the verified GitHub identity to the new MyZubster account.

## Product behavior

Users can still analyze any public GitHub profile without OAuth. That path is explicitly shown as unverified. The verified OAuth path receives a `GitHub verified` badge in the identity preview and is persisted to the user record after account creation.
