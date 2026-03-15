# Kiosk Application PRD

## Original Problem Statement
Pull code from https://github.com/Abhi-mygenie/Kiosk, build it, run the application, and convert it into a React Native Android app. No database is used — the app is a client for the external POS API.

## Target Users
- Hotel/restaurant staff managing self-ordering kiosks (Hyatt Centric)

## Core Requirements
1. Self-ordering kiosk web app + native Android app
2. POS API integration for authentication, menu, orders
3. Admin settings page for menu customization (ordering, visibility)
4. Kiosk mode (fullscreen, no back button) on Android
5. Brand-consistent UI with Hyatt Centric theme

## Tech Stack
### Web App
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (proxy to POS API)
- **State**: Context API + localStorage

### Native App
- **Framework**: React Native
- **Navigation**: React Navigation (Stack)
- **State**: Context API + AsyncStorage
- **Drag & Drop**: react-native-draggable-flatlist
- **Build**: Gradle (Android)

## Key API Endpoints
- **Base URL**: `https://preprod.mygenie.online/api/v1`
- **Auth**: `POST /auth/vendoremployee/login`
- **Menu**: `GET /menu/categories`, `GET /menu/items`
- **Tables**: `GET /tables`
- **Orders**: `POST /orders`

## Implemented Features (as of March 15, 2026)

### Web App
- [x] Login with POS credentials
- [x] Remember Me (localStorage)
- [x] Admin Settings page (drag & drop reorder + visibility toggles)
- [x] Menu settings persist across logouts, admin page shows every login
- [x] Reset to Default clears all saved settings
- [x] Full kiosk ordering flow (menu, cart, customization, order placement)
- [x] Table selector popup
- [x] New Hyatt logo across all pages
- [x] Watermark removed, title updated
- [x] Git submodule fix for KioskApp directory

### React Native App
- [x] All web features ported (login, admin settings, kiosk, cart)
- [x] Remember Me (AsyncStorage)
- [x] Admin Settings with draggable categories + visibility toggles
- [x] MenuSettingsContext with AsyncStorage persistence
- [x] New logo across all screens
- [x] Kiosk mode configured in AndroidManifest
- [x] Custom fonts, app icon, splash screen configured
- [x] NOT YET BUILT — requires Android SDK/JDK (not in container)

## Architecture
```
/app/
├── frontend/src/          # React web app
│   ├── pages/             # LoginPage, KioskPage, AdminSettingsPage
│   ├── contexts/          # AuthContext, CartContext, MenuSettingsContext, ThemeContext
│   └── components/        # UI components
├── backend/               # FastAPI server (POS API proxy)
└── kiosk-native/KioskApp/ # React Native app
    ├── src/
    │   ├── pages/         # LoginScreen, KioskScreen, AdminSettingsScreen
    │   ├── contexts/      # AuthContext, CartContext, MenuSettingsContext, ThemeContext
    │   ├── components/    # Header, CartSection, MenuItemCard, etc.
    │   ├── navigation/    # AppNavigator
    │   └── theme/         # colors, typography, spacing
    └── android/           # Native Android project
```

## Backlog / Future Tasks
- [ ] P0: Build React Native Android APK (needs Android SDK environment)
- [ ] P1: Debug any RN build failures
- [ ] P2: Full functional testing of native app
- [ ] P3: Generate signed release APK
- [ ] P2: Refactor KioskScreen.js into smaller components
- [ ] P3: Add "Menu Settings" access from Kiosk page (gear icon)

## Test Credentials
- Email: manager@hyattcandolim.com
- Password: Qplazm@10
