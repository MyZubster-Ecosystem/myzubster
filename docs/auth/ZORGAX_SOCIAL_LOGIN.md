# Zorgax verified social login

MyZubster supports account creation/login through verified OAuth identities and creates or links the user's persistent Metaverse character.

## Providers

- Google (`openid email profile`)
- GitHub (`read:user user:email`)

A public social profile URL alone is **not** identity verification. Only a completed OAuth flow is recorded as a verified identity provider.

## Flow

1. Frontend sends the browser to `/api/auth/social/google/start` or `/api/auth/social/github/start`.
2. Provider authenticates the user and redirects to MyZubster callback.
3. Backend verifies OAuth state and obtains provider identity directly from Google/GitHub.
4. Existing account is linked by provider ID or verified email; otherwise Zorgax creates a MyZubster account.
5. A persistent `MetaverseCharacter` is created/linked with `identityStatus=account-linked` and the verified provider recorded.
6. Browser receives a short-lived one-time-style login ticket in the onboarding redirect. Frontend exchanges it at `/api/auth/social/exchange-ticket` for the normal MyZubster JWT.

## Required deployment secrets

Google: `GOOGLE_LOGIN_CLIENT_ID`, `GOOGLE_LOGIN_CLIENT_SECRET`, optional `GOOGLE_LOGIN_CALLBACK_URL`.

GitHub: `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET`, optional `GITHUB_LOGIN_CALLBACK_URL`.

Common: `JWT_SECRET`, optional `OAUTH_STATE_SECRET`, `GATEWAY_PUBLIC_URL`, `FRONTEND_URL`.

Provider secrets and access tokens must never be persisted in the public profile or Metaverse character.

## Future social providers

Instagram/Facebook, Apple and other providers should use the same verified-provider contract, but must not be presented as active until their OAuth app credentials, callback and provider-specific verification are implemented and tested.
