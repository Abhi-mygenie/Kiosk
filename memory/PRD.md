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

### Feb 23, 2026
- Cloned and deployed web version from GitHub
- All web features working (login, menu, cart, orders)
- Created React Native Android project structure
- Implemented native screens:
  - LoginScreen.tsx
  - KioskScreen.tsx
- Implemented contexts:
  - AuthContext.tsx
  - CartContext.tsx
- Implemented services:
  - api.ts (same backend as web)
- Configured Android for large kiosk displays
- Added landscape orientation support

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
├── frontend/          # React web app (unchanged)
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
- [ ] Build APK for testing

### P1 (High Priority)
- [ ] Item variation/customization support in native
- [ ] Order history view
- [ ] Receipt printing integration

### P2 (Medium Priority)
- [ ] Offline mode with menu caching
- [ ] Push notifications
- [ ] Multiple language support

### P3 (Future)
- [ ] Barcode scanner integration
- [ ] Payment terminal integration
- [ ] Customer loyalty program

## Next Tasks
1. Build debug APK for testing on actual kiosk devices
2. Test on 21.5", 32", and 43" displays
3. Add item variation selection UI
4. Implement receipt printing
