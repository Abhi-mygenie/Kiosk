# KioskApp - Build Guide

## Option 1: GitHub Actions (Recommended - Automated)

Push the code to GitHub and the APK will be built automatically.

### Setup:
1. Save to GitHub using the "Save to Github" button in Emergent
2. Go to your repo → **Actions** tab
3. The workflow runs on every push to `main`/`master` that changes `kiosk-native/` files
4. Or click **"Run workflow"** to trigger manually
5. Download the APK from the workflow's **Artifacts** section

### Files:
- `.github/workflows/build-android.yml`

---

## Option 2: Local Build

Build directly on your machine (macOS/Linux/Windows with WSL).

### Prerequisites:
- **JDK 17**: [Download Temurin](https://adoptium.net/temurin/releases/?version=17)
- **Node.js 18+**: [Download](https://nodejs.org)
- **Android SDK** with:
  - Platform: `android-36`
  - Build Tools: `36.0.0`
  - NDK: `27.1.12297006`

### Quick Start:
```bash
cd kiosk-native/KioskApp

# Make build script executable
chmod +x build.sh

# Build release APK
./build.sh

# Or build debug APK
./build.sh debug

# Clean and rebuild
./build.sh clean
```

The APK will be at:
- Release: `android/app/build/outputs/apk/release/app-release.apk`
- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`

### Install on device:
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

## Option 3: EAS Build (Expo Cloud Build)

Build remotely on Expo's servers without any local setup.

### First-time Setup:
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo (create free account at https://expo.dev)
eas login

# Navigate to the project
cd kiosk-native/KioskApp

# Build Android APK
eas build --platform android --profile preview
```

### Subsequent Builds:
```bash
cd kiosk-native/KioskApp
eas build --platform android --profile preview
```

The APK download link will be shown in the terminal and on your [Expo dashboard](https://expo.dev).

### Files:
- `eas.json` - Build profiles configuration
- `app.json` - App metadata

---

## App Info
- **Package**: `com.hyatt.kioskapp`
- **Version**: 1.0.0
- **Min Android**: API 24 (Android 7.0)
- **Target Android**: API 36
