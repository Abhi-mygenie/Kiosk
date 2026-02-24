# Self-Ordering Kiosk - Hyatt Candolim

## Original Problem Statement
Pull https://github.com/Abhi-mygenie/Kiosk/tree/conflict_kios_latest, then switch to conflict_230226_2055 branch

## Status: RUNNING ✅ (Feb 24, 2026)
**Branch:** `conflict_230226_2055`

## Recent Changes (Feb 24, 2026)

### ✅ Fixed: Variations not passing to POS API
- **Issue:** Item variations (e.g., CHEESE, CHILLI) were not being received by the POS system
- **Root Cause:** Backend was sending variations in wrong format (`[{"label": "MOONG"}]` instead of correct format)
- **Solution:** Updated to send variations in correct POS API format:
  ```json
  "variations": [
    {"name": "CHOICE", "values": {"label": ["CHEESE", "CHILLI"]}}
  ]
  ```
- **Files Changed:**
  - `/app/backend/server.py` - Fixed `send_order_to_pos` function to build correct variations structure
  - `/app/frontend/src/pages/KioskPage.js` - Added `groupedVariations` to pass variation group names
  - `/app/frontend/src/contexts/CartContext.js` - Preserved `groupedVariations` in cart
  - `/app/kiosk-native/KioskApp/src/contexts/CartContext.tsx` - Added `grouped_variations` support
  - `/app/kiosk-native/KioskApp/src/screens/KioskScreen.tsx` - Pass `grouped_variations` in orders

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

## Key Order Payload Format (for POS API)
```json
{
  "cart": [{
    "food_id": 35281,
    "quantity": 1,
    "variations": [
      {"name": "CHOICE", "values": {"label": ["CHEESE", "CHILLI"]}}
    ],
    "food_level_notes": "Extra crispy",
    "price": 1.0
  }]
}
```

## Test Credentials
- **Email:** manager@hyattcandolim.com
- **Password:** Qplazm@10

## Preview URL
https://order-placement-1.preview.emergentagent.com

## React Native Setup (for mobile)
```bash
cd /app/kiosk-native/KioskApp
yarn install
npx react-native run-android  # For Android
npx react-native run-ios      # For iOS
```

## Backlog
- [ ] Full testing of React Native app (code updated but not runtime tested)
- [ ] Build React Native APK for Android
- [ ] Add images to POS menu items
- [ ] Receipt printing feature
