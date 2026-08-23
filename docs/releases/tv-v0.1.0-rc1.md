# MyZubster TV v0.1.0-rc1

Status: **PRE-RELEASE CANDIDATE / DEBUG / DEVICE QA REQUIRED**

This candidate packages the first MyZubster Android TV / Google TV scaffold and the clarity-first TV surface.

## Included

- `public/tv.html` — large-screen, D-pad/arrow-friendly MyZubster TV surface.
- `android-tv/` — Android TV app scaffold (`org.myzubster.tv`).
- `LEANBACK_LAUNCHER` support.
- HTTPS WebView loading of the TV surface.
- Back-button handling.
- No camera, microphone, location or storage permissions added.
- GitHub Actions build workflow for the debug APK.

## Verified build provenance

Source branch: `zorgax/google-tv-dashboard-001`

Source commit: `3c7236c7475ce27adeddd720add2d3e029df4fc4`

GitHub Actions:

- Security Audit #702: success
- CI – Test e Lint #762: success
- Android TV Build #2: success

Artifact:

- name: `myzubster-tv-debug-apk`
- GitHub Actions artifact ID: `9491225103`
- artifact size: `3,228,293 bytes`
- SHA-256: `ff782915f1cfeb79300136819971db071cb99957f454220b10ef49bc57b80bad`
- GitHub-reported expiry: `2026-11-21`

Archive copy:

- Google Drive: `MYZUBSTER-TV-DEBUG-APK-001.zip`
- canonical folder: `MyZubster Zorgax Chronicle`

## Release boundary

This candidate proves that the debug APK builds successfully. It does **not** yet prove real-device Google TV compatibility and is not a Play Store release.

Before promotion beyond RC/debug status, complete a real-device pass verifying:

- APK installation on an actual Android TV / Google TV device;
- D-pad focus/navigation;
- Enter/select behavior;
- Chronicle and Chronicle Universe loading;
- Back-button behavior;
- TV-distance readability;
- no crash during basic navigation.

`BUILD SUCCESS != DEVICE COMPATIBILITY != PLAY STORE RELEASE`

## Suggested GitHub Release metadata

Tag: `tv-v0.1.0-rc1`

Title: `MyZubster TV v0.1.0-rc1`

Release type: **Pre-release**

Recommended asset: the APK (or the workflow ZIP containing the APK) generated from Android TV Build #2.

Do not mark this as stable until the real-device QA gate is complete.