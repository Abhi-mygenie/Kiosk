# Self-Ordering Kiosk - Hotel Breakfast Buffet

## Original Problem Statement
Pull https://github.com/Abhi-mygenie/Kiosk/tree/conflict_kios_latest - understand and run code

## Status: RUNNING ✅ (Feb 24, 2026)

## Tech Stack
- **Frontend:** React 19 + Tailwind CSS + Framer Motion
- **Backend:** FastAPI + MongoDB + Motor
- **External POS:** MyGenie POS (preprod.mygenie.online)

## What's Implemented

### Authentication
- POS login proxy via `/api/auth/login`
- Session persistence via localStorage
- Token caching for POS API calls

### Menu System
- Dynamic categories from POS API
- Menu items with variations, add-ons, allergens
- Pricing: base price, discounts, GST calculations
- Complementary items support (price = 0)

### Order Flow
- Cart management with variations tracking
- Table selection from POS tables
- Customer info capture (name, mobile)
- Coupon codes (WELCOME10, FLAT50, HYATT20)
- GST breakdown (CGST 2.5% + SGST 2.5%)
- Order submission to POS API

### Kiosk Features
- 3-column single-screen layout
- Touch sounds (elegant, hotel-quality)
- Kiosk lock mode (blocks shortcuts)
- Admin unlock (5 taps on top-left)
- Auto-redirect after order (15s countdown)

## API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | POS login proxy |
| `/api/menu/categories` | GET | Get categories |
| `/api/menu/items` | GET | Get menu items |
| `/api/tables` | GET | Get POS tables |
| `/api/orders` | POST | Place order |

## Test Credentials
- **POS Login:** owner@18march.com / Qplazm@10
- **Coupon Codes:** WELCOME10, FLAT50, HYATT20

## Key Files
- `/app/frontend/src/pages/KioskPage.js` - Main UI
- `/app/frontend/src/pages/LoginPage.js` - Login screen
- `/app/frontend/src/contexts/CartContext.js` - Cart state
- `/app/frontend/src/contexts/AuthContext.js` - Auth state
- `/app/backend/server.py` - All API endpoints

## Preview URL
https://kiosk-checkout-1.preview.emergentagent.com

## Backlog
- [ ] Receipt printing feature
- [ ] PWA for offline mode
- [ ] Configurable restaurant_id/waiter_id
