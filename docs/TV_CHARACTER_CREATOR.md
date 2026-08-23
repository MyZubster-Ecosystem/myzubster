# MyZubster TV Character Creator

`public/tv-character.html` is a remote-first character creation surface designed for the MyZubster Google TV / Android TV wrapper.

## Flow

1. Open MyZubster TV.
2. Choose **Crea personaggio**.
3. Enter a character name.
4. Select an archetype, role and guiding value with the D-pad.
5. Save the draft on the current TV.
6. Optionally continue to Zorgax with the selected character context in the URL query.

## Current persistence boundary

The character draft is stored in the browser/WebView `localStorage` under:

```text
myzubster.tv.character.v1
```

This is intentionally local-only. It does not currently write to the authenticated MyZubster user profile or MongoDB.

A later runtime slice can synchronize an approved character schema to the authenticated account. Until that exists, the UI explicitly states that account/cloud sync is not active.

## NFT boundary

Creating a TV character is an application-level action. It does not mint an NFT and it does not prove identity or ownership.

Any future mint flow must remain separate and require the wallet-verification and NFT-receipt verification gates before a minted asset is recorded as verified.

## TV interaction

- focusable controls are navigable with arrow keys / D-pad;
- Enter/select activates focused buttons and links;
- the name input may use the platform on-screen keyboard;
- the character preview updates immediately;
- Android Back remains handled by the WebView wrapper.

## QA still required

Physical Google TV / Android TV validation is required for D-pad behavior, on-screen keyboard behavior, focus visibility, readability at TV distance, local persistence across app restarts and the handoff to Zorgax.
