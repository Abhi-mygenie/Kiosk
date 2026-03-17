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
- **Hyatt (has tables)**: manager@hyattcandolim.com / Qplazm@10
- **Kunafa Mahal (no tables)**: owner@kunafamahal.com / Qplazm@10

## What's Been Implemented

### Web App (Complete & Tested)
- Login with "Remember Me" functionality (username only - password in sessionStorage)
- Admin Settings page (menu reorder, show/hide categories/items via drag-and-drop)
- Timing Settings page (operating hours with estimated prep time per slot, max 4 slots)
- Sidebar navigation links (Menu Settings + Timing buttons above Sound/Logout)
- Order confirmation shows estimated prep time based on current time matching active shift
- Optional Tables - restaurants with no tables skip table selection; success screen shows token number
- Admin mode toggle - lock icon to show/hide admin controls
- SECURITY: Hardcoded secrets moved to backend/.env
- SECURITY: Password no longer stored in localStorage
- Kiosk page with full ordering flow (landscape + portrait)
- Table selector, cart, order placement

### KioskPage.js Refactor (Complete - Mar 17, 2026)
**Reduced from 1356 lines to 404 lines (70% reduction)**

Extracted 10 components + 1 hook + 1 utility module:
- `/app/frontend/src/components/kiosk/CustomizationModal.js` - Item customization with variations, qty, instructions
- `/app/frontend/src/components/kiosk/SuccessOverlay.js` - Order confirmation with countdown
- `/app/frontend/src/components/kiosk/CategoryPills.js` - Horizontal category pills (portrait mode)
- `/app/frontend/src/components/kiosk/InlineCartItem.js` - Compact cart item (portrait mode)
- `/app/frontend/src/components/kiosk/CartSectionLandscape.js` - Full cart panel (landscape mode)
- `/app/frontend/src/components/kiosk/PortraitMenuCard.js` - Menu item card (portrait mode)
- `/app/frontend/src/components/kiosk/LandscapeMenuCard.js` - Menu item card (landscape mode)
- `/app/frontend/src/components/kiosk/TableSelector.js` - Table selection modal
- `/app/frontend/src/components/kiosk/LogoutConfirmModal.js` - Logout confirmation dialog
- `/app/frontend/src/components/kiosk/EditInstructionsModal.js` - Edit cooking instructions modal (with visualViewport keyboard fix)
- `/app/frontend/src/hooks/useOrientation.js` - Portrait/landscape detection hook
- `/app/frontend/src/utils/kioskHelpers.js` - Shared utilities (normalizePrice, createAuthAxios)

Dead code removed:
- `/app/frontend/src/components/layout/SidebarNav.js` (deleted)
- `/app/frontend/src/components/menu/CustomizationModal.js` (deleted)
- `/app/frontend/src/components/menu/MenuItemCard.js` (deleted)

### React Native Parity - 3 Critical Gaps Fixed (Mar 17, 2026)
1. **No-Tables Flow**: KioskScreen, SuccessOverlay, CartSection now handle restaurants without tables (shows token number instead of table)
2. **Admin Toggle**: Header.js now has lock/unlock icon to show/hide admin controls (Menu Settings, Timing, Logout)
3. **Edit Cooking Instructions**: CartSection has edit icon on each cart item; KioskScreen has new modal for editing instructions

### React Native App (Ported, Not Built)
- All web features ported to native equivalents
- TimingSettingsContext.js, TimingSettingsScreen.js
- Header, SuccessOverlay, AppNavigator updated
- Removed incompatible packages (splash-screen, sound, vector-icons)

## Key API Endpoints
- `POST /api/auth/login` - Authentication
- `GET /api/menu/categories` - Fetch menu categories
- `GET /api/menu/items` - Fetch menu items
- `GET /api/tables` - Fetch table config
- `POST /api/orders` - Place order

## Pending / Upcoming Tasks

### P0: Build React Native Android App
- Environment needs JDK 17, Android SDK
- Run `npx react-native run-android` from `/app/kiosk-native/KioskApp`
- Debug any remaining build failures

### P1: Styling Consistency
- Unify `bg-[#F9F8F6]` vs theme `bg-background` across all pages

## Future / Backlog Tasks
- Refactor `KioskScreen.js` (Native) into smaller components
- Live Preview panel on Admin Settings page
- APK generation (signed release build)
