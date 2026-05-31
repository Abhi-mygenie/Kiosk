# Kiosk Self-Ordering App - PRD

> ## 🚦 ACTIVE CR IN PROGRESS — READ FIRST
> A 10-phase stability+refactor CR is currently mid-execution.
> **Before doing anything else, read `/app/memory/CR_STATUS.md`** (the dashboard).
> User has accepted control-layer rules OP-1 through OP-8 as binding (see `CONTROL_LAYER.md`).
>
> **Status:** P1 ✅ approved • P2 🔵 awaiting Entry Gate decisions • P3-P10 not started
> **Branch:** `cr/phase-1-safety` @ `14f6e7e`
> **Pending user input:** 4 decisions in `phases/P2_contract.md` §10
>
> ---

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

### React Native KioskScreen.js Refactor (Mar 17, 2026)
**Reduced from 530 lines to 229 lines (57% reduction)**

Extracted 3 new components:
- `/kiosk-native/.../components/LogoutConfirmModal.js` - Logout confirmation dialog
- `/kiosk-native/.../components/EditInstructionsModal.js` - Bottom-sheet cooking instructions editor
- `/kiosk-native/.../components/MenuGrid.js` - FlatList wrapper for menu items (5-column grid)

### Styling Consistency Fix (Mar 17, 2026)
- Updated CSS variable `--background` from `0 0% 98%` (#FAFAFA) to `40 20% 97%` (#F9F8F6) to match the warm off-white used throughout
- Replaced all 9 hardcoded `bg-[#F9F8F6]` instances across App.js, KioskPage, LoginPage, AdminSettingsPage, TimingSettingsPage with `bg-background`
- Single source of truth: all background colors now controlled via `--background` CSS variable

### Android Build Setup (Mar 17, 2026)
Created 3 build options for producing the Android APK:
1. **GitHub Actions** — `.github/workflows/build-android.yml` auto-builds on push to main
2. **Local Build Script** — `build.sh` with auto-detection of JDK, Android SDK, and dependency installation
3. **EAS Build** — `eas.json` + `app.json` for remote cloud builds via Expo

Build guide: `/app/kiosk-native/KioskApp/BUILD_GUIDE.md`

Note: The Emergent preview container runs arm64 which cannot execute x86_64 NDK toolchains. All 3 build options target x86_64 environments (GitHub runners, local machines, Expo cloud).

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

---

## Kiosk Stability+Refactor CR (started 2026-05-30)

### Phase 1 — Stop the bleeding (in progress)
**Status:** ✅ Implemented + tested 7/7 PASS, awaiting user Exit Gate approval
**Branch/Commit:** `cr/phase-1-safety` @ `b82815b`
**What was implemented:**
- Custom React ErrorBoundary at App root with "Reset Kiosk" and "Log out and reload" recovery buttons. Visible without admin unlock.
- Dev-only `?force-crash=1` probe for verifying boundary (gated on NODE_ENV !== 'production').
- `safeRead.js` helpers (readArray, readObject, safeMenuData, safeMenuSettings, safeShifts, clearKioskStorage) — all `localStorage` reads now type-check before use.
- Axios response interceptor (`enforceJsonForApi`) rejects any /api/* response whose Content-Type is not application/json — closes the nginx-misroute class of bugs that caused the original kiosk-bricking incident.
- AuthContext refactored: boots from safeRead, validates menuData shape, uses guarded `publicAxios` + `createAuthAxios`, surfaces clean error "Backend returned an unexpected response" on non-JSON.
- MenuSettingsContext/TimingSettingsContext sanitise stored values.
- AdminSettingsPage + KioskPage have `Array.isArray` guards on every menuData access.

**Audit findings closed:** FE-1, FE-2, FE-3, FE-4, FE-5, FE-6, FE-7, FE-U-1 (8 × P0)
**Test report:** `/app/test_reports/iteration_5.json`
**Files governed by:** `/app/memory/phases/P1_contract.md`, change notes at `P1_change_notes.md`

### Remaining phases (per `/app/memory/EXECUTION_PLAN.md`)
P2 Backend hardening · P3 Native APK URL · P4 Security cleanup · P5 CI/CD · P6 UX polish · P7 Backend modularize · P8 Web dedup · P9 kiosk-core shared package · P10 Test pyramid + monitoring

---

## Session closure — 2026-05-30

P1 complete & approved. Session closing per playbook. CR paused mid-execution.

**Resume point:** `/app/memory/SESSION_CLOSE.md` (single read for next session)
**Next action item:** User answers 4 Entry Gate decisions in `/app/memory/phases/P2_contract.md` §10, then types "All defaults, start Phase 2" to kick off P2.
