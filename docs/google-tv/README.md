# MyZubster for Google TV

This guide documents the current MyZubster Google TV test build and how to install and validate it on Android TV / Google TV hardware.

## Status

The available package is **Debug Build 001** and is intended for development/device testing only.

- Release tag: `google-tv-debug-001`
- APK: `app-debug.apk`
- Size: 3,518,984 bytes (about 3.35 MiB)
- SHA-256: `f8a6f9c53b0647c282a0c4fcafd969d6885f6b0e59e7723895769afe088fa704`
- Release: https://github.com/MyZubster-Ecosystem/myzubster/releases/tag/google-tv-debug-001
- Direct APK: https://github.com/MyZubster-Ecosystem/myzubster/releases/download/google-tv-debug-001/app-debug.apk

> This is a debug/development APK. It is not a Play Store release and is not a production-signed build.

## 1. Download and verify

Download `app-debug.apk` from the prerelease, then verify it before installation.

```powershell
Get-FileHash .\app-debug.apk -Algorithm SHA256
```

Expected digest:

```text
f8a6f9c53b0647c282a0c4fcafd969d6885f6b0e59e7723895769afe088fa704
```

If the digest does not match, do not install that copy.

## 2. Prepare the TV

Menu names vary by device/version, but the general process is:

1. Open **Settings**.
2. Enable **Developer options**.
3. Enable USB or wireless/network debugging.
4. For wireless ADB, keep TV and PC on the same trusted network.
5. Accept the computer authorization prompt on the TV.

Disable debugging after testing if it is no longer needed.

## 3. Install Android Platform Tools

ADB is included in Android Platform Tools. Verify it is available:

```powershell
adb version
```

## 4. Connect the TV

Check local/USB devices:

```powershell
adb devices
```

For wireless debugging, use the IP address and port displayed by the TV. Some Android versions require a pairing step first.

```powershell
adb connect TV_IP:PORT
adb devices
```

Do not assume port `5555`; use the port shown by the device.

## 5. Install MyZubster

From the directory containing the APK:

```powershell
adb install -r .\app-debug.apk
```

For a first installation, `adb install .\app-debug.apk` is also valid.

## 6. Device QA checklist

A successful build or install does not prove full Google TV compatibility. Record at minimum:

- TV/device model and Android/Google TV version;
- APK tag and SHA-256;
- installation result;
- app visibility in the TV launcher;
- D-pad focus and navigation;
- WebView/page loading;
- Chronicle and ecosystem links;
- Back-button behavior;
- readable layout at TV distance;
- network/API behavior;
- crashes or visible errors.

Sanitize screenshots and logs before publishing them.

## Troubleshooting

### `adb` is not recognized

Install Android Platform Tools and ensure the directory containing `adb.exe` is in PATH, or run it from its actual directory.

### Device is `unauthorized`

Accept the debugging authorization prompt on the TV. If necessary, revoke old debugging authorizations and reconnect.

### Device is not listed

Check debugging settings, IP/port, pairing state, local firewall rules and that TV/PC are on the expected network.

### `INSTALL_FAILED_UPDATE_INCOMPATIBLE`

An existing copy may have been signed with a different key. Do not uninstall until you know whether local application data must be preserved.

### App installs but does not appear in the TV launcher

Treat this as a product test result. Verify TV launcher declarations and manifest configuration rather than assuming the device is faulty.

## Security

Never publish or commit private keys, wallet seed phrases, API secrets, authentication tokens, debugging credentials, or unnecessary private network/device information.

## Release policy

Compiled APKs should remain in GitHub Releases/prereleases rather than the source tree. A production Google TV release should have:

1. a non-debug build;
2. intentional release signing;
3. real-device QA;
4. TV navigation/layout validation;
5. documented version/build identifiers;
6. a published checksum;
7. release notes and known limitations;
8. a distinct production release tag.

Until those gates are met, `google-tv-debug-001` remains a testing artifact.

See also [`../GOOGLE_TV.md`](../GOOGLE_TV.md).
