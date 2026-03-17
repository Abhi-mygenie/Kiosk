# Kiosk Self-Ordering App - Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Backend API](#backend-api)
5. [Web App (React)](#web-app-react)
6. [Native App (React Native)](#native-app-react-native)
7. [State Management](#state-management)
8. [Authentication Flow](#authentication-flow)
9. [Ordering Flow](#ordering-flow)
10. [Admin Features](#admin-features)
11. [UI/UX Details](#uiux-details)
12. [Build & Deployment](#build--deployment)
13. [Configuration](#configuration)
14. [Security](#security)

---

## Overview

A restaurant self-ordering kiosk application that allows customers to browse menus, customize items, and place orders directly from a tablet or kiosk device. The system integrates with an external POS (Point of Sale) API for real-time menu data, table configuration, and order submission.

**Key Features:**
- Menu browsing with categories, images, and item details
- Item customization (variations, add-ons, cooking instructions)
- Cart management with quantity controls
- Table selection (for restaurants with table service)
- Token-based ordering (for restaurants without tables)
- Admin settings for menu reordering and visibility toggling
- Operating hours with estimated preparation times
- Dual-orientation support (portrait and landscape)
- Admin-only mode with lock/unlock toggle

---

## Architecture

```
+-------------------+      +-------------------+      +-------------------+
|   Web App         |      |   Backend (Proxy)  |      |   POS API         |
|   React + Vite    |----->|   FastAPI          |----->|   mygenie.online  |
|   Port: 3000      |      |   Port: 8001       |      |   (External)      |
+-------------------+      +-------------------+      +-------------------+

+-------------------+
|   Native App      |
|   React Native    |----> (Same Backend API)
|   Android         |
+-------------------+
```

**Data Flow:**
1. Client authenticates via `/api/auth/login` (proxied to POS)
2. Menu, tables, and branding are fetched from POS via backend proxy
3. Orders are submitted to POS via `/api/orders` (buffet-place-order endpoint)
4. All client state (settings, preferences) stored in localStorage/AsyncStorage

**No database is used.** The backend is a stateless proxy with in-memory caching (5-minute TTL).

---

## Project Structure

```
/app
├── backend/
│   ├── server.py              # FastAPI backend (693 lines)
│   ├── .env                   # Backend environment variables
│   └── requirements.txt
│
├── frontend/                  # React Web App
│   ├── src/
│   │   ├── App.js             # Root component, routing, providers
│   │   ├── index.css           # Tailwind CSS + CSS variables
│   │   │
│   │   ├── components/
│   │   │   ├── kiosk/          # Kiosk page components (10 files)
│   │   │   │   ├── CustomizationModal.js
│   │   │   │   ├── SuccessOverlay.js
│   │   │   │   ├── CategoryPills.js
│   │   │   │   ├── InlineCartItem.js
│   │   │   │   ├── CartSectionLandscape.js
│   │   │   │   ├── PortraitMenuCard.js
│   │   │   │   ├── LandscapeMenuCard.js
│   │   │   │   ├── TableSelector.js
│   │   │   │   ├── LogoutConfirmModal.js
│   │   │   │   └── EditInstructionsModal.js
│   │   │   └── ui/             # Shadcn UI components
│   │   │
│   │   ├── contexts/           # React Context providers
│   │   │   ├── AuthContext.js         # Authentication + POS data
│   │   │   ├── CartContext.js         # Shopping cart state
│   │   │   ├── MenuSettingsContext.js # Category/item ordering + visibility
│   │   │   ├── ThemeContext.js        # Branding/theme configuration
│   │   │   └── TimingSettingsContext.js # Operating hours + prep times
│   │   │
│   │   ├── hooks/
│   │   │   ├── useOrientation.js      # Portrait/landscape detection
│   │   │   └── use-toast.js           # Toast notifications
│   │   │
│   │   ├── pages/
│   │   │   ├── KioskPage.js           # Main ordering screen (404 lines)
│   │   │   ├── LoginPage.js           # Authentication screen
│   │   │   ├── AdminSettingsPage.js   # Menu reordering + visibility
│   │   │   └── TimingSettingsPage.js  # Operating hours configuration
│   │   │
│   │   └── utils/
│   │       ├── kioskHelpers.js        # normalizePrice, createAuthAxios
│   │       ├── kioskLock.js           # Fullscreen kiosk mode
│   │       └── touchSound.js          # Touch feedback sounds
│   │
│   └── .env                   # Frontend environment variables
│
├── kiosk-native/              # React Native Android App
│   └── KioskApp/
│       ├── App.js
│       ├── build.sh           # Local build script
│       ├── eas.json           # Expo EAS build config
│       ├── BUILD_GUIDE.md     # Build instructions
│       ├── android/           # Android native project
│       ├── src/
│       │   ├── components/    # 12 reusable components
│       │   ├── contexts/      # 5 context providers (same as web)
│       │   ├── navigation/    # React Navigation config
│       │   ├── pages/         # 5 screens
│       │   ├── theme/         # Colors, spacing, typography
│       │   └── utils/         # API, helpers, storage
│       └── package.json
│
└── .github/
    └── workflows/
        └── build-android.yml  # GitHub Actions CI/CD
```

---

## Backend API

**Base URL:** `/api`  
**Framework:** FastAPI  
**Role:** Stateless proxy to POS API with data transformation and caching

### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/` | No | Health check |
| `POST` | `/api/auth/login` | No | Authenticate via POS |
| `GET` | `/api/menu/categories` | Bearer | Fetch menu categories |
| `GET` | `/api/menu/items` | Bearer | Fetch menu items (optional `?category=ID`) |
| `GET` | `/api/tables` | Bearer | Fetch table configuration |
| `POST` | `/api/orders` | Bearer | Place an order |
| `GET` | `/api/config/branding` | No | Get UI branding config |

### Request/Response Examples

**Login:**
```bash
POST /api/auth/login
Content-Type: application/json

{"email": "manager@hyattcandolim.com", "password": "Qplazm@10"}

# Response:
{"token": "dwag8LYJ...", "role_name": "manager", "role": ["manager"]}
```

**Menu Items:**
```bash
GET /api/menu/items
Authorization: Bearer <token>

# Response: Array of menu items with variations, allergens, calories, etc.
```

**Place Order:**
```bash
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "table_number": "T-1",
  "table_id": "123",
  "items": [
    {
      "item_id": "456",
      "name": "Masala Dosa",
      "price": 200,
      "quantity": 2,
      "variations": ["CHEESE"],
      "grouped_variations": {"FILLING": ["CHEESE"]},
      "special_instructions": "Less spicy"
    }
  ],
  "subtotal": 400,
  "cgst": 10,
  "sgst": 10,
  "total": 420
}
```

### Data Transformation

The backend transforms POS API data into a normalized format:

**POS format** (nested, inconsistent types) -> **App format** (flat, typed):

| POS Field | App Field | Notes |
|-----------|-----------|-------|
| `food.category.id` | `category` | Flattened from nested object |
| `food.variation[]` | `variation_groups[]` | Restructured with group metadata |
| `food.addons[]` | Merged into `variation_groups` | Add-ons become an "ADD-ONS" group |
| `food.kcal` | `calories` | Safely parsed to int |
| `food.complementary` | `is_complementary` | Boolean normalization |
| `food.price` + `discount` + `tax` | `price` | Pre-calculated final price |

### Caching

- Menu data: 5-minute TTL, keyed by auth token
- Table data: 5-minute TTL, keyed by auth token
- Cache invalidates when a different token is used

---

## Web App (React)

### Technology Stack
- **React 18** with functional components and hooks
- **Tailwind CSS** with CSS variables for theming
- **Shadcn/UI** component library
- **Framer Motion** for animations
- **Axios** for HTTP requests
- **Sonner** for toast notifications
- **Lucide React** for icons

### Pages

#### LoginPage
- Email/password authentication
- "Remember Me" stores username only (not password) in localStorage
- Auto-redirects to AdminSettingsPage after login

#### AdminSettingsPage
- Drag-and-drop reordering of categories and items
- Toggle visibility of categories and items
- Settings persisted in localStorage via MenuSettingsContext
- Shown automatically after first login; can be skipped

#### TimingSettingsPage
- Configure up to 4 operating time shifts
- Each shift has: label, start time, end time, estimated prep time
- Current shift auto-detected to display prep time on order confirmation

#### KioskPage (Main Screen)
The primary ordering interface. Supports two layouts:

**Landscape Mode (default for tablets):**
```
+------------------+---------------------------+----------------+
|   Categories     |   Menu Items Grid         |   Cart         |
|   Sidebar        |   (2-4 columns)           |   Panel        |
|                  |                           |                |
|   [Category 1]   |   [Item] [Item] [Item]   |   Your Order   |
|   [Category 2]   |   [Item] [Item] [Item]   |   [Cart Items] |
|   [Category 3]   |   [Item] [Item] [Item]   |   [Totals]     |
|                  |                           |   [Place Order]|
|   [Admin Toggle] |                           |                |
+------------------+---------------------------+----------------+
```

**Portrait Mode (kiosk screens):**
```
+---------------------------------------+
| Logo        [Table] [Admin Controls]  |  <- Header
+---------------------------------------+
| [All] [Cat1] [Cat2] [Cat3] [Cat4]    |  <- Category Pills
+---------------------------------------+
|  [Item] [Item] [Item] [Item] [Item]   |
|  [Item] [Item] [Item] [Item] [Item]   |  <- 5-column grid
|  [Item] [Item] [Item] [Item] [Item]   |
+---------------------------------------+
| YOUR ORDER                            |
| [CartItem1] [CartItem2] [CartItem3]   |  <- Sticky cart
+---------------------------------------+
| [          Place Order          ]     |  <- Fixed bottom
+---------------------------------------+
```

### Components (`/components/kiosk/`)

| Component | Purpose | Key Features |
|-----------|---------|-------------|
| `CustomizationModal` | Item customization | Variations, quantity, cooking instructions. `visualViewport` API for keyboard avoidance |
| `SuccessOverlay` | Order confirmation | Countdown timer, prep time display, token number (no-tables) or table number |
| `CategoryPills` | Horizontal category filter | "All" + category buttons, scrollable |
| `InlineCartItem` | Compact cart item (portrait) | Inline quantity controls, edit instructions icon |
| `CartSectionLandscape` | Full cart panel | Totals with tax, table change, place order button |
| `PortraitMenuCard` | Menu item card (portrait) | Image, name, allergens, calories, in-cart badge |
| `LandscapeMenuCard` | Menu item card (landscape) | Larger layout with description |
| `TableSelector` | Table selection modal | Grid of tables grouped by section |
| `LogoutConfirmModal` | Logout confirmation | Simple confirm/cancel dialog |
| `EditInstructionsModal` | Edit cooking instructions | Bottom sheet with `visualViewport` keyboard handling |

---

## Native App (React Native)

### Technology Stack
- **React Native 0.84.1** (New Architecture supported)
- **React Navigation** for screen navigation
- **Axios** for HTTP requests
- **AsyncStorage** for local persistence
- **react-native-reanimated** for animations
- **react-native-gesture-handler** for touch interactions
- **react-native-safe-area-context** for safe area insets

### Screens

| Screen | File | Description |
|--------|------|-------------|
| Login | `LoginScreen.js` | Authentication with remember-me |
| Loading | `LoadingScreen.js` | Data fetch progress indicator |
| Admin Settings | `AdminSettingsScreen.js` | Menu reordering/visibility |
| Timing Settings | `TimingSettingsScreen.js` | Operating hours config |
| Kiosk | `KioskScreen.js` | Main ordering screen (229 lines) |

### Components (12 files)

| Component | Description |
|-----------|-------------|
| `Header` | App bar with table indicator, admin toggle (lock/unlock) |
| `CategoryPills` | Horizontal scrollable category filters |
| `MenuGrid` | FlatList grid of menu items (5 columns) |
| `MenuItemCard` | Individual menu item card |
| `CartSection` | Cart panel with totals and order button |
| `CustomizationModal` | Item customization with variations |
| `TableSelector` | Table selection grid |
| `SuccessOverlay` | Order confirmation with token/table number |
| `LogoutConfirmModal` | Logout dialog |
| `EditInstructionsModal` | Bottom sheet for cooking instructions |
| `LoginProgressOverlay` | Login loading state |

### Feature Parity with Web App
Both platforms support identical features:
- Login with remember-me (username only)
- Admin settings with drag-and-drop
- Timing settings with prep time
- No-tables flow with token numbers
- Admin toggle (lock/unlock)
- Edit cooking instructions from cart
- 5-column grid, continuous "All" view

---

## State Management

All state is managed via React Context API:

### AuthContext
```
State: { user, isAuthenticated, isLoading, menuData }
menuData: { categories, menuItems, tables }
```
- Handles login/logout
- Fetches menu, items, and tables after authentication
- Stores auth token in sessionStorage (web) / AsyncStorage (native)

### CartContext
```
State: { cart, addToCart, removeFromCart, updateQuantity, updateInstructions, clearCart, getTotal }
```
- Manages shopping cart items
- Each cart item has a unique `cartId` (supports same item with different variations)
- Persists in memory (clears on order or logout)

### MenuSettingsContext
```
State: { categoryOrder, itemOrder, hiddenCategories, hiddenItems, settingsComplete }
```
- Controls category/item display order and visibility
- Persisted in localStorage/AsyncStorage
- `applySettings()` transforms raw menu data into ordered/filtered data

### TimingSettingsContext
```
State: { shifts: [{ label, startTime, endTime, prepTime }] }
```
- Up to 4 operating time shifts
- `getCurrentPrepTime()` returns prep time for the current shift
- Persisted in localStorage/AsyncStorage

### ThemeContext
```
State: { branding: BrandingConfig }
```
- Fetches branding configuration from `/api/config/branding`
- Applies CSS variables for fonts, colors, border-radius

---

## Authentication Flow

```
1. User enters email + password on LoginPage
2. POST /api/auth/login -> POS API proxy
3. Backend returns JWT token
4. Token stored in AuthContext (sessionStorage for persistence)
5. AuthContext fetches menu data using token:
   - GET /api/menu/categories
   - GET /api/menu/items
   - GET /api/tables
6. All subsequent API calls include: Authorization: Bearer <token>
7. On logout: token cleared, cart cleared, settings reset
```

**Test Accounts:**
| Account | Email | Password | Tables |
|---------|-------|----------|--------|
| Hyatt Centric | `manager@hyattcandolim.com` | `Qplazm@10` | Yes |
| Kunafa Mahal | `owner@kunafamahal.com` | `Qplazm@10` | No |

---

## Ordering Flow

```
1. Customer selects a menu item
2. CustomizationModal opens:
   - Choose variations (single/multiple, required/optional)
   - Set quantity
   - Add cooking instructions
3. Item added to cart
4. Repeat for more items
5. Review cart (edit quantities, instructions)
6. Select table (if restaurant has tables) or skip
7. Place Order -> POST /api/orders
8. Backend sends to POS API (buffet-place-order endpoint)
9. SuccessOverlay shows:
   - With tables: "Please proceed to Table X"
   - Without tables: "Your token number: XXX"
   - Estimated prep time from current shift
   - 15-second auto-redirect to new order
```

### Tax Calculation
```
Subtotal = sum(item.price * item.quantity)
CGST = Subtotal * 2.5%
SGST = Subtotal * 2.5%
Grand Total = Subtotal + CGST + SGST
```

### Price Normalization
Items with `price === 1` are treated as complimentary (displayed as free). This is handled by `normalizePrice()` in `kioskHelpers.js`.

---

## Admin Features

### Admin Mode Toggle
- Controlled by a lock/unlock icon (subtle, low opacity)
- **Locked (default):** Admin controls hidden; safe for customer-facing kiosk
- **Unlocked:** Shows Menu Settings, Timing, Sound, Logout buttons
- Location: Bottom of sidebar (landscape), top-right header (portrait)

### Menu Settings (AdminSettingsPage)
- **Reorder categories:** Drag-and-drop to change display order
- **Reorder items within categories:** Drag-and-drop per category
- **Hide/show categories:** Toggle switch per category
- **Hide/show items:** Toggle switch per item
- All settings stored in localStorage, applied via `MenuSettingsContext.applySettings()`

### Timing Settings (TimingSettingsPage)
- Define up to 4 operating shifts
- Each shift: Label (e.g., "Breakfast"), Start Time, End Time, Prep Time (minutes)
- Current shift's prep time shown on order confirmation screen
- Stored in localStorage via `TimingSettingsContext`

---

## UI/UX Details

### Design System
- **Primary Color:** `#177DAA` (Blue Hero)
- **Secondary Color:** `#62B5E5` (Blue Light)
- **Dark Color:** `#06293F` (Blue Dark)
- **Background:** `hsl(40, 20%, 97%)` / `#F9F8F6` (Warm off-white)
- **Heading Font:** Big Shoulders Display
- **Body Font:** Montserrat
- **Component Library:** Shadcn/UI with custom theming

### Responsive Design
The app detects orientation via `useOrientation` hook and renders completely different layouts:

| Feature | Portrait | Landscape |
|---------|----------|-----------|
| Categories | Horizontal pills | Vertical sidebar |
| Menu Grid | 5 columns | 2-4 columns |
| Cart | Sticky bottom section | Right panel |
| Menu Card | Compact with square image | Larger with description |
| "All" View | Continuous scroll (no headers) | Continuous scroll |

### Keyboard Handling
Both `CustomizationModal` and `EditInstructionsModal` use the `visualViewport` API to detect keyboard open/close and dynamically reposition above the keyboard. This prevents the common issue of on-screen keyboards hiding input fields on tablet devices.

### Kiosk Lock Mode
`kioskLock.js` enables fullscreen kiosk mode:
- Prevents back/refresh navigation
- Locks to fullscreen
- Admin unlock via triple-tap + confirmation

---

## Build & Deployment

### Web App
```bash
# Development (auto-starts via supervisor)
cd /app/frontend
yarn start        # Port 3000

# Production build
yarn build
```

### Android APK (3 options)

#### Option 1: GitHub Actions (Automated)
- Push to GitHub -> APK built automatically
- Workflow: `.github/workflows/build-android.yml`
- Download from Actions -> Artifacts

#### Option 2: Local Build
```bash
cd kiosk-native/KioskApp
chmod +x build.sh
./build.sh          # Release APK
./build.sh debug    # Debug APK
```
**Requirements:** JDK 17, Node 18+, Android SDK (android-36, build-tools 36.0.0, NDK 27.1.12297006)

#### Option 3: EAS Build (Expo Cloud)
```bash
npm install -g eas-cli
eas login
cd kiosk-native/KioskApp
eas build --platform android --profile preview
```

### Backend
```bash
# Auto-starts via supervisor on port 8001
# Restart: sudo supervisorctl restart backend
```

---

## Configuration

### Backend Environment (`/app/backend/.env`)
| Variable | Description |
|----------|-------------|
| `POS_API_BASE_URL` | POS API v1 base URL |
| `POS_API_V2_URL` | POS API v2 base URL |
| `POS_RESTAURANT_ID` | Restaurant ID for order submission |
| `POS_RESTAURANT_NAME` | Restaurant name |
| `CORS_ORIGINS` | Allowed CORS origins |
| `MONGO_URL` | MongoDB URL (unused, preserved for config) |
| `DB_NAME` | Database name (unused, preserved for config) |

### Frontend Environment (`/app/frontend/.env`)
| Variable | Description |
|----------|-------------|
| `REACT_APP_BACKEND_URL` | Backend API URL |

---

## Security

### Implemented
- **No plaintext password storage:** "Remember Me" stores username only (not password)
- **Backend secrets in .env:** POS API URLs and credentials moved from source code to environment variables
- **Token-based auth:** All API calls require Bearer token
- **CORS configured:** Controlled via environment variable
- **Admin controls hidden:** Lock/unlock toggle prevents customer access to admin functions

### Authentication
- Tokens provided by external POS API
- Stored in sessionStorage (web) for session persistence
- Cleared on logout or browser close
- No refresh token mechanism (re-login required when token expires)
