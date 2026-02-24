# Self-Ordering Kiosk - Hyatt Candolim

## Original Problem Statement
Pull https://github.com/Abhi-mygenie/Kiosk/tree/conflict_kios_latest, then switch to conflict_230226_2055 branch

## Status: RUNNING ✅ (Feb 24, 2026)
**Branch:** `conflict_230226_2055`

## Architecture

### Two Frontend Apps + One Backend
| Component | Technology | Path |
|-----------|------------|------|
| React Web App | React 19, Tailwind, Framer Motion | `/frontend/` |
| React Native App | React Native 0.84, TypeScript | `/kiosk-native/KioskApp/` |
| Backend API | FastAPI, MongoDB, Motor | `/backend/` |

### Shared Backend APIs
- `POST /api/auth/login` - POS login proxy
- `GET /api/menu/categories` - Categories (with auth token)
- `GET /api/menu/items` - Menu items (with auth token)
- `GET /api/tables` - Tables (with auth token)
- `POST /api/orders` - Place order (with auth token)
- `GET /api/config/branding` - Branding config

## Key Differences from conflict_kios_latest
1. User's auth token passed in Authorization header for all API calls
2. React Native app included for mobile devices
3. Extended branding config with fonts, colors, loader settings

## Test Credentials
- **Email:** manager@hyattcandolim.com
- **Password:** Qplazm@10

## Preview URL
https://kiosk-checkout-1.preview.emergentagent.com

## React Native Setup (for mobile)
```bash
cd /app/kiosk-native/KioskApp
yarn install
npx react-native run-android  # For Android
npx react-native run-ios      # For iOS
```

## Backlog
- [ ] Build React Native APK for Android
- [ ] Add images to POS menu items
- [ ] Receipt printing feature
