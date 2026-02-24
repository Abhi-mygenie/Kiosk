# Kiosk App - React Native Android

A self-ordering kiosk application for restaurants built with React Native, targeting large Android kiosk displays (21.5", 32", and 43" screens).

## Features

- **Login Authentication** - POS system integration
- **Menu Browsing** - Categories and items from POS
- **Cart Management** - Add, remove, update quantities
- **Table Selection** - Select table for order placement
- **Order Placement** - Send orders directly to POS system
- **Large Screen Support** - Optimized for 21.5", 32", and 43" kiosk displays

## Tech Stack

- React Native 0.84
- TypeScript
- React Navigation
- AsyncStorage for token persistence
- Axios for API calls

## Project Structure

```
KioskApp/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx      # Login page
│   │   └── KioskScreen.tsx      # Main kiosk interface
│   ├── contexts/
│   │   ├── AuthContext.tsx      # Authentication state
│   │   └── CartContext.tsx      # Shopping cart state
│   ├── services/
│   │   └── api.ts               # API service layer
│   └── utils/
├── android/                      # Android native code
├── App.tsx                       # Root component
└── package.json
```

## Prerequisites

- Node.js >= 18
- Yarn
- Android Studio with SDK 34+
- Java JDK 17+

## Setup

1. **Install Dependencies**
   ```bash
   cd KioskApp
   yarn install
   ```

2. **Start Metro Bundler**
   ```bash
   yarn start
   ```

3. **Run on Android Device/Emulator**
   ```bash
   yarn android
   ```

## Building Release APK

1. **Generate Release APK**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

2. **APK Location**
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

## Building Release AAB (for Play Store)

```bash
cd android
./gradlew bundleRelease
```

AAB will be at: `android/app/build/outputs/bundle/release/app-release.aab`

## API Configuration

The app connects to the same backend as the web version:
- **API Base URL**: `https://order-placement-1.preview.emergentagent.com/api`

To change the API URL, edit `src/services/api.ts`:
```typescript
const API_BASE_URL = 'YOUR_API_URL';
```

## Kiosk Mode Setup (Optional)

For production kiosk deployment, configure Android device:

1. **Enable Kiosk Mode** in device settings
2. **Set as Default Launcher** 
3. **Disable Navigation Bar**
4. **Enable Auto-Start on Boot**

## Test Credentials

- **Username**: owner@18march.com
- **Password**: Qplazm@10

## Screen Size Support

The app is responsive and optimized for:
- 21.5" displays (~1920x1080)
- 32" displays (~1920x1080 / 2560x1440)
- 43" displays (~1920x1080 / 3840x2160)

Layout automatically adjusts based on screen width.

## Troubleshooting

**Metro bundler issues:**
```bash
yarn start --reset-cache
```

**Android build issues:**
```bash
cd android
./gradlew clean
cd ..
yarn android
```

**Clear all caches:**
```bash
watchman watch-del-all
rm -rf node_modules
yarn install
```
