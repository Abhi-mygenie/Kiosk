# Kiosk Self-Ordering App - PRD

## Original Problem Statement
Convert an existing React web kiosk self-ordering application into a native Android app using React Native, while adding admin features for menu management and operating hours configuration.

## Architecture
- **Web App**: React (`/app/frontend`) - fully functional
- **Native App**: React Native (`/app/kiosk-native/KioskApp`) - ported, unbuilt
- **Backend**: FastAPI proxy to POS API (`https://preprod.mygenie.online/api/v1` and `/api/v2`)
- **Storage**: No database. Client-side persistence via `localStorage` (web) / `AsyncStorage` (native)
- **External API**: POS API for auth, menu, tables, orders

## Test Credentials
- Email: manager@hyattcandolim.com
- Password: Qplazm@10

## What's Been Implemented

### Web App (Complete & Tested)
- Login with "Remember Me" functionality
- Admin Settings page (menu reorder, show/hide categories/items via drag-and-drop)
- **NEW: Timing Settings page** (operating hours with estimated prep time per slot, max 4 slots)
- **NEW: Sidebar navigation links** (Menu Settings + Timing buttons above Sound/Logout)
- **NEW: Order confirmation shows estimated prep time** based on current time matching active shift
- Admin Settings supports re-entry from sidebar with Back/Cancel buttons
- Kiosk page with full ordering flow (landscape + portrait)
- Table selector, cart, order placement
- Updated empty cart text: "Ready to order? / Select items from the menu to begin"

### React Native App (Ported, Not Built)
- All web features ported to native equivalents
- **NEW: TimingSettingsContext.js** - AsyncStorage-based timing persistence
- **NEW: TimingSettingsScreen.js** - Operating hours config UI
- **NEW: Header updated** with Menu Settings + Timing buttons
- **NEW: AppNavigator updated** with MenuSettings + TimingSettings screens
- **NEW: SuccessOverlay updated** with prep time display
- **FIX: Removed react-native-splash-screen** (incompatible with RN 0.84 New Architecture)
- **FIX: Removed react-native-sound** (unused, incompatible)
- **FIX: Removed react-native-vector-icons** (unused)
- **FIX: super.onCreate(null)** in MainActivity.kt for react-native-screens compatibility

### Key localStorage Keys
- `kiosk_menu_settings` - Menu reorder/visibility settings
- `kiosk_timing_settings` - Operating hours with prep times
- `kiosk_settings_complete` - Whether settings have been saved/skipped
- `kiosk_remember_user` / `kiosk_remember_pass` - Remember Me credentials
- `kiosk_user` - Auth token/user data

## Pending / Upcoming Tasks

### P0: Build React Native Android App
- Environment needs JDK 17, Android SDK
- Run `npx react-native run-android` from `/app/kiosk-native/KioskApp`
- Debug any remaining build failures

### P1: Full Functional Testing (Native App)
- Test login, admin settings, timing settings, kiosk ordering flow on device

### P2: APK Generation
- Create signed release APK

## Future / Backlog Tasks
- **Live Preview**: Add preview panel on Admin Settings to show how menu will look
- **Refactor KioskScreen**: Break down the 1286-line component into smaller children
- **Security**: Move password from localStorage to sessionStorage or remove Remember Password
- **Hardcoding Cleanup**: Move POS API URLs and Restaurant ID/Name to .env
- **Dead Code Cleanup**: Remove unused CustomizationModal.js, MenuItemCard.js, SidebarNav.js from web components

## Key API Endpoints
- `POST /api/auth/login` - Authentication
- `GET /api/menu/categories` - Fetch menu categories
- `GET /api/menu/items` - Fetch menu items
- `GET /api/tables` - Fetch table config (calls POS v2 endpoint)
- `POST /api/orders` - Place order

## File References
### Web App
- `/app/frontend/src/pages/TimingSettingsPage.js` - NEW
- `/app/frontend/src/contexts/TimingSettingsContext.js` - NEW
- `/app/frontend/src/pages/AdminSettingsPage.js` - Updated (onBack prop)
- `/app/frontend/src/pages/KioskPage.js` - Updated (sidebar buttons, prep time)
- `/app/frontend/src/App.js` - Updated (navigation state, TimingSettingsProvider)

### React Native App
- `/app/kiosk-native/KioskApp/src/pages/TimingSettingsScreen.js` - NEW
- `/app/kiosk-native/KioskApp/src/contexts/TimingSettingsContext.js` - NEW
- `/app/kiosk-native/KioskApp/src/components/Header.js` - Updated
- `/app/kiosk-native/KioskApp/src/components/SuccessOverlay.js` - Updated
- `/app/kiosk-native/KioskApp/src/pages/KioskScreen.js` - Updated
- `/app/kiosk-native/KioskApp/src/pages/AdminSettingsScreen.js` - Updated
- `/app/kiosk-native/KioskApp/src/navigation/AppNavigator.js` - Updated
- `/app/kiosk-native/KioskApp/App.js` - Updated
- `/app/kiosk-native/KioskApp/android/app/src/main/java/com/kioskapp/MainActivity.kt` - Fixed
