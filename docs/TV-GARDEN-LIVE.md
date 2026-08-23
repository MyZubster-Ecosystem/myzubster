# My Garden Live — MyZubster TV

Status: **experimental / in review**.

This slice adds a TV-first viewer for an authorized garden camera stream using an HTTPS HLS (`.m3u8`) URL.

## Included

- `/tv-garden-live` TV surface;
- D-pad/remote focus navigation;
- HLS URL validation (`https://` + `.m3u8`);
- play/pause, mute and disconnect controls;
- no local persistence of the stream URL;
- explicit warning not to enter usernames, passwords, permanent tokens or other credentials.

## Deliberate security boundary

The current garden model/routes do not yet provide a verified authenticated ownership boundary suitable for storing camera credentials or issuing stream access to a specific account. This PR therefore does **not**:

- store camera URLs or secrets in `Garden`;
- accept RTSP credentials;
- put credentials in source code, environment files or query strings;
- claim account-to-garden ownership enforcement;
- proxy or transcode camera traffic;
- expose a public camera directory.

## Production integration gate

A later backend slice should add an authenticated flow such as:

```text
signed-in user
  -> owned garden
  -> authorized camera record
  -> short-lived HLS playback URL
  -> MyZubster TV player
```

The backend must derive ownership from the authenticated user context rather than trusting `ownerId` supplied by the client. Camera secrets should remain server-side and only a short-lived playback URL should reach the TV.

## QA gate

Before this can be called TV-compatible, verify on a real Google TV / Android TV device:

1. `/tv` opens and the `ORTO LIVE` action is reachable by D-pad;
2. the on-screen keyboard can enter an authorized HLS HTTPS URL;
3. focus remains visible for input and all controls;
4. playback starts, pauses and resumes;
5. reconnect/buffering/error states are readable at TV distance;
6. Back navigation returns to TV home;
7. the test URL contains no reusable credentials;
8. closing/reopening the page does not restore the previous stream URL.

A successful browser or CI check does not substitute for physical-device playback testing.
