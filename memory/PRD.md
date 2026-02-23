# Kiosk Application - Product Requirements Document

## Original Problem Statement
User requested to pull and build the kiosk app from https://github.com/parth-mygenie/kiosk.git without changes, then create a React Native Android app for the same kiosk functionality.

## Project Overview
A self-ordering kiosk system for restaurants (Hyatt Centric) with POS integration (MyGenie).

## Architecture

### Web Version (Original)
- **Frontend**: React.js with Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **External API**: MyGenie POS API (preprod.mygenie.online)

### Native Android Version (New)
- **Framework**: React Native 0.84
- **Language**: TypeScript
- **Navigation**: React Navigation
- **Storage**: AsyncStorage
- **HTTP Client**: Axios
- **Target Devices**: Large kiosk displays (21.5", 32", 43")

## User Personas
1. **Restaurant Staff** - Login and manage kiosk
2. **Customers** - Browse menu, place orders at kiosk

## Core Requirements

### Authentication
- [x] Login with POS credentials
- [x] Token-based authentication
- [x] Auto-login with stored token
- [x] Logout functionality

### Menu Display
- [x] Categories from POS
- [x] Menu items with images, prices, descriptions
- [x] Allergen tags
- [x] Calorie information

### Cart Management
- [x] Add items to cart
- [x] Update quantities
- [x] Remove items
- [x] Cart total calculation

### Order Placement
- [x] Table selection
- [x] Order submission to POS
- [x] Order confirmation

## What's Been Implemented

### Feb 23, 2026 (Session 2)
- **Branding API optimization**: Moved branding API call from app load to login flow
- **Login progress loader**: Added beautiful step-by-step loading overlay during login:
  - Authenticating
  - Loading Theme (branding)
  - Loading Categories
  - Loading Menu Items
  - Loading Tables
  - Finalizing Setup
- **Enhanced caching**: Branding now cached in localStorage alongside menu data
- **Fallback behavior**: App uses hardcoded defaults if branding API not called or fails
- **React Native app fully updated**: 
  - Created ThemeContext.tsx for dynamic branding
  - Updated AuthContext.tsx with branding fetch and login progress
  - Updated LoginScreen.tsx with progress overlay
  - Updated KioskScreen.tsx to use theme colors
  - Updated App.tsx with ThemeProvider
  - All screens now use dynamic colors from branding API

### Feb 23, 2026 (Session 1)
- Cloned and deployed web version from GitHub
- All web features working (login, menu, cart, orders)
- Created React Native Android project structure
- Implemented native screens: LoginScreen.tsx, KioskScreen.tsx
- Implemented contexts: AuthContext.tsx, CartContext.tsx
- Implemented services: api.ts (same backend as web)
- Configured Android for large kiosk displays
- Added landscape orientation support
- Client-side caching: Menu data fetched only at login
- Price normalization: Items with price `1` treated as `0`
- Dynamic branding: Web UI fully themed via `/api/config/branding`

## API Call Behavior

### During Login (All calls made sequentially with progress)
1. `POST /api/auth/login` - Authenticate user
2. `GET /api/config/branding` - Fetch theme/branding
3. `GET /api/menu/categories` - Fetch categories
4. `GET /api/menu/items` - Fetch menu items
5. `GET /api/tables` - Fetch tables

### After Login (Cached session)
- No API calls for menu/categories/tables (uses localStorage cache)
- Only `POST /api/orders` when placing an order

### On App Reload (With cached session)
- No API calls - loads directly from localStorage cache

## API Endpoints (Shared)
- POST /api/auth/login
- GET /api/menu/categories
- GET /api/menu/items
- GET /api/tables
- POST /api/orders
- GET /api/config/branding

## Test Credentials
- Username: owner@18march.com
- Password: Qplazm@10

## File Structure

```
/app/
├── backend/           # FastAPI backend (unchanged)
├── frontend/          # React web app
│   └── src/
│       ├── contexts/
│       │   ├── AuthContext.js   # Login, caching, progress tracking
│       │   ├── ThemeContext.js  # Dynamic branding (uses cached data)
│       │   └── CartContext.js   # Cart management
│       └── pages/
│           ├── LoginPage.js     # Login with progress overlay
│           └── KioskPage.js     # Main kiosk interface
├── kiosk-native/
│   └── KioskApp/     # React Native Android app
│       ├── src/
│       │   ├── screens/
│       │   ├── contexts/
│       │   └── services/
│       ├── android/
│       └── App.tsx
```

## Prioritized Backlog

### P0 (Critical)
- [x] Web version deployment
- [x] Native app structure
- [x] Client-side caching (login only)
- [x] Dynamic branding for web
- [ ] Apply dynamic branding to React Native app
- [ ] Build APK for testing

### P1 (High Priority)
- [ ] Item variation/customization support in native
- [ ] Order history view
- [ ] Receipt printing integration

### P2 (Medium Priority)
- [ ] Offline mode with local database
- [ ] Push notifications
- [ ] Multiple language support
- [ ] Admin panel for branding settings

### P3 (Future)
- [ ] Barcode scanner integration
- [ ] Payment terminal integration
- [ ] Customer loyalty program

## Next Tasks
1. Apply dynamic branding to React Native app (same fallback logic as web)
2. Build debug APK for testing on actual kiosk devices
3. Test on 21.5", 32", and 43" displays
4. Add item variation selection UI
