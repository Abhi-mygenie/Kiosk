# Self-Ordering Kiosk - Hotel Lumiere Breakfast Buffet

## Original Problem Statement
Build a self-ordering kiosk application for a 5-star hotel's breakfast buffet. The app should run on 21.5-inch and 32-inch Android kiosks (1920x1080 resolution) with minimal clicks as a high priority.

## Core Requirements
- **Platform:** React web app for Kiosk (fullscreen browser mode)
- **Target Device:** 21.5-inch Kiosk, 1920x1080 resolution
- **User Flow:** Minimal clicks - browse, customize, add to cart, select table, place order
- **Menu Categories:** DOSA, EGG, PARATHA, WAFFLES
- **Item Details:** Calorie count, portion size (gm/ml), allergen information
- **Customization:** Variations (e.g., PLAIN, BUTTER, CHEESE), add-ons, special instructions
- **Currency:** Indian Rupees (₹)
- **Brand Colors:**
  - Hero: #62B5E5
  - Light Accent: #78CAFF
  - Medium Accent: #177DAA
  - Dark Accent: #06293F

## What's Been Implemented

### Backend (FastAPI + MongoDB)
- `/api/menu/categories` - Get menu categories
- `/api/menu/items` - Get menu items by category
- `/api/orders` - Create new order (saves to MongoDB)
- `/api/config/branding` - Get UI branding config
- Hardcoded menu data with variations, allergens, calories, portion sizes

### Frontend (React + Tailwind CSS)
- **HomePage:** Menu browsing with category sidebar
- **MenuItemCard:** Shows item with price, calories, portion, allergens
- **CustomizationModal:** Select variations, quantity, special instructions
- **CartPage:** View cart, select table number, place order
- **Success Screen:** Order confirmation with 15-second countdown timer
- **NumberPad:** Touch-friendly table number input
- **CartContext:** Global state management for shopping cart

### UI/UX
- Custom blue theme matching brand colors
- Elegant, minimal, luxury design
- Touch-optimized for kiosk use
- Responsive animations with Framer Motion

## Completed Tasks (Feb 2025)
- [x] Set up full-stack architecture (React + FastAPI + MongoDB)
- [x] Implemented menu browsing with categories
- [x] Created customization modal with variations and add-ons
- [x] Built cart page with table selection
- [x] Removed extra review screen (minimal clicks)
- [x] Added order confirmation screen
- [x] **Implemented 15-second countdown timer on success screen**
- [x] Auto-redirect to home after countdown

## Known Issues
- **P1 - Intermittent Order Placement Failure:** Previously reported but testing shows API is stable (5/5 tests passed)

## Backlog / Future Tasks
- **P1:** POS system integration (awaiting API details from user)
- **P2:** Move hardcoded menu to MongoDB for dynamic updates
- **P3:** Receipt printing for kiosk thermal printer
- **SKIPPED:** Razorpay payment integration (user requested to skip)

## Tech Stack
- **Frontend:** React, React Router, Tailwind CSS, Framer Motion, Axios
- **Backend:** FastAPI, Pydantic, Motor (async MongoDB)
- **Database:** MongoDB

## File Structure
```
/app/
├── backend/
│   ├── server.py          # API endpoints, menu data
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── HomePage.js
    │   │   └── CartPage.js (includes success screen)
    │   ├── components/
    │   │   ├── menu/MenuItemCard.js
    │   │   ├── layout/SidebarNav.js
    │   │   └── ui/NumberPad.js
    │   └── contexts/CartContext.js
    ├── tailwind.config.js
    └── package.json
```

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/menu/categories | Get all menu categories |
| GET | /api/menu/items?category=dosa | Get items by category |
| POST | /api/orders | Create new order |
| GET | /api/config/branding | Get UI branding config |
