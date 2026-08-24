# MyZubster Android TV / Google TV app

This directory contains the native Android TV launcher wrapper for the MyZubster TV surface.

## Architecture

- Native `LEANBACK_LAUNCHER` entry point.
- Landscape fullscreen activity.
- Android `WebView` loads `https://www.myzubster.com/tv.html` over HTTPS.
- The TV web surface handles arrow/D-pad focus; Android Back navigates WebView history before exiting.
- The app requests Internet access only; it does not request camera, microphone, storage or location permissions.

## Build

Use JDK 17 and Gradle 8.9:

```bash
gradle :app:assembleDebug
```

Run that command from `android-tv/`.

Expected package: `org.myzubster.tv`.

The debug APK is produced at:

```text
app/build/outputs/apk/debug/app-debug.apk
```

## CI

`.github/workflows/android-tv.yml` builds the debug APK for pull requests that touch this module and uploads it as a short-lived workflow artifact.

## Verification boundary

A successful build proves only that the Android project compiles. It does **not** prove physical Google TV / Android TV compatibility, Play Store acceptance, release signing or production readiness.

Before promotion, test on a real TV device: launcher visibility, D-pad navigation, Enter/select, Back behavior, WebView/network behavior, TV-distance readability, launch/resume and crash-free basic navigation.
