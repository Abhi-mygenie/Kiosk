# Self-Ordering Kiosk - Hyatt Centric Candolim Goa

## Original Problem Statement
Build a self-ordering kiosk application for a 5-star hotel's breakfast buffet. Target device: 21.5" Windows kiosk (Core i3, 8GB RAM, 1920x1080 touch screen).

## Current Status: MVP COMPLETE + POS Login Integration DONE

## Tech Stack
- **Frontend:** React Web App (runs in Chrome kiosk mode)
- **Backend:** FastAPI + MongoDB
- **Deployment:** Windows kiosk with Chrome fullscreen

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

## What's Been Built

### Authentication (COMPLETE - Feb 20, 2026)
- Clean login page with Hyatt branding + MyGenie footer logo
- Username/password fields with icons
- Password visibility toggle
- Sign In button with blue hero color
- **POS API Integration DONE** - Authenticates against MyGenie POS API
- Backend proxy endpoint `/api/auth/login` to handle CORS
- Session persistence via localStorage
- Logout button in left sidebar with confirmation dialog

### POS Integration Status
| Feature | Status | Notes |
|---------|--------|-------|
| Login API | ✅ COMPLETE | Authenticates via backend proxy |
| Menu API | ❌ PENDING | Currently hardcoded - awaiting API endpoint |
| Orders API | ❌ PENDING | Orders saved to MongoDB only - awaiting API endpoint |

### UI/UX Features
- 3-column single-screen layout (Categories | Menu | Cart)
- Hyatt Centric Candolim Goa logo branding
- Full-screen table selector (100 tables: 01-100)
- Item customization modal (variations, quantity, cooking instructions)
- Portion size & calories on menu cards
- Allergen tags on menu cards (red badges: Gluten, Dairy, Spicy)
- Customer data capture (Name, Mobile - optional)
- Coupon code system (WELCOME10, FLAT50, HYATT20)
- GST breakdown (CGST 2.5% + SGST 2.5%)
- Order success screen with 15-second countdown
- Auto-redirect to home for next customer
- Visual feedback on menu items in cart (blue border + quantity badge)
- Cooking instructions feature (add/edit/view in modal and cart)

### Kiosk Features
- Elegant touch sounds (5-star hotel quality)
- Sound toggle (on/off) in sidebar
- Kiosk lock mode (blocks shortcuts, fullscreen, no right-click)
- Admin unlock (5 taps on top-left corner)
- Auto-hide cursor after 3 seconds

## Pending: POS Phase 2 Integration (BLOCKED)

### Waiting on User to Provide:
1. **Menu API Endpoint** - To fetch categories and items from POS
2. **Orders API Endpoint** - To send placed orders to POS
3. Sample API response formats for these endpoints

### Current Workaround:
- Menu data is hardcoded in `backend/server.py`
- Orders are saved to MongoDB only

## Backlog Tasks

### P0 - High Priority
- [x] POS Login Integration - COMPLETE
- [ ] POS Menu API Integration - BLOCKED (waiting for API endpoint)
- [ ] POS Order API Integration - BLOCKED (waiting for API endpoint)

### P1 - Medium Priority
- [ ] Receipt printing feature (`window.print()`)

### P2 - Low Priority
- [ ] PWA conversion for offline capabilities

## Key Files
- `/app/frontend/src/pages/LoginPage.js` - Login screen
- `/app/frontend/src/pages/KioskPage.js` - Main kiosk UI
- `/app/frontend/src/contexts/AuthContext.js` - Authentication state (uses POS API)
- `/app/frontend/src/contexts/CartContext.js` - Cart state
- `/app/frontend/src/index.css` - Brand color CSS variables
- `/app/frontend/tailwind.config.js` - Brand color definitions
- `/app/backend/server.py` - API endpoints + POS login proxy

## API Endpoints
- `POST /api/auth/login` - Proxy to POS login API
- `GET /api/menu/categories` - Get menu categories (hardcoded)
- `GET /api/menu/items` - Get menu items (hardcoded)
- `POST /api/orders` - Create new order (MongoDB only)
- `GET /api/config/branding` - Get branding config

## Preview URL
https://hyatt-buffet-order-1.preview.emergentagent.com

## Test Credentials
- **POS Login:** `byakuya@soulking.com` / `Qplazm@10`
- **Coupon Codes:** `WELCOME10` (10% off), `FLAT50` (Rs.50 off), `HYATT20` (20% off)

## Database
- **MongoDB Database:** `test_database`
- **Collections:** `orders` (24 orders as of Feb 20, 2026)

## External APIs
- **POS API Base:** `https://preprod.mygenie.online/api/v1`
- **Login Endpoint:** `/auth/vendoremployee/login`
