# Android Development Setup

Date: 2026-08-04

## Portability Rule

Project code must not depend on one developer's laptop, SDK path, emulator name, phone, or local Android Studio configuration.

Do not commit:

- Absolute SDK paths such as `C:\Users\<name>\AppData\Local\Android\Sdk`
- AVD files or `.android` emulator state
- `android/local.properties`
- Generated build folders such as `dist`, `build`, `.gradle`, or `node_modules`

Each developer should install Android tooling locally, then run the same project commands.

## Required Tools

- Node.js LTS
- npm
- Android Studio
- Android SDK Platform Tools
- Android Emulator
- Android SDK Command-line Tools
- One installed Android system image

For this Expo app, Android Studio is mainly needed for the SDK, emulator, and Device Manager. The app itself is run from `mobile` with npm scripts.

## Environment Variables

Set these on each developer machine:

```powershell
ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
ANDROID_SDK_ROOT=%LOCALAPPDATA%\Android\Sdk
```

Add these folders to the user `Path`:

```text
%LOCALAPPDATA%\Android\Sdk\platform-tools
%LOCALAPPDATA%\Android\Sdk\emulator
%LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest\bin
```

After changing `Path`, open a new terminal and verify:

```powershell
adb version
emulator -list-avds
avdmanager --help
```

## Emulator

Create at least one Android Virtual Device locally. The name does not matter to the project.

Recommended baseline:

- Medium Phone or Pixel-style device
- Android API 35 or newer
- Google APIs x86_64 system image

Verify a running emulator:

```powershell
adb devices
```

Expected result: one `emulator-####` entry with status `device`.

## Run The App

```powershell
cd mobile
npm install
npm run android
```

If Expo starts but the emulator does not open the app, keep Metro running and use:

```powershell
adb reverse tcp:8081 tcp:8081
```

Then reopen the app from Expo Go or rerun:

```powershell
npm run android
```

## Sharing The Project

Teammates should be able to git clone or unzip the repository, install dependencies, start an emulator, and run `npm run android`.

Any machine-specific setup belongs in local environment variables, Android Studio, or the user's SDK installation. It should not be hardcoded into source files.
