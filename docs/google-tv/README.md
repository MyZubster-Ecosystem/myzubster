# MyZubster for Google TV

This directory documents the current MyZubster Google TV test build and how to install it safely on a compatible Android TV / Google TV device.

## Current status

The available package is **Debug Build 001**. It is intended for development and device testing only.

- Release tag: `google-tv-debug-001`
- Release title: `MyZubster Google TV — Debug Build 001`
- APK asset: `app-debug.apk`
- APK size: 3,518,984 bytes (about 3.35 MiB)
- SHA-256: `f8a6f9c53b0647c282a0c4fcafd969d6885f6b0e59e7723895769afe088fa704`
- Release page: https://github.com/MyZubster-Ecosystem/myzubster/releases/tag/google-tv-debug-001
- Direct APK download: https://github.com/MyZubster-Ecosystem/myzubster/releases/download/google-tv-debug-001/app-debug.apk

> **Important:** this is a debug/development APK. It is not a Play Store release, not a production-signed build, and should not be presented as a final production version.

## What this package is for

Use this APK to:

- test MyZubster on Google TV / Android TV hardware;
- validate navigation and TV interaction;
- verify rendering on large-screen devices;
- collect installation and runtime feedback before a production release.

Do not use this build as evidence that a production Google TV app has been released.

## 1. Download the APK

Download `app-debug.apk` from the GitHub prerelease:

https://github.com/MyZubster-Ecosystem/myzubster/releases/tag/google-tv-debug-001

For direct download:

https://github.com/MyZubster-Ecosystem/myzubster/releases/download/google-tv-debug-001/app-debug.apk

## 2. Verify the APK checksum

Before installing, verify the SHA-256 digest.

### Windows PowerShell

```powershell
Get-FileHash .\app-debug.apk -Algorithm SHA256
```

Expected SHA-256:

```text
f8a6f9c53b0647c282a0c4fcafd969d6885f6b0e59e7723895769afe088fa704
```

If the hash does not match, do not install that copy of the APK. Download it again from the GitHub Release.

## 3. Prepare Google TV / Android TV

The exact menu names vary by device and Android/Google TV version, but the general process is:

1. Open **Settings** on the TV.
2. Open the device/system information page.
3. Enable **Developer options** if they are not already available.
4. Enable the relevant **USB debugging** or **wireless/network debugging** option.
5. Keep the TV and computer on the same network when using wireless ADB.
6. Accept the computer authorization prompt on the TV when it appears.

Only enable debugging on devices you control and disable it again when testing is complete if you do not need it.

## 4. Install ADB on the computer

ADB is provided by Android Platform Tools.

After installing Platform Tools, verify that `adb` is available:

```powershell
adb version
```

## 5. Connect to the TV

### USB-connected device

Check whether ADB sees the device:

```powershell
adb devices
```

### Network-connected device

Use the IP address and port shown by the TV debugging interface. Depending on the Android version, the device may require wireless pairing before a normal ADB connection.

Typical connection command after pairing/authorization:

```powershell
adb connect TV_IP:PORT
```

Example only:

```powershell
adb connect 192.168.1.50:5555
```

Do not assume `5555` is correct for every device. Use the port shown by the TV.

Verify the connection:

```powershell
adb devices
```

The TV should appear as an authorized device.

## 6. Install MyZubster

From the directory containing `app-debug.apk`:

```powershell
adb install -r .\app-debug.apk
```

`-r` allows ADB to replace an existing compatible installation while preserving app data when Android permits it.

For a first installation, this also works:

```powershell
adb install .\app-debug.apk
```

## 7. Updating the debug build

When a newer compatible debug APK is published, download it, verify its SHA-256 value from the release documentation, then run:

```powershell
adb install -r .\NEW-BUILD.apk
```

Each future APK should have its own documented checksum and release tag.

## 8. Removing the app

The package identifier is not documented in this release guide yet, so this README does not guess it.

To identify installed packages before uninstalling, you can inspect the device with ADB, then uninstall only the confirmed MyZubster package identifier.

Do not run an uninstall command using an assumed package name.

## Troubleshooting

### `adb` is not recognized

Install Android Platform Tools and make sure the folder containing `adb.exe` is available in your terminal PATH, or run `adb.exe` from its actual directory.

### Device shows `unauthorized`

Look at the TV screen and accept the debugging authorization prompt. If necessary, revoke previous debugging authorizations on the TV and reconnect.

### Device is not listed

Check:

- debugging is enabled;
- TV and PC are on the same network for wireless ADB;
- the correct IP address and port are being used;
- firewall/network rules are not blocking the connection;
- wireless pairing was completed when required by the Android version.

### `INSTALL_FAILED_UPDATE_INCOMPATIBLE`

This can occur when an already-installed application was signed with a different signing key. Do not remove an existing installation until you understand whether local app data needs to be preserved.

### Installation succeeds but the app does not appear in the TV launcher

A successful APK installation does not automatically prove that the application declares all launcher/TV-specific manifest requirements. Treat this as a test result to investigate in the Android TV project rather than as proof of a device problem.

## Testing checklist

After installation, record at minimum:

- TV/device model;
- Android/Google TV version;
- APK release tag;
- APK SHA-256;
- installation success/failure;
- whether MyZubster appears in the TV launcher;
- remote/D-pad navigation behavior;
- screen scaling and readability;
- network/API behavior;
- crashes or visible errors;
- screenshots or logs that contain no secrets or unnecessary personal information.

## Security and privacy

Never publish or commit:

- private keys;
- wallet seed phrases;
- API secrets;
- authentication tokens;
- personal debugging credentials;
- sensitive device/network information that is not required for a public issue.

Sanitize logs before attaching them to GitHub issues.

## Release policy

Compiled APK files should normally remain attached to **GitHub Releases / prereleases** rather than being committed directly into the source tree.

A production Google TV release should have, at minimum:

1. a non-debug build;
2. an intentional release-signing process;
3. device installation testing;
4. TV navigation and layout validation;
5. documented version/build identifiers;
6. a published SHA-256 digest;
7. release notes describing known limitations;
8. a distinct production release tag.

Until those conditions are met, `google-tv-debug-001` remains a development/testing artifact.

## Related documentation

See also:

- [`../GOOGLE_TV.md`](../GOOGLE_TV.md) — concise release and ADB reference.
- GitHub prerelease: https://github.com/MyZubster-Ecosystem/myzubster/releases/tag/google-tv-debug-001
