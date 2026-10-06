# WASIM avatar activation

This integration makes the original Wasim SVG selectable by its owner in Neon
Plaza. It does not approve the Knowledge Node or self-described capabilities in
the character proposal, which remains under review in PR #637.

## Participant flow

After deployment:

1. Open https://myzubster.com/social-login and sign in with the original
   GitHub account `wasim-builds` (GitHub user ID `108329802`).
2. Open https://myzubster.com/metaverse.
3. Choose **Usa WASIM**, then **Entra con il tuo account**.
4. Check that WASIM and the original avatar appear in Neon Plaza. Reload and
   re-enter to confirm the selection persists.

The account-link flow creates the persistent account character. Selection
updates that existing character, preserving its MYZ-ID, archetype, identity
providers and mission progress. No manual production database script is needed.
Selection applies to the next world entry; leave an existing session first.

## Identity and review

The authenticated endpoint `POST /api/metaverse/character` accepts only a curated
character key, and checks the stored GitHub login **and immutable user ID**.
Guests and other contributors cannot select WASIM. Browser-supplied names,
image URLs, visual keys and GitHub claims do not grant ownership.

The avatar is served from `/images/characters/wasim.svg` in both public asset
roots. It is unchanged from the SVG submitted in PR #637 at commit
`3de8e2b1505a9a3d45a4c9e0f1a9a17f9d13ca26`.

Runtime responses retain `characterReviewStatus: proposed` and link to PR #637.
The verified badge denotes account linkage. It does not verify character roles,
contribution claims, Knowledge Network nodes, a Passport, or NFT rights.
The requested comic is optional and is not an activation prerequisite.

## Extending the pilot

Add each participant's consented visual to the curated contributor character
registry, binding it to their original GitHub user ID and login. The same
selection endpoint and rendering path can then serve that contributor.
This pilot does not implement arbitrary uploads or a general avatar marketplace.

## Validation

`node --test tests/metaverseContributorCharacters.node.cjs` exercises ownership,
opt-in, profile/join/shared-presence/featured responses, mission preservation,
and rejection of guest and other-account impersonation using isolated storage.
Production deployment and Wasim's personal sign-in remain required for the
actual participant test; code tests alone do not establish a live activation.
