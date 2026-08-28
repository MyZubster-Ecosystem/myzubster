# Zorgax verified social login

MyZubster supports account creation/login through verified OAuth identities and creates or links the user's persistent Metaverse character.

## Active provider adapters

- Google (`openid email profile`)
- GitHub (`read:user user:email`)
- Facebook (`public_profile,email`)

A public social profile URL alone is **not** identity verification. Only a completed OAuth flow is recorded as a verified identity provider.

## Flow

1. User opens `/social-login.html` and chooses Google, GitHub or Facebook.
2. Browser is sent to `/api/auth/social/:provider/start`.
3. Provider authenticates the user and redirects to `/api/auth/social/:provider/callback`.
4. Backend verifies signed OAuth state and obtains the provider identity directly from the provider.
5. Existing account is linked by provider ID or email; otherwise Zorgax creates a MyZubster account. New account creation requires an email returned by the provider.
6. A persistent `MetaverseCharacter` is created/linked with `identityStatus=account-linked` and the verified provider recorded in `identityProviders`.
7. Browser receives a short-lived login ticket. `/social-login.html` exchanges it at `/api/auth/social/exchange-ticket`, stores the normal MyZubster JWT and continues to onboarding.

## Required deployment secrets

Google: `GOOGLE_LOGIN_CLIENT_ID`, `GOOGLE_LOGIN_CLIENT_SECRET`, optional `GOOGLE_LOGIN_CALLBACK_URL`.

GitHub: `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET`, optional `GITHUB_LOGIN_CALLBACK_URL`.

Facebook: `FACEBOOK_LOGIN_APP_ID`, `FACEBOOK_LOGIN_APP_SECRET`, optional `FACEBOOK_LOGIN_CALLBACK_URL`.

Common: `JWT_SECRET`, optional `OAUTH_STATE_SECRET`, `GATEWAY_PUBLIC_URL`, `FRONTEND_URL`.

Provider secrets and access tokens must never be persisted in the public profile or Metaverse character.

## Instagram and X

They are intentionally not shown as active login buttons in this release. They must use the same verified-provider contract, but should only be enabled after their provider-specific OAuth application, scopes, callbacks and account-creation requirements are configured and tested. Do not treat a public Instagram/X profile as proof of identity.
