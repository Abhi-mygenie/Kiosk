# Self-Ordering Kiosk - Hyatt Centric Candolim Goa

## Original Problem Statement
Build a self-ordering kiosk application for a 5-star hotel's breakfast buffet. Target device: 21.5" Windows kiosk (Core i3, 8GB RAM, 1920x1080 touch screen).

## Current Status: MVP COMPLETE + FULL POS INTEGRATION DONE ✅

## Tech Stack
- **Frontend:** React Web App (runs in Chrome kiosk mode)
- **Backend:** FastAPI + MongoDB
- **Deployment:** Windows kiosk with Chrome fullscreen
- **External POS:** MyGenie POS (preprod.mygenie.online)

## Brand Guidelines Applied

### Color Palette
- **Blue Hero:** #62B5E5 - Primary buttons, active states, highlights
- **Blue Light:** #78CAFF - Hover states, light accents
- **Blue Medium:** #177DAA - Button hover, secondary actions
- **Blue Dark:** #06293F - Headings, prices, dark text

### Typography
- **Headings:** Big Shoulders Display (font-heading)
- **Body:** Montserrat (font-sans)

### Branding
- Hyatt Centric Candolim Goa logo
- "Powered by MyGenie" logo in footer

## POS Integration Status (Feb 20, 2026)

| Feature | Status | Notes |
|---------|--------|-------|
| Login API | ✅ COMPLETE | Authenticates via `/api/v1/auth/vendoremployee/login` |
| Menu API | ✅ COMPLETE | Fetches from `/api/v2/vendoremployee/product/foods-list` |
| Tables API | ✅ COMPLETE | Fetches from `/api/v2/vendoremployee/restaurant-settings/table-config` |
| Orders API | ✅ COMPLETE | Posts to `/api/v2/vendoremployee/pos/place-order` |

## What's Been Built

### POS Integration (COMPLETE - Feb 20, 2026)
- **Authentication:** Backend proxy to POS login API with token caching
- **Menu Fetch:** Dynamic categories and items from POS API
- **Table Fetch:** Real tables from POS, filtered by `rtype: "TB"`, grouped by section titles
- **Order Placement:** Orders sent to POS API with `place-order` endpoint
- **Pricing Logic:** Handles complementary items (price=0), discounts, GST calculations
- **Variation Groups:** Supports required/optional, single/multi-select variations

### UI/UX Features
- 3-column single-screen layout (Categories | Menu | Cart)
- Hyatt Centric Candolim Goa logo branding
- Full-screen table selector with POS-sourced tables
- Item customization modal (variations, quantity, cooking instructions)
- Portion size & calories on menu cards (hidden if empty/zero)
- Allergen tags on menu cards
- Customer data capture (Name, Mobile)
- Coupon code system (WELCOME10, FLAT50, HYATT20)
- GST breakdown (CGST 2.5% + SGST 2.5%)
- Order success screen with 15-second countdown
- Auto-redirect to home for next customer
- Scrollable category list
- Conditional rendering (no "FREE" label, just hide price for complementary items)

### Kiosk Features
- Elegant touch sounds (5-star hotel quality)
- Sound toggle (on/off) in sidebar
- Kiosk lock mode (blocks shortcuts, fullscreen, no right-click)
- Admin unlock (5 taps on top-left corner)
- Auto-hide cursor after 3 seconds

## API Endpoints

### Internal (Backend)
- `POST /api/auth/login` - Proxy to POS login API
- `GET /api/menu/categories` - Get categories (from POS)
- `GET /api/menu/items` - Get menu items (from POS)
- `GET /api/tables` - Get tables (from POS)
- `POST /api/orders` - Create order (saves to MongoDB + sends to POS)
- `GET /api/config/branding` - Get branding config

### External (MyGenie POS)
- `POST /api/v1/auth/vendoremployee/login` - Authentication
- `GET /api/v2/vendoremployee/product/foods-list` - Menu items
- `GET /api/v2/vendoremployee/restaurant-settings/table-config` - Tables
- `POST /api/v2/vendoremployee/pos/place-order` - Place orders

## Backlog Tasks

### P1 - Medium Priority
- [ ] Receipt printing feature (`window.print()`)

### P2 - Low Priority
- [ ] PWA conversion for offline capabilities
- [ ] Refactor hardcoded `restaurant_id` and `waiter_id` to be configurable

## Key Files
- `/app/frontend/src/pages/LoginPage.js` - Login screen
- `/app/frontend/src/pages/KioskPage.js` - Main kiosk UI
- `/app/frontend/src/components/CustomizationModal.js` - Item variations/add-ons
- `/app/frontend/src/context/AuthContext.js` - Authentication state
- `/app/frontend/src/context/CartContext.js` - Cart state
- `/app/backend/server.py` - All API endpoints + POS integration

## Preview URL
https://hyatt-buffet-order-1.preview.emergentagent.com

## Test Credentials
- **POS Login:** `owner@18march.com` / `Qplazm@10`
- **Coupon Codes:** `WELCOME10` (10% off), `FLAT50` (Rs.50 off), `HYATT20` (20% off)

## Database
- **MongoDB Database:** `test_database`
- **Collections:** `orders`

## POS Configuration
- **Restaurant ID:** 478
- **Restaurant Name:** 18march
- **Waiter ID:** 1703 (default)
