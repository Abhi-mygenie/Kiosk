# Self-Ordering Kiosk - Hyatt Centric Candolim Goa

## Original Problem Statement
Build a self-ordering kiosk application for a 5-star hotel's breakfast buffet. Target device: 21.5" Windows kiosk (Core i3, 8GB RAM, 1920x1080 touch screen).

## Current Status: MVP COMPLETE + Login System + Brand Styling Applied

## Tech Stack
- **Frontend:** React Web App (runs in Chrome kiosk mode)
- **Backend:** FastAPI + MongoDB
- **Deployment:** Windows kiosk with Chrome fullscreen

## Brand Guidelines Applied (Feb 20, 2025)

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

### Authentication
- Clean login page with Hyatt branding + MyGenie footer logo
- Username/password fields with icons
- Password visibility toggle
- Sign In button with blue hero color
- Session persistence until manual logout
- Logout button in left sidebar with confirmation dialog
- Mock authentication ready for POS API integration

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

## Pending: POS API Integration

### What Will Be Connected:
1. **Login API** - Authenticate kiosk users
2. **Menu API** - Fetch categories and items
3. **Settings API** - Fetch kiosk configuration
4. **Orders API** - Send placed orders to POS

### Details Needed from User:
1. POS API Base URL
2. Authentication method (API Key / OAuth / Basic Auth)
3. Login Endpoint
4. Menu Endpoint
5. Order Endpoint
6. Sample API response formats

## Backlog Tasks

### P0 - High Priority
- [ ] POS API integration - BLOCKED waiting for API credentials

### P1 - Medium Priority
- [ ] Thermal receipt printing for Windows kiosk

### P2 - Low Priority
- [ ] Move hardcoded menu to MongoDB (if no POS)
- [ ] Offline mode / PWA (later)

## Key Files
- `/app/frontend/src/pages/LoginPage.js` - Login screen
- `/app/frontend/src/pages/KioskPage.js` - Main kiosk UI
- `/app/frontend/src/contexts/AuthContext.js` - Authentication state
- `/app/frontend/src/contexts/CartContext.js` - Cart state
- `/app/frontend/src/index.css` - Brand color CSS variables
- `/app/frontend/tailwind.config.js` - Brand color definitions
- `/app/backend/server.py` - API endpoints

## Preview URL
https://hyatt-buffet-order.preview.emergentagent.com

## Hardware Confirmed
- 21.5" Touch Screen Kiosk
- Core i3, 8GB RAM, 128GB mSATA
- Windows OS
- Web app in Chrome kiosk mode (NOT React Native)

## Test Credentials
- **Login:** Any username/password (mock auth - will connect to POS later)
- **Coupon Codes:** `WELCOME10` (10% off), `FLAT50` (Rs.50 off), `HYATT20` (20% off)
