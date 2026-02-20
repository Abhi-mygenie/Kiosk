# Self-Ordering Kiosk - Hyatt Centric Candolim Goa

## Original Problem Statement
Build a self-ordering kiosk application for a 5-star hotel's breakfast buffet. Target device: 21.5" Windows kiosk (Core i3, 8GB RAM, 1920x1080 touch screen).

## Current Status: MVP COMPLETE - Ready for POS Integration

## Tech Stack
- **Frontend:** React Web App (runs in Chrome kiosk mode)
- **Backend:** FastAPI + MongoDB
- **Deployment:** Windows kiosk with Chrome fullscreen

## What's Been Built

### UI/UX Features
- 3-column single-screen layout (Categories | Menu | Cart)
- Hyatt Centric Candolim Goa logo branding
- Full-screen table selector (100 tables: 01-100)
- Item customization modal (variations, quantity)
- Portion size & calories on menu cards
- Allergen tags on menu cards (red badges: Gluten, Dairy, Spicy)
- Customer data capture (Name, Mobile - optional)
- Coupon code system (WELCOME10, FLAT50, HYATT20)
- GST breakdown (CGST 2.5% + SGST 2.5%)
- Order success screen with 15-second countdown
- Auto-redirect to home for next customer
- Visual feedback on menu items in cart (blue border + quantity badge)
- Proper empty cart state display

### Kiosk Features
- Elegant touch sounds (5-star hotel quality)
- Sound toggle (on/off) in sidebar
- Kiosk lock mode (blocks shortcuts, fullscreen, no right-click)
- Admin unlock (5 taps on top-left corner)
- Auto-hide cursor after 3 seconds

### Cart Features
- No delete icon - minus button auto-removes at quantity 0
- Live GST calculation
- Coupon discount display
- Visual indicator when item is added (border + badge on menu card)

## Session Updates (Feb 20, 2025)
- Verified UI bugs (visual feedback + empty cart) are already fixed
- Cleaned up obsolete page files (MenuPage.js, CartPage.js, CheckoutPage.js, HomePage.js, WelcomePage.js)
- Codebase now streamlined with only KioskPage.js

## Pending: POS API Integration

### Details Needed from User:
1. **POS API Base URL:** `https://your-pos.com/api/v1`
2. **Authentication:** API Key / OAuth / Basic Auth
3. **Menu Endpoint:** `GET /menu`
4. **Order Endpoint:** `POST /orders`
5. **Sample API response format

### Planned API Structure:

**Menu API (GET from POS):**
```json
{
  "categories": [{ "id": "dosa", "name": "DOSA", "display_order": 1 }],
  "items": [{
    "id": "item_001",
    "category_id": "dosa",
    "name": "Plain Dosa",
    "price": 9.00,
    "portion_size": "200 gm",
    "calories": 168,
    "allergens": ["Gluten"],
    "variations": [{ "id": "var_001", "name": "BUTTER", "price": 1.00 }]
  }]
}
```

**Order API (POST to POS):**
```json
{
  "order_id": "ORD-20250219-001234",
  "kiosk_id": "KIOSK-01",
  "table_number": "42",
  "customer": { "name": "Rahul", "mobile": "9876543210" },
  "items": [{
    "item_id": "item_001",
    "item_name": "Plain Dosa",
    "quantity": 2,
    "unit_price": 9.00,
    "variations": [{ "name": "CHEESE", "price": 2.00 }],
    "item_total": 22.00
  }],
  "pricing": {
    "subtotal": 33.00,
    "discount": 3.30,
    "coupon_code": "WELCOME10",
    "cgst": 0.74,
    "sgst": 0.74,
    "grand_total": 31.18
  },
  "order_time": "2025-02-19T18:30:45Z"
}
```

## Backlog Tasks

### P0 - High Priority
- [ ] POS API integration (menu fetch + order post) - BLOCKED waiting for API credentials

### P1 - Medium Priority
- [ ] Thermal receipt printing for Windows kiosk

### P2 - Low Priority
- [ ] Move hardcoded menu to MongoDB (if no POS)
- [ ] Offline mode / PWA (later)

## Key Files
- `/app/frontend/src/pages/KioskPage.js` - Main UI (single-page app)
- `/app/frontend/src/utils/touchSound.js` - Sound system
- `/app/frontend/src/utils/kioskLock.js` - Kiosk lock
- `/app/frontend/src/contexts/CartContext.js` - Cart state management
- `/app/backend/server.py` - API endpoints

## Preview URL
https://luxury-order-hub.preview.emergentagent.com

## Hardware Confirmed
- 21.5" Touch Screen Kiosk
- Core i3, 8GB RAM, 128GB mSATA
- Windows OS
- Web app in Chrome kiosk mode (NOT React Native)

## Test Credentials
- Coupon Code: `WELCOME10` (10% off), `FLAT50` (Rs.50 off), `HYATT20` (20% off)
