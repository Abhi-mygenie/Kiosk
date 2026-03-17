# Hyatt Kiosk App - React Native

Complete React Native Android app for Hyatt Centric Self-Ordering Kiosk.

## ✅ App Complete - Ready to Build

### Features Included:
- ✅ Login authentication (POS API)
- ✅ Menu browsing with categories
- ✅ Item customization (variations, quantity, instructions)
- ✅ Shopping cart management
- ✅ Table selection
- ✅ Order placement to POS
- ✅ Success confirmation screen
- ✅ Kiosk mode (fullscreen, back button disabled)
- ✅ Auto-start on device boot
- ✅ Custom fonts (Big Shoulders Display, Montserrat)
- ✅ App icon (Hyatt logo)
- ✅ Splash screen with logo

## Quick Start

### 1. Install Dependencies
```bash
cd KioskApp
npm install
```

### 2. Run on Android
```bash
# Start Metro bundler
npm start

# In another terminal
npm run android
```

### 3. Build Release APK
```bash
cd android
./gradlew assembleRelease
```
APK location: `android/app/build/outputs/apk/release/app-release.apk`

## Project Structure

```
KioskApp/
├── App.js                    # Entry point with splash screen
├── src/
│   ├── assets/fonts/         # Custom fonts (6 files)
│   ├── components/           # UI components (9 files)
│   ├── contexts/             # State management (3 files)
│   ├── navigation/           # Navigation config
│   ├── pages/                # Screens (3 files)
│   ├── theme/                # Design system
│   └── utils/                # Helpers & API
├── android/
│   └── app/src/main/
│       ├── java/com/kioskapp/
│       │   ├── MainActivity.kt    # Kiosk mode
│       │   └── BootReceiver.kt    # Auto-start
│       ├── res/
│       │   ├── mipmap-*/          # App icons (5 sizes)
│       │   ├── drawable/          # Splash screen
│       │   ├── layout/            # Splash layout
│       │   └── values/            # Strings, colors, styles
│       └── assets/fonts/          # Fonts for Android
```

## Configuration

### API Endpoint
Edit `src/utils/api.js`:
```javascript
export const API_BASE_URL = 'https://your-api-url.com';
```

### App ID
Current: `com.hyatt.kioskapp`
Change in `android/app/build.gradle`

### Kiosk Mode Settings
- Fullscreen: Enabled
- Back button: Disabled
- Home button: Blocked
- Auto-start on boot: Enabled
- Screen always on: Enabled

## Testing

Use your POS credentials to login. The app connects to:
```
https://admin-hub-212.preview.emergentagent.com/api
```

## Building for Production

### Generate Release Keystore
```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore my-release-key.keystore \
  -alias my-key-alias \
  -keyalg RSA -keysize 2048 -validity 10000
```

### Configure Signing
Edit `android/app/build.gradle`:
```gradle
signingConfigs {
    release {
        storeFile file('my-release-key.keystore')
        storePassword 'your-password'
        keyAlias 'my-key-alias'
        keyPassword 'your-password'
    }
}
```

### Build
```bash
cd android
./gradlew assembleRelease
# or for Play Store
./gradlew bundleRelease
```

## Troubleshooting

### Metro issues
```bash
npm start -- --reset-cache
```

### Build issues
```bash
cd android && ./gradlew clean && cd ..
npm run android
```

### Device not found
```bash
adb devices
adb kill-server && adb start-server
```
