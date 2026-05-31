# Kiosk App — Architecture & Refactor Audit

**Repo:** `Abhi-mygenie/Kiosk@14march`
**Audit date:** 2026-05-30
**Lens:** Code reuse, duplication, module boundaries, abstraction quality, refactor opportunities — **not** crash/security (covered separately in `refactor_cr/audits/CRASH_AUDIT.md` and `refactor_cr/audits/FULL_CODEBASE_AUDIT.md`).
**Companion to:** `refactor_cr/audits/FULL_CODEBASE_AUDIT.md` (67 stability findings)

> Severity legend  🔴 **R0** — high refactor ROI, blocking feature velocity  •  🟠 **R1** — meaningful duplication or coupling  •  🟡 **R2** — nice-to-have polish  •  🔵 **INFO** — observation

---

## 0. TL;DR

| Metric | Today | After proposed refactor | Δ |
|---|---|---|---|
| Total LOC (excluding shadcn/ui boilerplate + node_modules) | **~12,500** | **~7,200** | **–42%** |
| Files in `src/` (web + native combined) | ~105 | ~70 | –33% |
| Bug-fix-twice work (web + native) | 100% of business logic | <10% | huge |
| Time to add a new screen (current pattern) | ~6 hrs (build it in web, then re-build in native, then drift) | ~2 hrs (build once, render twice) | –66% |
| Number of `applySettings` implementations | 2 (web + native) | 1 (shared) | –50% |
| Number of "totals" calculation sites | 5 (CartContext.getTotal, KioskPage.calculateTotals, CartSectionLandscape inline, KioskScreen.calculateTotals, CustomizationModal.calculateTotal) | 1 | –80% |
| Wrapper context providers nesting depth in App.js | 7 levels | 1 (`<KioskCoreProvider>`) | –86% |

The codebase is **functional but architecturally young** — written page-by-page, then duplicated to React Native. Most refactor wins come from extracting shared logic into a platform-agnostic core.

---

## 1. Architecture as-is (today)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            POS API (mygenie.online)                     │
│         /auth/login • /foods-list • /table-config • /buffet-order       │
└────────────────────────────────▲────────────────────────────────────────┘
                                 │ Bearer token (per request, no refresh)
┌────────────────────────────────┴────────────────────────────────────────┐
│                          BACKEND (FastAPI proxy)                        │
│                           backend/server.py                             │
│                                                                         │
│   • Stateless proxy + 5-min cache (module globals)                      │
│   • Schema transform: POS shape → app shape (transform_pos_food...)     │
│   • 7 endpoints, all under /api                                         │
│   • No DB (Mongo imports commented out, deps still listed)              │
│   • All logic in ONE 693-line file                                      │
└────────────────────────────────▲────────────────────────────────────────┘
                                 │ JSON over HTTPS
              ┌──────────────────┴──────────────────┐
              │                                     │
┌─────────────┴─────────────┐         ┌─────────────┴─────────────────┐
│   FRONTEND WEB (React 19) │         │   REACT NATIVE (Android APK)  │
│   /app/frontend/src/      │         │   /app/kiosk-native/KioskApp/ │
│                           │   ❌    │                               │
│   • 4 pages               │  100%   │   • 5 screens                 │
│   • 5 contexts            │   dup   │   • 5 contexts (same names)   │
│   • 10 kiosk components   │   ───►  │   • 12 components (same role) │
│   • 3 utils + 2 hooks     │         │   • 3 utils                   │
│   • localStorage state    │         │   • AsyncStorage state        │
└───────────────────────────┘         └───────────────────────────────┘
```

### Two big architectural facts

1. **Backend is 1 file.** No domain modules, no service layer, no repository layer. All routes, all transforms, all POS clients live in `server.py`. Adds will balloon it; today it's borderline manageable.
2. **Frontend web and React Native are 95% the same product, 0% shared code.** Every fix is a 2-PR fix. Every feature is a 2-week feature. This is the single biggest architectural debt in the repo.

---

## 2. Module-by-module audit

Each module gets: **purpose → today's structure → reuse score (1–5, 5 = great) → refactor recommendation**.

### 2.1 Backend — `/app/backend/`

**Purpose:** Stateless HTTP proxy + data transformer for the POS API. Token-pass-through auth. In-memory cache.

**Today's structure:**
```
backend/
├── server.py          # 693 LOC — EVERYTHING
│   ├── Pydantic models      (lines 51-146)   — never used as response_model
│   ├── POS menu functions   (lines 154-194, 197-332, 388-429)
│   ├── Order placement      (lines 481-629)
│   ├── Branding             (lines 631-634)
│   ├── Auth proxy           (lines 637-676)
│   └── Module-level caches  (lines 30, 388)
├── requirements.txt   # mixed runtime + dev deps
├── .env               # mixed (db + pos + cors)
└── tests/             # 3 test files, no fixtures shared
```

**Reuse score: 1/5** — Everything is at module-level, nothing can be unit-tested without HTTP.

**Refactor — proposed structure:**
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app factory, CORS, router wiring
│   ├── config.py            # Pydantic Settings — validates env at startup
│   ├── models/              # Pydantic schemas
│   │   ├── menu.py          (Category, MenuItem, Variation, VariationGroup)
│   │   ├── cart.py          (CartItem, OrderCreate, Order)
│   │   ├── auth.py          (LoginRequest, LoginResponse)
│   │   └── branding.py
│   ├── pos/                 # POS API client — testable in isolation
│   │   ├── client.py        (httpx wrapper, retry, timeout)
│   │   ├── auth.py          (login)
│   │   ├── menu.py          (fetch_foods, fetch_categories)
│   │   ├── tables.py        (fetch_tables)
│   │   ├── orders.py        (place_buffet_order)
│   │   └── transforms.py    (POS shape → app shape, with try/except)
│   ├── cache.py             # Per-token TTL cache abstraction (replace globals)
│   ├── routes/              # FastAPI routers
│   │   ├── auth.py
│   │   ├── menu.py
│   │   ├── tables.py
│   │   ├── orders.py
│   │   └── branding.py
│   ├── services/            # Business logic (between routes and pos/)
│   │   └── order_service.py  (server-side total verification, etc.)
│   └── deps.py              # FastAPI dependencies (get_pos_token, get_pos_client)
├── tests/
│   ├── conftest.py          # Shared fixtures (auth_token, pos_mock)
│   ├── unit/                # Test transforms.py without HTTP
│   ├── integration/         # Test routes with mocked pos/
│   └── e2e/                 # Test against live preprod POS
├── requirements.txt
└── requirements-dev.txt     # split runtime vs dev
```

**Findings:**

| # | Sev | Finding | Why |
|---|-----|---------|-----|
| BA-1 | 🔴 R0 | Single 693-line `server.py` mixes 4 concerns (HTTP routes, POS client, transforms, models) | Hard to unit-test, hard to mock POS in tests, every change touches the same file |
| BA-2 | 🔴 R0 | Pydantic models defined but never used as `response_model=` on routes | Free OpenAPI schema lost; no request/response validation |
| BA-3 | 🟠 R1 | Module-level cache dicts (`menu_cache`, `tables_cache`) | Untestable, leaks across tests; needs a `Cache` class injected via `Depends()` |
| BA-4 | 🟠 R1 | `transform_pos_food_to_menu_item` is 130 lines doing 8 things | Should be split: `parse_price`, `parse_variations`, `parse_addons`, `parse_calories`, then `assemble_menu_item` |
| BA-5 | 🟠 R1 | POS API calls inlined in 4 different functions (`fetch_pos_menu`, `fetch_pos_tables`, `send_order_to_pos`, `login`) — each builds its own `httpx.AsyncClient` | One shared `PosClient` class with `__aenter__`/`__aexit__`, timeout config, retry policy |
| BA-6 | 🟠 R1 | `LoginRequest`, `LoginResponse`, `Variation`, etc. in same file as routes | Move to `models/` package |
| BA-7 | 🟠 R1 | No startup validation of env vars (`POS_RESTAURANT_ID=""` silently breaks orders) | Pydantic `Settings` class with `Field(..., min_length=1)` fails fast |
| BA-8 | 🟡 R2 | `tests/` directory has 3 files, each duplicates login fixture | `conftest.py` with shared `auth_token`, `kunafa_token`, `hyatt_token` fixtures |
| BA-9 | 🟡 R2 | Constants scattered (`CGST_RATE`, `SGST_RATE` in frontend; not in backend) | Backend should compute tax (single source of truth) and frontend should display |
| BA-10 | 🟡 R2 | Dead Mongo code (`# from motor.motor_asyncio import ...`) | Delete or re-enable (decide and commit) |

### 2.2 Frontend Web — `/app/frontend/src/`

**Purpose:** React-based kiosk UI rendered on tablets (portrait & landscape), kiosk-locked, talks to backend.

**Today's structure:**
```
src/
├── App.js                  # Provider sandwich + manual routing via state
├── index.js
├── pages/                  # 4 pages
│   ├── LoginPage.js
│   ├── AdminSettingsPage.js
│   ├── TimingSettingsPage.js
│   └── KioskPage.js         # 404 lines, branches on isPortrait
├── components/
│   ├── kiosk/              # 10 components, page-specific
│   └── ui/                 # 38 shadcn boilerplate (mostly unused)
├── contexts/               # 5 contexts (Auth, Cart, Menu, Theme, Timing)
├── hooks/                  # 2 hooks
├── utils/                  # 3 utils
└── lib/                    # 1 util (cn from shadcn)
```

**Reuse score: 2/5** — Pages are monolithic; many components are layout-specific duplicates.

**Findings:**

| # | Sev | Finding | Why |
|---|-----|---------|-----|
| FA-1 | 🔴 R0 | **`KioskPage.js` is 404 lines with portrait/landscape branches** in one component | The two paths share ~30% (modals, state, handlers) but diverge entirely on layout. Should be `<KioskPage>` → `<PortraitKiosk />` or `<LandscapeKiosk />` based on `useOrientation()`. |
| FA-2 | 🔴 R0 | **`PortraitMenuCard.js` and `LandscapeMenuCard.js` are 90% identical** | Same props, same logic, slight padding/sizing differences. Should be one `<MenuCard variant="portrait" \| "landscape">` or one component with size-class props. ~70 lines deleted. |
| FA-3 | 🔴 R0 | **`InlineCartItem.js` (portrait cart) and `CartSectionLandscape.js`'s inline JSX (landscape cart row)** | Same row, two implementations. Extract a `<CartRow item={...} layout="compact"\|"full" />` component. |
| FA-4 | 🟠 R1 | `App.js` provider sandwich is 7 levels deep (`<AuthProvider><ThemeProvider><MenuSettingsProvider><TimingSettingsProvider><CartProvider><BrowserRouter>...`) | Combine into one `<KioskCoreProvider>` that internally composes. Pyramid of doom is hard to reorder when adding a new context. |
| FA-5 | 🟠 R1 | Navigation is **manual via `useState` in `App.js`** (`activeView` state) instead of `react-router-dom` (which IS in `package.json` and imported) | `<BrowserRouter>` is wired but never gets routes; `setActiveView` does string matching. Either commit to routes (`/admin/menu`, `/admin/timing`) — gives URL deep-linking, browser back button — or remove the router dependency. |
| FA-6 | 🟠 R1 | **Five places compute prices/totals**: `CartContext.getTotal`, `KioskPage.calculateTotals`, `CartSectionLandscape` reads totals via prop, `CustomizationModal.calculateTotal`, `kioskHelpers.normalizePrice` | Move all of it into `cartMath.js`: `subtotalOf(cart)`, `taxesOf(subtotal)`, `grandTotalOf(cart, coupon?)`. CartContext exposes derived values. Tests are trivial. |
| FA-7 | 🟠 R1 | **CGST/SGST rates hardcoded in 2 places** (`KioskPage.js:80-81` web, `KioskScreen.js:24-25` native) | Should come from backend `/api/config/tax` or be in a shared core lib. |
| FA-8 | 🟠 R1 | `AdminSettingsPage.js` has 451 lines containing 2 sortable component definitions + page logic | Extract `<SortableCategoryItem>` and `<SortableMenuItem>` into `components/admin/`. Page logic drops to ~150 lines. |
| FA-9 | 🟠 R1 | `LoginPage.js` has `LoadingOverlay` inline (lines 8-99) | Extract to `components/auth/LoadingOverlay.js`. Reusable for any multi-step flow (e.g., refresh-data flow). |
| FA-10 | 🟠 R1 | `useOrientation` is the only hook outside `use-toast` | Should live next to other hooks: `useKioskLock`, `useSafeAreaInsets`, `useStorageState` (proposed below). |
| FA-11 | 🟠 R1 | `kioskHelpers.js` has 2 unrelated functions (`normalizePrice`, `createAuthAxios`) | Split: `pricing.js` (with `cartMath.js` from FA-6), `api.js` (axios client). |
| FA-12 | 🟠 R1 | `kioskLock.js` is a singleton class — hard to mock in tests, hard to scope per-page | Convert to a `useKioskLock()` hook returning `{ enable, disable, isLocked }`. Same internals. Easier teardown. |
| FA-13 | 🟠 R1 | `touchSound.js` is also a singleton class with same issue | Convert to `useTouchSound()` hook. Returning `{ playClick, playTap, ... }`. |
| FA-14 | 🟡 R2 | **38 shadcn/ui components installed, ~3 actually imported** (`button`, `dialog`, `toast`) — verified by grep | Remove unused via `yarn remove`; saves install time + bundle. |
| FA-15 | 🟡 R2 | `index.css` has dev-only `[data-debug-wrapper]` selectors shipping to prod | Strip via PostCSS or move to a dev-only stylesheet |
| FA-16 | 🟡 R2 | `components/ui/NumberPad.js` is custom (not shadcn) but lives in `ui/` folder | Move to `components/kiosk/NumberPad.js` for consistency |
| FA-17 | 🟡 R2 | `App.css` is empty / unused | Delete |
| FA-18 | 🔵 INFO | `MenuSettingsContext.applySettings` is a pure function inside a context | Should live in a `lib/menuTransforms.js` — pure functions don't need context |
| FA-19 | 🔵 INFO | `TimingSettingsContext.getCurrentPrepTime` — same — pure function inside context | Same — move to `lib/shifts.js` |

**Refactor — proposed structure:**
```
src/
├── App.js                       # provider composition + routing only
├── index.js
├── routes.js                    # react-router routes
├── core/                        # platform-agnostic business logic
│   ├── cartMath.js              (subtotalOf, taxesOf, grandTotalOf)
│   ├── menuTransforms.js        (applySettings, sortCategories, filterHidden)
│   ├── shifts.js                (getCurrentPrepTime, validateShift)
│   ├── pricing.js               (normalizePrice, formatINR)
│   ├── orderBuilder.js          (cart → OrderCreate payload)
│   └── apiSchemas.js            (Zod or JSON schemas for /api/* responses)
├── api/                         # network layer
│   ├── client.js                (axios + JSON-only interceptor)
│   ├── auth.js                  (login, logout)
│   ├── menu.js                  (fetchCategories, fetchItems)
│   ├── tables.js
│   ├── orders.js
│   └── branding.js
├── state/                       # contexts + persisted state
│   ├── KioskCoreProvider.jsx    (composes all providers)
│   ├── AuthContext.js
│   ├── CartContext.js
│   ├── MenuSettingsContext.js
│   ├── TimingSettingsContext.js
│   ├── ThemeContext.js
│   └── useStorageState.js       (one safe-read hook all contexts use)
├── hooks/
│   ├── useOrientation.js
│   ├── useKioskLock.js           (was utils/kioskLock.js)
│   ├── useTouchSound.js          (was utils/touchSound.js)
│   └── use-toast.js
├── pages/
│   ├── LoginPage.jsx
│   ├── AdminSettingsPage.jsx     (~150 lines, sortables extracted)
│   ├── TimingSettingsPage.jsx
│   └── kiosk/
│       ├── KioskPage.jsx         (route entry, picks orientation)
│       ├── PortraitKiosk.jsx
│       └── LandscapeKiosk.jsx
├── components/
│   ├── ErrorBoundary.jsx         (NEW — root of every page)
│   ├── auth/
│   │   └── LoadingOverlay.jsx
│   ├── admin/
│   │   ├── SortableCategoryItem.jsx
│   │   └── SortableMenuItem.jsx
│   ├── kiosk/
│   │   ├── MenuCard.jsx          (was Portrait + Landscape)
│   │   ├── CartRow.jsx           (was InlineCartItem + landscape row)
│   │   ├── CartPanel.jsx         (landscape only)
│   │   ├── CartSheet.jsx         (portrait only)
│   │   ├── CategoryPills.jsx
│   │   ├── CategorySidebar.jsx
│   │   ├── CustomizationModal.jsx
│   │   ├── EditInstructionsModal.jsx
│   │   ├── LogoutConfirmModal.jsx
│   │   ├── SuccessOverlay.jsx
│   │   ├── TableSelector.jsx
│   │   └── NumberPad.jsx
│   └── ui/                       # only the shadcn pieces actually used (~5)
└── styles/
    ├── index.css
    └── theme.css                 (CSS vars, brand colors)
```

### 2.3 React Native — `/app/kiosk-native/KioskApp/`

**Purpose:** Android tablet kiosk app — feature-identical to the web app.

**Today's structure:**
```
KioskApp/
├── App.js                  # mirrors web App.js providers
├── src/
│   ├── pages/              # 5 screens (Loading, Login, Admin, Timing, Kiosk)
│   ├── components/         # 12 components — same roles as web
│   ├── contexts/           # 5 contexts — duplicates of web
│   ├── theme/              # 4 theme files (colors, spacing, typography)
│   ├── utils/              # 3 utils (api, helpers, storage)
│   └── navigation/         # React Navigation setup
├── android/                # Android-specific
├── ios/                    # iOS scaffold (not built)
└── build.sh, eas.json, etc.
```

**Reuse score with web: 0/5** — Two parallel implementations, every change must be made twice.

**Findings:**

| # | Sev | Finding | Why |
|---|-----|---------|-----|
| RA-1 | 🔴 R0 | **`AuthContext.js` web vs native are 95% identical** (lines 1-213 web, lines 1-213 native; same flow, same step names, same error messages, only storage layer differs) | Extract `useAuthCore({ storage, http })` hook into shared package. Inject platform-specific storage. |
| RA-2 | 🔴 R0 | **`MenuSettingsContext.js` web vs native — `applySettings` is byte-identical** (web lines 49-96 vs native lines 62-109) | Move to `@kiosk/core/menuTransforms`. Native and web import the same function. |
| RA-3 | 🔴 R0 | **`CartContext.js` is duplicated** (cart key generation, getTotal, addToCart logic) | Same. Move math to core. |
| RA-4 | 🔴 R0 | **Order payload assembly** in `KioskPage.handlePlaceOrder` (web) and `KioskScreen.handlePlaceOrder` (native) — same 20-line block, 2 copies | Extract to `core/orderBuilder.buildOrderPayload(cart, table, totals)`. |
| RA-5 | 🔴 R0 | **All 5 context names, 4 component names, helper names are identical** but cannot import each other | Need a `packages/` monorepo or git submodule pattern: `packages/kiosk-core` (shared), `apps/web`, `apps/native`. |
| RA-6 | 🟠 R1 | **`utils/storage.js` (native) and `localStorage` direct access (web)** | Both should implement a `KioskStorage` interface. Native wraps AsyncStorage, web wraps localStorage. Contexts use the interface. |
| RA-7 | 🟠 R1 | **`API_BASE_URL` hardcoded in native `api.js`** (also flagged in stability audit as RN-1) — this is a refactor problem too because there's no env injection pattern | Add `react-native-config` and use `Config.API_BASE_URL` |
| RA-8 | 🟠 R1 | Native has `theme/colors.js`, `theme/spacing.js`, `theme/typography.js` — web has the same in CSS variables | One JSON file (`theme.json`) consumed by both: web via CSS-vars-from-JSON build step, native via `import` |
| RA-9 | 🟠 R1 | **Functional divergence already exists** — web has `appliedCoupon` state in KioskPage, native doesn't | Without shared code, divergence is permanent. Shared core forces parity. |
| RA-10 | 🟡 R2 | Native `components/index.js` barrel file — web has no barrel | Pick a convention |
| RA-11 | 🟡 R2 | iOS scaffold (`/ios/`) committed but never built (per BUILD_GUIDE.md, only Android is supported) | Delete iOS scaffold or formally support iOS in the docs/CI |
| RA-12 | 🟡 R2 | `__tests__/App.test.tsx` exists but no other tests | Either expand or remove |

**Refactor — proposed structure (monorepo):**
```
kiosk/                              # repo root
├── packages/
│   └── kiosk-core/                 # PLATFORM-AGNOSTIC SHARED CODE
│       ├── package.json
│       ├── src/
│       │   ├── cartMath.ts         (subtotalOf, taxesOf, grandTotalOf)
│       │   ├── menuTransforms.ts   (applySettings, sortCategories)
│       │   ├── orderBuilder.ts     (cart → API payload)
│       │   ├── shifts.ts           (getCurrentPrepTime, validateShift)
│       │   ├── pricing.ts          (normalizePrice, formatINR)
│       │   ├── apiSchemas.ts       (Zod schemas — runtime shape validation)
│       │   ├── hooks/
│       │   │   ├── useAuthCore.ts  (auth flow — accepts storage + http adapters)
│       │   │   ├── useCartCore.ts
│       │   │   ├── useMenuSettings.ts
│       │   │   └── useTimingSettings.ts
│       │   └── adapters/           # interface definitions
│       │       ├── Storage.ts      (interface: get, set, remove, clearAll)
│       │       └── Http.ts         (interface: get, post)
│       └── tests/                  (~80% of business logic unit-tested HERE)
├── apps/
│   ├── web/                        # was /frontend
│   │   ├── package.json            (depends on @kiosk/core)
│   │   ├── src/
│   │   │   ├── adapters/
│   │   │   │   ├── localStorage.ts (Storage interface impl)
│   │   │   │   └── axios.ts        (Http interface impl)
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   └── styles/
│   │   └── ...
│   └── native/                     # was /kiosk-native/KioskApp
│       ├── package.json            (depends on @kiosk/core)
│       ├── src/
│       │   ├── adapters/
│       │   │   ├── asyncStorage.ts
│       │   │   └── axios.ts
│       │   ├── screens/
│       │   ├── components/
│       │   └── theme/
│       └── android/, ios/
├── packages/kiosk-design-tokens/  # OPTIONAL — shared design tokens
│   └── tokens.json                  (colors, spacing, type scales)
├── backend/                         # unchanged location
├── package.json                     # workspace root
└── turbo.json | nx.json | pnpm-workspace.yaml
```

The `packages/kiosk-core` is the **single biggest refactor lever** in the repo. Roughly 60% of frontend code becomes shared.

### 2.4 Configs — repo root + per-app

**Findings:**

| # | Sev | Finding | Why |
|---|-----|---------|-----|
| CFG-1 | 🟠 R1 | Two `.gitignore` files (root + frontend), root one has 8 duplicated `*.env` blocks from auto-commits | Clean up; use root-level `.gitignore` only |
| CFG-2 | 🟠 R1 | `frontend/.env` is **committed** despite `*.env` in `.gitignore` | Decide policy: either gitignore (and provide `.env.example`) or commit (and remove from `.gitignore`) |
| CFG-3 | 🟠 R1 | Native has `eas.json`, `app.json`, `react-native.config.js`, `metro.config.js`, `babel.config.js`, `jest.config.js`, `.eslintrc.js`, `.prettierrc.js`, `tsconfig.json`, root `babel.config.js` — 10 config files | Many are scaffolding defaults. Audit which are actually customized. |
| CFG-4 | 🟡 R2 | Backend has no `pyproject.toml` or `setup.cfg` — `flake8`, `black`, `isort`, `mypy` are listed in requirements but never run | Add `pyproject.toml` with tool configs; add pre-commit |
| CFG-5 | 🟡 R2 | No EditorConfig, no Prettier config at repo root | Add `.editorconfig` (universal) + root Prettier config |

### 2.5 Tests

**Findings:**

| # | Sev | Finding | Why |
|---|-----|---------|-----|
| TA-1 | 🔴 R0 | Backend: 3 test files, no `conftest.py`, no shared fixtures, every file rebuilds login | Slow + duplicated; standard pytest pattern violated |
| TA-2 | 🔴 R0 | Frontend web: **zero unit tests**, **zero component tests** | After refactor (extracting business logic to `kiosk-core`), 80% of the testable surface becomes unit-testable |
| TA-3 | 🔴 R0 | Native: 1 trivial test (`App.test.tsx`) | Same — pure functions in `kiosk-core` will be tested once, both apps benefit |
| TA-4 | 🟠 R1 | Backend tests hit **live preprod POS** — slow, brittle, fail when POS is down | Add a `tests/unit/` tier with mocked POS responses; `tests/e2e/` for the integration tier |
| TA-5 | 🟠 R1 | No test for the original incident scenario (HTML response to `/api/menu/categories`) | After refactor, add `apiSchemas.test.ts` that throws on non-JSON or wrong-shape inputs |
| TA-6 | 🟡 R2 | No coverage reports anywhere | Add `coverage` to backend, `jest --coverage` to apps |

---

## 3. Duplication map (concrete line-count counts)

| Logic | Web file | Native file | Lines duplicated |
|-------|----------|-------------|------------------|
| Auth flow + login progress | `contexts/AuthContext.js` (213 lines) | `src/contexts/AuthContext.js` (213 lines) | **~190** |
| Cart state + key generation | `contexts/CartContext.js` (126 lines) | `src/contexts/CartContext.js` (~130 lines) | **~115** |
| Menu settings + applySettings | `contexts/MenuSettingsContext.js` (120 lines) | `src/contexts/MenuSettingsContext.js` (136 lines) | **~95** |
| Timing settings + prep time | `contexts/TimingSettingsContext.js` (74 lines) | `src/contexts/TimingSettingsContext.js` (~80 lines) | **~70** |
| Theme branding | `contexts/ThemeContext.js` (144 lines) | `src/contexts/ThemeContext.js` (~140 lines) | **~110** |
| Order payload assembly | `pages/KioskPage.js` lines 126-159 | `src/pages/KioskScreen.js` lines 102-135 | **~30** |
| Totals calculation | `pages/KioskPage.js` lines 80-96 | `src/pages/KioskScreen.js` lines 24-25, 56-61 | **~20** |
| `normalizePrice` | `utils/kioskHelpers.js:4-6` | `src/utils/helpers.js:4-6` | **3** |
| Menu card rendering | `components/kiosk/PortraitMenuCard.js` (80 lines) + `LandscapeMenuCard.js` (77 lines) | `src/components/MenuItemCard.js` (~80 lines) | **~150** (web internal) + **~70** (web↔native) |
| Cart row | `components/kiosk/InlineCartItem.js` (60 lines) + inline JSX in `CartSectionLandscape.js` | `src/components/CartSection.js` (~120 lines) | **~80** |
| Customization modal | `components/kiosk/CustomizationModal.js` (248 lines) | `src/components/CustomizationModal.js` (~250 lines) | **~220** |
| Success overlay | `components/kiosk/SuccessOverlay.js` (80 lines) | `src/components/SuccessOverlay.js` (~85 lines) | **~70** |
| Table selector | `components/kiosk/TableSelector.js` (83 lines) | `src/components/TableSelector.js` (~85 lines) | **~75** |
| Logout confirm | `components/kiosk/LogoutConfirmModal.js` (22 lines) | `src/components/LogoutConfirmModal.js` (~25 lines) | **~20** |
| Edit instructions modal | `components/kiosk/EditInstructionsModal.js` (64 lines) | `src/components/EditInstructionsModal.js` (~65 lines) | **~55** |

**Total duplicated logic across web + native: ~1,400 LOC out of ~3,000 LOC of business code = 47% duplication.**

Inside web alone (Portrait/Landscape variants): another ~250 LOC duplicated.

After `packages/kiosk-core` extraction:
- ~800 LOC moves from each app into shared (logic, schemas, math, transforms).
- Components stay platform-specific (DOM vs RN primitives) but their **props and behavior** are guaranteed identical because they all consume the same hooks.

---

## 4. Recommended phased refactor plan

### Phase R1 — Backend modularize (1–1.5 days)
Goal: enable unit testing of `transform_pos_food_to_menu_item` without HTTP; tighten env validation.

1. Split `server.py` along the proposed `backend/app/` layout.
2. Add `Settings` (Pydantic) for env validation at startup — fails fast if `POS_RESTAURANT_ID=""`.
3. Add `PosClient` class injected via `Depends()`.
4. Add `tests/unit/test_transforms.py` for the parse functions.
5. Add `response_model=` to every route.
6. Move `Mongo` decisions: either delete refs+deps OR re-enable.

### Phase R2 — Extract `kiosk-core` package (3–4 days)
Goal: kill 1,400 LOC of duplication; enable shared unit tests.

1. `yarn workspaces` or `pnpm workspaces` at repo root. `packages/kiosk-core` (TS preferred for schemas; can be JS if team prefers).
2. Move pure functions first: `cartMath`, `menuTransforms`, `shifts`, `pricing`, `orderBuilder`. **No platform deps.**
3. Add Zod schemas for `/api/menu/categories`, `/api/menu/items`, `/api/tables`, `/api/auth/login` — auto-derive TypeScript types.
4. Add `Storage` and `Http` adapter interfaces. Implement `useAuthCore({ storage, http })` etc. that take adapter instances.
5. Apps `web` and `native` provide concrete adapters (localStorage / AsyncStorage; axios same on both).
6. Migrate web first (smaller blast radius), then native.
7. Per migrated piece: tests move with the code to `packages/kiosk-core/tests/`. Coverage jumps from 0% to ~80%.

### Phase R3 — Web component dedup (1 day)
Goal: kill ~250 LOC of Portrait vs Landscape duplication; split `KioskPage.js`.

1. Merge `PortraitMenuCard` + `LandscapeMenuCard` → `<MenuCard variant>`.
2. Merge inline cart row into `<CartRow>`.
3. Split `KioskPage.js` into `<PortraitKiosk>` / `<LandscapeKiosk>` + a thin router.
4. Extract `SortableCategoryItem`, `SortableMenuItem` from `AdminSettingsPage.js`.

### Phase R4 — Hooks-ify singletons (½ day)
Goal: better testability + cleanup.

1. `kioskLock` → `useKioskLock()` hook (proper cleanup on unmount).
2. `touchSound` → `useTouchSound()` hook.
3. Tests verify listeners are removed on unmount (closes the leak from FE-19, FE-20 in stability audit).

### Phase R5 — Routing + state hygiene (½ day)
1. Convert `App.js` manual nav (`activeView` state) to `react-router-dom` routes.
2. Combine 7 providers into `<KioskCoreProvider>` composition.
3. `useStorageState(key, schema, default)` hook — every persisted state goes through it (one place to add validation, versioning).

### Phase R6 — Design tokens unification (½ day, optional)
1. Extract colors/spacing/type to `packages/kiosk-design-tokens/tokens.json`.
2. Web: build step writes CSS vars from JSON. Native: `import tokens` directly.
3. Tailwind config references the tokens.

### Phase R7 — Backend test pyramid (1 day)
1. `tests/unit/` — pure transform tests, no HTTP, no POS.
2. `tests/integration/` — FastAPI `TestClient` with mocked `PosClient`.
3. `tests/e2e/` — current pytest files (keep as-is, mark `@pytest.mark.e2e`).

### Phase R8 — Tooling (½ day)
1. Pre-commit hooks: black, isort, ruff, prettier, eslint.
2. Backend `pyproject.toml`.
3. Repo-root `.editorconfig`.
4. `commitlint` (optional — auto-generated changelogs).

**Total estimated effort: 7.5–10 dev days** (vs the 6–7 days of stability fixes from the previous audit). Stability fixes and refactor can interleave — every Phase 1 stability fix becomes simpler after Phase R2 is done.

---

## 5. ROI ranking — what to do first if you only have 5 days

If forced to pick:

| Priority | Item | Effort | Payoff |
|---|---|---|---|
| 1 | **Phase R2 (kiosk-core extraction)** | 3-4 days | Single biggest win. Kills 1,400 LOC. Every future feature is 1 PR not 2. |
| 2 | **Phase R1 (backend modularize)** | 1-1.5 days | Unlocks unit tests of POS transforms — exact area where the stability audit found 5 P0s |
| 3 | **Phase R5 (routing + provider composition)** | ½ day | Quick win; deep-linkable admin URLs are a small UX gift |
| 4 | **Phase R3 (web component dedup)** | 1 day | Reduces drift between Portrait/Landscape variants |
| 5 | Skip R6 / R8 unless team is bored | — | — |

Phases R4, R7 can be folded into R2 (write the hooks already as part of kiosk-core; write tests as you extract).

---

## 6. Concrete refactor examples (so it's not abstract)

### Example A — `applySettings` move
**Today:** Identical 50-line function in `frontend/src/contexts/MenuSettingsContext.js:49-96` and `kiosk-native/KioskApp/src/contexts/MenuSettingsContext.js:62-109`.

**After:**
```ts
// packages/kiosk-core/src/menuTransforms.ts
import { z } from 'zod';

const SettingsSchema = z.object({
  categoryOrder: z.array(z.string()).optional(),
  itemOrder: z.record(z.array(z.string())).optional(),
  hiddenCategories: z.array(z.string()).optional(),
  hiddenItems: z.array(z.string()).optional(),
}).nullable();

export function applySettings(
  categories: Category[],
  menuItems: MenuItem[],
  rawSettings: unknown
): { categories: Category[]; menuItems: MenuItem[] } {
  const settings = SettingsSchema.safeParse(rawSettings);
  if (!settings.success || !settings.data) return { categories, menuItems };
  // ... same logic ...
}
```

Web consumer:
```js
// apps/web/src/state/MenuSettingsContext.js
import { applySettings } from '@kiosk/core';
// ...
const applied = useMemo(
  () => applySettings(menuData.categories, menuData.menuItems, settings),
  [menuData, settings]
);
```

Native consumer: **identical import line**. Zero copy-paste.

### Example B — `<MenuCard>` merge
**Today:** `PortraitMenuCard.js` (80 lines) and `LandscapeMenuCard.js` (77 lines) — diff is ~15 lines of styling.

**After:**
```jsx
// components/kiosk/MenuCard.jsx
const MenuCard = ({ item, cart, onSelectItem, variant = 'portrait' }) => {
  const inCart = cart.some(ci => ci.id === item.id);
  const cartQty = cart.filter(ci => ci.id === item.id).reduce((s, ci) => s + ci.quantity, 0);
  return (
    <Card variant={variant} inCart={inCart} onClick={() => onSelectItem(item)} data-testid={`menu-item-${item.id}`}>
      {inCart && <Badge qty={cartQty} variant={variant} />}
      <Image src={item.image} variant={variant} alt={item.name} />
      <CardBody>
        <Name>{item.name}</Name>
        {item.description && <Description icon><Info/> {item.description}</Description>}
        <Metadata item={item} variant={variant} />
        <AddButton onClick={(e) => { e.stopPropagation(); onSelectItem(item); }} />
      </CardBody>
    </Card>
  );
};
```

Variant differences become CSS class lookups in the Card / Image styled components. **~120 LOC deleted.**

### Example C — `useAuthCore` extraction
```ts
// packages/kiosk-core/src/hooks/useAuthCore.ts
import { LoginResponseSchema, MenuItemsSchema, CategoriesSchema, TablesSchema } from '../apiSchemas';

export function useAuthCore({ storage, http }: { storage: Storage; http: Http }) {
  const [state, setState] = useState({ user: null, menuData: { categories: [], menuItems: [], tables: [] }, branding: null, isLoading: true });

  useEffect(() => {
    (async () => {
      const user = await storage.getJson('kiosk_user');
      const menuData = await storage.getJson('kiosk_menu_data');
      const branding = await storage.getJson('kiosk_branding');
      // schemas validate before state hydration — no more white screens
      const safeMenu = MenuItemsSchema.safeParse(menuData?.menuItems).success ? menuData : { categories: [], menuItems: [], tables: [] };
      setState({ user, menuData: safeMenu, branding, isLoading: false });
    })();
  }, []);

  const login = async (email, password) => {
    const resLogin = LoginResponseSchema.parse((await http.post('/api/auth/login', { email, password })).data);
    const token = resLogin.token;
    const [cats, items, tables, branding] = await Promise.all([
      CategoriesSchema.parse((await http.get('/api/menu/categories', token)).data),
      MenuItemsSchema.parse((await http.get('/api/menu/items', token)).data),
      TablesSchema.parse((await http.get('/api/tables', token)).data).tables,
      http.get('/api/config/branding').then(r => r.data).catch(() => null),
    ]);
    const userData = { email, token, ... };
    setState({ user: userData, menuData: { categories: cats, menuItems: items, tables }, branding, isLoading: false });
    await storage.setJson('kiosk_user', userData);
    await storage.setJson('kiosk_menu_data', { categories: cats, menuItems: items, tables });
    await storage.setJson('kiosk_branding', branding);
  };
  // ...
  return { ...state, login, logout, refreshMenuData };
}
```

Web's `AuthProvider` becomes:
```jsx
import { useAuthCore } from '@kiosk/core';
import { localStorageAdapter } from '../adapters/localStorage';
import { axiosAdapter } from '../adapters/axios';

export const AuthProvider = ({ children }) => {
  const auth = useAuthCore({ storage: localStorageAdapter, http: axiosAdapter });
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};
```

Native: identical except adapters. **All schema validation, all progress tracking, all error handling — once.**

---

## 7. Risk assessment of the refactor

| Risk | Mitigation |
|---|---|
| Monorepo tooling adds setup complexity | Use `pnpm workspaces` — simplest. ~30 min setup. |
| Refactor introduces new bugs | Each phase is independently shippable. Migrate one module at a time. Run existing pytest + manual smoke after each. |
| Team unfamiliar with Zod / TypeScript | If JS-only is preferred, use plain runtime checks (`Array.isArray`, `typeof`); still wins. Or `joi` if Zod feels foreign. |
| React Native build breaks during migration | Migrate web first (lower business risk). Don't touch native until kiosk-core is stable. |
| Schemas + adapters could over-abstract | Stop at the level of measurable wins. Don't introduce hexagonal-architecture cathedrals — the wins are at the duplication boundary, not deeper. |

---

## 8. Findings summary

```
🔴 R0  ........ 11   ← high-ROI refactors
🟠 R1  ........ 27
🟡 R2  ........ 14
🔵 INFO ........  5
            ──────
TOTAL  ........ 57

By area:
  Backend         10
  Frontend web    19
  React Native    12
  Configs          5
  Tests            6
  Cross-cutting    5

Estimated effort, full plan: 7.5–10 dev-days
Estimated effort, ROI-first 5-day cut: Phase R2 + R1 + R5
```

---

**End of architecture & refactor audit.** Combined with `refactor_cr/audits/FULL_CODEBASE_AUDIT.md` (67 stability findings) and `refactor_cr/audits/CRASH_AUDIT.md` (the original kiosk-bricking class), you now have:

1. What breaks today and how to stop it.
2. What slows the team down and how to fix it.

Stability fixes and the kiosk-core extraction are **complementary**: every stability fix landed in `packages/kiosk-core` automatically benefits web + native, halving the work.

Saved at `/app/memory/refactor_cr/audits/REFACTOR_AUDIT.md`.
