# MyZubster Google TV

## Debug Build 001

A development/debug APK for Google TV testing is available as a GitHub prerelease.

- Release tag: `google-tv-debug-001`
- Asset: `app-debug.apk`
- Size: 3,518,984 bytes (about 3.35 MiB)
- SHA-256: `f8a6f9c53b0647c282a0c4fcafd969d6885f6b0e59e7723895769afe088fa704`
- Release: https://github.com/MyZubster-Ecosystem/myzubster/releases/tag/google-tv-debug-001
- Direct APK: https://github.com/MyZubster-Ecosystem/myzubster/releases/download/google-tv-debug-001/app-debug.apk

> **Warning:** this is a debug/development build for testing. It is not a production release and should not be presented as a Play Store or production-signed build.

## Verify the download

### Windows PowerShell

```powershell
Get-FileHash .\app-debug.apk -Algorithm SHA256
```

The result must match:

```text
f8a6f9c53b0647c282a0c4fcafd969d6885f6b0e59e7723895769afe088fa704
```

## Install with ADB

ADB installation requires Android/Google TV developer options and debugging to be enabled, and the computer must be authorized by the device.

First verify that the target device is visible:

```bash
adb devices
```

Then install or replace the debug APK:

```bash
adb install -r app-debug.apk
```

For a network-connected TV, connect to the device using the host/port shown by its debugging interface before running the install command. Exact pairing and connection steps can vary by Android/Google TV version.

## Release policy

Keep debug APKs in GitHub prereleases rather than committing compiled APK binaries to the main source tree. A future production build should use an appropriate release signing process, receive installation/testing validation, and be published under a distinct non-debug release tag.
