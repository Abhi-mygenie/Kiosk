# Crash & Stability Audit — Kiosk App (`14march` branch)

**Audit date:** 2026-05-30
**Auditor:** Code inspection sweep prompted by the post-login white-screen incident on `kiosk-app.mygenie.online`
**Scope:** `/app/frontend/src/**` (React 19 web app) + `/app/backend/server.py` (FastAPI POS proxy). React Native counterpart in `/app/kiosk-native/` not in this pass — same patterns likely apply.
**Method:** Manual read of every file in `contexts/`, `pages/`, `components/kiosk/`, `utils/`, `hooks/`, plus backend `server.py`. Looked specifically for:

- Unguarded `.map / .filter / .find / .reduce / .length / .forEach / .flatMap` on values that originate from `localStorage`, the network, or props.
- `JSON.parse` without shape validation.
- Direct property access on possibly-`undefined` chains.
- Number coercion that silently produces `NaN` (`.toFixed` later renders "NaN" in the UI).
- Missing React error boundaries.
- Missing cleanup → memory leaks across login/logout cycles.
- Event listeners never removed.
- Security: plaintext secrets in storage; trust boundaries crossed.

> Numbering is **C1, C2…** = Crash-risk findings (will white-screen or 500 the API), **B1…** = Bug / data-quality, **S1…** = Security, **P1…** = Perf/leak. Priorities: 🔴 P0 (blocks customer use), 🟠 P1 (degrades reliability), 🟡 P2 (cleanup / polish).

---

## 0. The original incident (recap)

The bug we already saw:
- nginx misrouted `/api/*` → React `index.html` was returned as the response body for `GET /api/menu/categories`.
- Frontend stored the HTML inside `kiosk_menu_data` in `localStorage`.
- On every subsequent page load, `AdminSettingsPage.js:226` called `menuData.categories.map(c => c.id)` on that HTML string.
- Uncaught `TypeError: n.categories.map is not a function` → React unmounted the whole tree → white screen, Logout button gone, hard-refresh useless because the poison is in `localStorage`.

This audit asks: **where else can this happen?** Short answer: in a lot of places. The root architectural issue is that the app trusts any value it pulls out of `localStorage` and any value it gets back from the network, and there is **zero error boundary** wrapping the React tree.

---

## 1. Critical crash risks (🔴 P0)

### C1. `localStorage` contents are never shape-validated before being used as state
**Files:** `contexts/AuthContext.js:43-50`, `contexts/MenuSettingsContext.js:8-15`, `contexts/TimingSettingsContext.js:8-15`

```js
// AuthContext.js
const storedMenuData = localStorage.getItem('kiosk_menu_data');
if (storedMenuData) {
  setMenuData(JSON.parse(storedMenuData));   // ← whatever shape, accepted
}
```

```js
// MenuSettingsContext.js
return stored ? JSON.parse(stored) : null;   // ← returned as-is to consumers
```

```js
// TimingSettingsContext.js
return stored ? JSON.parse(stored) : [];     // ← may be object/string
```

`JSON.parse` is wrapped in try/catch (good) but the **parsed shape** is trusted blindly. This is the exact mechanism that caused the post-nginx-fix white screen. Any malformed string in storage (corrupt write, manual edit, old schema after a deploy) will brick the kiosk.

**Why P0:** Customer-facing tablets can't recover without DevTools.

---

### C2. `AdminSettingsPage` performs unguarded `.map` / `.filter` / `.length` on `menuData`
**File:** `pages/AdminSettingsPage.js:226, 230-247, 260-262, 270-272, 310-313`

```js
return menuData.categories.map(c => c.id);                         // 226 — THE crash from the incident
menuData.categories.forEach(cat => { ... });                       // 230
const items = menuData.menuItems.filter(item => item.category...); // 231
const totalItems = menuData.menuItems.length;                      // 270
menuData.menuItems.filter(i => hiddenCategories.includes(...))     // 272
```

`menuData` is initialised in `AuthContext` to `{ categories: [], menuItems: [], tables: [] }` — but the moment storage restore (C1) overwrites it with anything else, every line above throws.

---

### C3. `KioskPage` & `MenuSettingsContext.applySettings` `.filter` on `categories`/`menuItems`
**Files:** `pages/KioskPage.js:36-38, 99-108`, `contexts/MenuSettingsContext.js:55, 70-72, 78`

```js
// KioskPage.js
const { categories, menuItems } = useMemo(
  () => applySettings(menuData.categories || [], menuData.menuItems || []),
  ...
);
```
The `|| []` only protects against `undefined`/`null`. If `menuData.categories` is a string (`"<!DOCTYPE html>..."`) the `|| []` fallback is **not** used — `applySettings` receives the string and crashes on `.filter`.

```js
// MenuSettingsContext.js:55
let filteredCategories = categories.filter(c => !hiddenCategories?.includes(c.id));
```

Same crash mode for `menuItems`, `tables`. Also, inside `applySettings`, `hiddenCategories` / `hiddenItems` / `itemOrder` are taken from `settings` (also from localStorage) with **no array check** (`hiddenCategories?.includes` short-circuits if `undefined`, but throws if `hiddenCategories` is a non-array object).

---

### C4. `TimingSettingsContext.getCurrentPrepTime` crashes on malformed `shifts`
**File:** `contexts/TimingSettingsContext.js:28-53`

```js
for (const shift of shifts) {                       // crashes if shifts is not iterable
  const [startH, startM] = shift.start.split(':').map(Number);  // crashes if shift.start undefined
  const [endH, endM] = shift.end.split(':').map(Number);
  ...
}
```

Same root cause as C1 — bad localStorage payload propagates. Called from `KioskPage` on every successful order via `<SuccessOverlay prepTime={getCurrentPrepTime()} />` so the crash takes out the order-confirmation overlay (customer sees nothing after a successful payment).

---

### C5. `applySettings` itemOrder lookup crashes when `itemOrder` is corrupt
**File:** `contexts/MenuSettingsContext.js:75-93`

```js
if (itemOrder) {
  ...
  const catOrder = itemOrder[cat.id];   // ← if itemOrder is array, this becomes undefined silently
  if (catOrder) {
    catItems.sort((a, b) => {           // OK if undefined skipped, but if catOrder is non-array
      const idxA = catOrder.indexOf(a.id);   // ← crashes if catOrder is e.g. a number
      ...
    });
  }
}
```

---

### C6. No React error boundary anywhere in the tree
**Files:** `App.js:55-80`, `index.js`

Any uncaught throw in any descendant unmounts the entire app. No fallback UI, no recovery button, no "Reload" button. This is the **multiplier** that turned C2 from a per-page error into a device-bricking event. A kiosk attendant on a tablet has no DevTools.

**Recommendation:** Wrap `<AppContent />` in an `<ErrorBoundary>` that renders a "Reset Kiosk" button which (a) clears all `kiosk_*` localStorage/sessionStorage keys, (b) reloads. Place a permanent visible Logout button outside the boundary so staff can always log out even if children crash.

---

### C7. Login flow crashes the whole login if **any** of 3 fetches returns a non-JSON 200
**File:** `contexts/AuthContext.js:107-124`

```js
const catRes = await authAxios.get(`${API_URL}/api/menu/categories`);
const itemsRes = await authAxios.get(`${API_URL}/api/menu/items`);
const tablesRes = await authAxios.get(`${API_URL}/api/tables`);

const fetchedMenuData = {
  categories: catRes.data,                  // ← could be HTML string (the bug we hit)
  menuItems: itemsRes.data,
  tables: tablesRes.data.tables || []       // ← if tablesRes.data is a string, .tables throws
};
```

If `tablesRes.data` is the HTML index page, `tablesRes.data.tables` is `undefined` (HTML strings don't have `.tables`) — actually JS allows property access on strings returning `undefined`, so `.tables` is `undefined`, then `|| []` saves it. **But** if it's a primitive like `null` returned from a different misconfiguration, `null.tables` throws → entire login fails with an opaque message.

Even when it doesn't throw, the HTML string ends up in `menuData.categories` (the original incident).

**Recommendation:** Validate each response is an array (categories/items) / object-with-array (tables) before accepting it. Reject the login with a clear "Backend returned unexpected response" error if not.

---

### C8. `axios` accepts non-JSON responses globally
**File:** `utils/kioskHelpers.js:9-18`, every fetch site

Axios's default behaviour: if `Content-Type: text/html`, `response.data` is the raw string. There is **no interceptor** rejecting non-JSON responses on `/api/*` calls. This is the single architectural defense that would have caught the nginx incident in milliseconds with a clean error.

**Recommendation:** Add a response interceptor in `createAuthAxios` (and the bare `axios` in `AuthContext`) that rejects `/api/*` responses whose content-type isn't `application/json`.

---

### C9. Backend: `float()` / `int()` on unvalidated POS strings can 500 the menu endpoint
**File:** `backend/server.py:284, 287-291, 294-298, 277-281, 516, 527`

```python
base_price = float(food.get("price", 0) or 0)   # ValueError if "price": "abc"
```

If the POS ever returns a non-numeric price (data entry error, locale-formatted "1,200.00"), the whole `/api/menu/items` endpoint returns 500. Other `try/except` blocks in the function correctly guard their parses — this one doesn't.

```python
"food_id": int(item.item_id),    # 516 — frontend item.id is a string from POS
"price": float(item.price)        # 524
```

If anything malformed reaches `send_order_to_pos`, the whole order returns 503 with a generic "Failed to place order".

**Recommendation:** Mirror the safe-parse pattern already used for `kcal`/`discount`/`tax`:
```python
try: base_price = float(food.get("price", 0) or 0)
except (ValueError, TypeError): base_price = 0
```

---

### C10. Backend: `dict.get(..., {}).get(...)` chain crashes if intermediate is `None`
**File:** `backend/server.py:413, 351-359`

```python
tables = data.get("data", {}).get("tables", [])
```

If POS returns `{"data": null}`, `None.get(...)` raises `AttributeError`. The function's outer try/except catches it and returns `None`, then the endpoint returns 503 — so it doesn't 500, but the **log** is misleading and the customer just sees "Unable to fetch tables".

```python
cat = food.get("category", {})
cat_id = str(cat.get("id", ""))   # crashes if cat is None or a list
```

Same shape risk if POS sends `"category": null`.

---

## 2. Reliability / data-shape bugs (🟠 P1)

### B1. `AuthContext.refreshMenuData` has no error handling at all
**File:** `contexts/AuthContext.js:168-188`

```js
const [catRes, itemsRes, tablesRes] = await Promise.all([...]);
const fetchedMenuData = { categories: catRes.data, ... };
setMenuData(fetchedMenuData);
localStorage.setItem('kiosk_menu_data', JSON.stringify(fetchedMenuData));
```

If any one of the 3 requests fails (token expired, network blip), `Promise.all` rejects, the promise from `refreshMenuData` is unhandled (no try/catch), and React surfaces an "uncaught (in promise)" error. Also the **previously-good** `menuData` is left intact in localStorage — fine. But the caller has no way to know it failed.

### B2. `CartContext.addToCart` mutates `item.variations` via `.sort()`
**File:** `contexts/CartContext.js:17-19`

```js
const itemKey = `${item.id}_${item.variations?.sort().join('_') || 'plain'}_...`;
```

`Array.prototype.sort()` mutates in place. The same `variations` array could be referenced elsewhere (e.g., `variationDetails` in the customization modal, the same item object re-added). Subtle ordering bugs after multiple adds.

**Fix:** `[...(item.variations || [])].sort()`.

### B3. `calculateTotals.*.toFixed(...)` will render "NaN" when prices coerce wrong
**Files:** `pages/KioskPage.js:286`, `components/kiosk/CartSectionLandscape.js:109, 113, 117, 121, 143`

```js
₹{calculateTotals.subtotal.toFixed(2)}
```

If any cart item arrives with a stringified price (`"199"`) — entirely possible because the POS transform path is many layers deep — `subtotal` becomes the concatenated string `"0199"` rather than a number. `.toFixed` on a string throws **TypeError** in newer JS engines if the string isn't coercible. Customer-visible NaN/crash in the cart.

**Fix:** Coerce explicitly in `CartContext.getTotal`:
```js
total + (Number(itemPrice) * Number(item.quantity))
```

### B4. `CustomizationModal` uses native `alert()` instead of toast
**File:** `components/kiosk/CustomizationModal.js:89`

```js
alert(`Please select: ${missing.join(', ')}`);
```

On a kiosk tablet locked into fullscreen mode, a browser-native alert dialog can be unstyled, mis-sized, or even prevented entirely by some kiosk browsers (silent failure → user can't add to cart and doesn't know why).

### B5. `TimingSettingsPage` treats `prepTime: 0` as `prepTime: 10`
**File:** `pages/TimingSettingsPage.js:35`

```js
prepTime: parseInt(prepTime) || 10,
```

User enters `0` → falsy → replaced with `10`. Use `Number.isNaN(parsed) ? 10 : parsed` if 0 should be allowed, or explicit `parsed >= 1 ? parsed : 10` if not.

### B6. `kioskLock.setupAdminUnlock` requires 5 taps, comment says 3
**File:** `utils/kioskLock.js:171-198`

```js
// Triple-tap top-left corner within 2 seconds
if (tapCount >= 5) { ... }
```

Functional but confusing for maintenance. Pick one and align the comment + the magic number.

### B7. Cart "in-cart" detection uses naive `find(ci => ci.id === item.id)`
**Files:** `components/kiosk/PortraitMenuCard.js:7-9`, `LandscapeMenuCard.js:7-9`

```js
const cartItem = cart.find(ci => ci.id === item.id);
const cartQty = cartItem ? cart.filter(ci => ci.id === item.id).reduce(...) : 0;
```

Walks the cart twice. Fine perf-wise for small carts, but the `inCart` flag is `true` if **any** variation of the item is in cart — visually fine, but `cartQty` then sums across variations, so a card showing "qty: 3" might be 1× cheese + 2× plain. Edge case in display semantics, not a crash.

### B8. `TableSelector` can render duplicate React `key`s if POS sends two tables with same `id`
**File:** `components/kiosk/TableSelector.js:41` — `key={table.id}`

Not a crash but throws a noisy console warning and can confuse React reconciliation. Defensive: include the section name in the key (`key={`${section}-${table.id}`}`).

### B9. `AdminSettingsPage` drag handlers don't guard against `oldIndex === -1`
**File:** `pages/AdminSettingsPage.js:124-127, 278-281`

```js
const oldIndex = items.findIndex(i => i.id === active.id);
const newIndex = items.findIndex(i => i.id === over.id);
onReorderItems(id, arrayMove(items, oldIndex, newIndex));
```

If `arrayMove` receives `-1`, behaviour is undefined (likely no-op, but @dnd-kit can throw on some versions). Guard: `if (oldIndex < 0 || newIndex < 0) return;`.

### B10. `AuthContext.login` doesn't roll back partial state on failure
**File:** `contexts/AuthContext.js:69-155`

If "Loading Branding" succeeds, "Loading Categories" succeeds, but "Loading Tables" fails — `setMenuData` has not been called yet (good), but `branding` may have already been written via the inner `try`. Actually no, `setBranding` is called only at the end. OK on inspection.

However: the `loginProgress` UI says "Loading Tables (loading)" forever in the brief window before the catch sets `isLoggingIn: false`. Minor UX glitch.

### B11. Backend: order `total` is trusted from the client
**File:** `backend/server.py:527` — `total_amount = round(float(order_input.total), 2)`

A malicious client could POST `total: 0.01` and the POS would accept it. The backend already has `subtotal`, `cgst`, `sgst`, and the cart — it should recompute the total server-side from the item list and reject mismatches > a small tolerance. This is the only authoritative integrity check before the POS.

### B12. Backend: `pos_order_id` extraction logic falls through silently
**File:** `backend/server.py:598-605`

```python
pos_order_id = pos_data.get("order_id") or pos_data.get("id")
if pos_order_id:
    order.id = str(pos_order_id)
    order.pos_order_id = str(pos_order_id)
order.status = "confirmed"
```

If POS responds 200 with neither field, the order is still marked "confirmed" and returned to the client with a **random UUID** that has no relation to anything in POS. Customer gets a "your order is confirmed" screen showing a token number that the POS staff has no way to look up.

Fix: if `pos_order_id` is missing after a 200, treat it as a failure or surface a warning to the user / log alert.

---

## 3. Security / privacy (🔴 P0 for S1, 🟠 P1 for the rest)

### S1. Plaintext password stored in `sessionStorage`
**Files:** `pages/LoginPage.js:105-106, 126`

```js
const [password, setPassword] = useState(() => {
  try { return sessionStorage.getItem('kiosk_session_pass') || ''; } catch { return ''; }
});
...
sessionStorage.setItem('kiosk_session_pass', password);
```

The DOCUMENTATION.md states: *"No plaintext password storage: 'Remember Me' stores username only (not password)"*. This is **false** — the password is stored in `sessionStorage` regardless of the Remember-Me checkbox. Any same-origin script, browser extension, or XSS payload can read it. It also persists across tabs in the same window.

**Recommendation:** Remove the `kiosk_session_pass` mechanism entirely. If you must auto-relogin (e.g., kiosk power cycle), store the **POS token** with an expiry, not the password. Even better: don't pre-fill password on the login form at all.

### S2. `CORS_ORIGINS=*` in production
**File:** `backend/.env`

Currently `"*"` because we needed it for the preview pod. On the user's prod (`kiosk-app.mygenie.online`), once `/api/*` is same-origin via nginx, set to the literal origin. Star CORS + Bearer auth is a known token-exfiltration risk surface if any other site embeds the kiosk page.

### S3. Bearer token in `localStorage` (not `sessionStorage`)
**File:** `contexts/AuthContext.js:133`

```js
localStorage.setItem('kiosk_user', JSON.stringify(userData));   // includes data.token
```

`localStorage` persists across browser restarts and is accessible to every same-origin script. For a kiosk this is acceptable trade-off (need persistence to survive power cycles), but it amplifies S1 — anything that XSS-leaks the password also leaks the long-lived token.

### S4. Backend logs full payloads at INFO
**File:** `backend/server.py:546, 559, 562-566`

```python
logger.info(f"POS Buffet Order Payload: {json.dumps(pos_data, indent=2)}")
logger.info(f"POS Buffet Order Response JSON: {result}")
```

Includes `cust_name`, `cust_mobile`, full cart. PII goes into log aggregators by default. Acceptable for preprod, problem for prod.

### S5. `kioskLock` admin unlock is just a 5-tap on a screen corner
**File:** `utils/kioskLock.js:171-198`

Any curious customer who reads a blog about kiosk hacks can find this. Acceptable for the threat model (low-skill walk-up), but worth knowing. Consider requiring a 4-digit PIN modal on top of the tap pattern.

---

## 4. Memory leaks & perf (🟡 P2)

### P1. `kioskLock.setupAdminUnlock` registers a global `click` listener and **never** removes it
**File:** `utils/kioskLock.js:177-198`

Each mount of `KioskPage` (called from `KioskPage.js:65`) attaches another listener. Log in → log out → log in cycle = 2 listeners. After a full day of staff training sessions or kiosk-mode tests, dozens. The closure captures `tapCount` per registration, so they don't even share state.

**Fix:** Store the handler reference; expose `tearDownAdminUnlock()`; call it in `kioskLock.disable()` and in the `KioskPage` cleanup.

### P2. `kioskLock.handleFullscreenChange` listener never removed
**File:** `utils/kioskLock.js:129` — added but never removed in `disable()`.

### P3. `kioskLock.setupCursorHide` also never cleaned up — adds `mousemove` and `touchstart` permanent listeners.

### P4. `SortableCategory` re-creates dnd-kit sensors per render
**File:** `pages/AdminSettingsPage.js:108-111`

`useSensors` is called inside a component that renders one per category. Should be hoisted to the parent or memoised. Minor — sensors are cheap, but with 30+ categories it's wasted work on every state update.

### P5. `KioskPage`'s `useEffect` dependency on `onNewOrder` re-creates the SuccessOverlay countdown timer every parent re-render
**File:** `components/kiosk/SuccessOverlay.js:10-23`

`onNewOrder` is an inline arrow in `KioskPage.js:388` → new identity every render → effect re-runs → timer is cleared/re-created → user sees countdown frozen at the same number if the parent re-renders often.

**Fix:** Wrap `onNewOrder` in `useCallback` in `KioskPage`, or use a ref pattern inside `SuccessOverlay`.

### P6. `TouchSoundManager` creates a new oscillator per tap with no pool
**File:** `utils/touchSound.js`

Browsers limit concurrent oscillators (~100s). On a busy kiosk with 200 taps in 5 minutes, garbage-collected but creates allocation churn. Acceptable but could be pooled.

### P7. `console.log` statements ship to production
**File:** `utils/kioskLock.js:36, 56`

Minor. Strip with a build-time plugin or wrap behind `if (process.env.NODE_ENV !== 'production')`.

---

## 5. UX gaps that look like bugs to users (🟡 P2)

### U1. Logout button is only reachable when Admin mode is unlocked
**File:** `pages/KioskPage.js:208-211, 326-328`

If `AdminSettingsPage` crashes (which is exactly what happened), staff cannot unlock admin mode to log out. The only recoverable state is "clear browser data". Combined with C6 (no error boundary) this means a kiosk that crashes once needs IT intervention.

### U2. No "stale data" banner when `menuData` is from an older login
The cached `menuData` in `localStorage` is shown on next launch with **no indication** that it might be hours/days old. Combine with the 5-minute backend cache and you can have a customer ordering items that have since gone out of stock. Add a "Refresh menu" button (call `refreshMenuData`) and/or auto-refresh every N minutes.

### U3. No offline detection
If the kiosk Wi-Fi drops, the customer sees a generic toast "Failed to place order" after a 30-second timeout — and the cart is preserved (good) but they don't know whether to retry or fetch a human.

### U4. `tableNumber` is held in `useState` only, lost on reload
**File:** `pages/KioskPage.js:43`

If the kiosk reloads (or crashes), the customer mid-order has to re-select their table. Could persist to `sessionStorage` keyed to the cart so reload is recoverable.

---

## 6. Summary table — what blows up and how

| ID | Trigger | Crash type | Recovery without dev tools |
|----|---------|------------|----------------------------|
| C1+C2 | Bad payload in `localStorage` (corrupt or wrong-shape) | White screen on every load | ❌ None |
| C3 | Same as C1 but reaches `applySettings` | White screen on `KioskPage` | ❌ None |
| C4 | Bad `kiosk_timing_settings` | Order confirmation overlay crashes mid-order | ❌ None |
| C6 | Any uncaught throw anywhere | Whole tree unmounts | ❌ None |
| C7 | nginx misroute (the original bug) or POS returning HTML | Login pseudo-succeeds then white screen | ❌ None |
| C8 | Same | Same | ❌ None |
| C9 | POS returns non-numeric price field | `/api/menu/items` → 500 → empty kiosk | Server-side fix |
| B3 | Stringy prices propagate to cart | "NaN" or TypeError in cart | ❌ None |
| B11 | Malicious client | Order placed for ₹0.01 | Server-side fix |
| S1 | Any XSS or extension | Password exfiltrated | Code fix |

---

## 7. Recommended remediation plan (ordered)

### Phase 1 — Stop the bleeding (~3 hrs)
1. **Add `<ErrorBoundary>`** wrapping `<AppContent />`. Fallback UI: logo, "Something went wrong" message, **"Reset & Reload"** button that clears all `kiosk_*` keys + reloads. (Fixes the whole class of C1-C5 from being a customer-facing white screen.)
2. **Axios JSON-only interceptor** on every request (or at least every `/api/*`). Reject non-JSON responses → caught by `AuthContext.login`'s catch → user sees "Server returned unexpected response" toast. (Catches the nginx-misroute class instantly.)
3. **Safe-read helpers** in every context (`readArray`, `readObject`) — replace every `JSON.parse` + use site. (Closes C1, C4, C5.)
4. **Guard every `.map / .filter / .find / .reduce`** that touches `menuData.*` or `settings.*` with `Array.isArray(x) ? x : []`. (Closes C2, C3.)

### Phase 2 — Server-side hardening (~1 hr)
5. **Safe-parse `float()`/`int()`** on POS fields (C9, C10).
6. **Server-side total verification** in `POST /api/orders` (B11) — recompute from items, reject if mismatch > ₹0.50.
7. **Validate `pos_order_id` is present** before returning `confirmed` (B12).

### Phase 3 — Security cleanup (~1 hr)
8. **Remove `kiosk_session_pass`** from `LoginPage.js` (S1). Don't pre-fill password.
9. **Tighten CORS** to literal origin in prod `.env` (S2).
10. **Strip PII from INFO logs** — move payload logging to DEBUG (S4).

### Phase 4 — Polish (~1 hr)
11. Fix `kioskLock` listener leaks (P1-P3).
12. Replace `alert()` with `toast` (B4).
13. Persist `tableNumber` to sessionStorage for reload recovery (U4).
14. Add "Refresh menu" admin button (U2).
15. Fix `prepTime: 0` bug (B5).
16. Wrap `onNewOrder` in `useCallback` (P5).

### Phase 5 — Defensive infra (deferred)
17. **App version stamp in localStorage** — on boot, if `localStorage.kiosk_app_version !== build version`, wipe `kiosk_*` keys. Auto-cleans state on every deploy.
18. **Health-check ping** every 60s — small fetch to `/api/`; if it stops returning JSON for >2 mins, show a system-status banner.
19. **Frontend Sentry / similar** to catch the next surprise crash before a customer does.

---

## 8. Files that will be touched (estimate)

| File | Lines changed | Risk | Test impact |
|---|---|---|---|
| `contexts/AuthContext.js` | ~30 | Med | Login flow |
| `contexts/MenuSettingsContext.js` | ~40 | Med | Admin settings, kiosk render |
| `contexts/TimingSettingsContext.js` | ~20 | Low | Order confirmation overlay |
| `pages/AdminSettingsPage.js` | ~10 | Low | Drag-and-drop, save/skip |
| `pages/KioskPage.js` | ~15 | Med | Whole kiosk |
| `utils/kioskHelpers.js` | ~20 | Low | All API calls |
| `utils/kioskLock.js` | ~30 | Med | Kiosk lock + admin unlock |
| `components/ErrorBoundary.js` | new, ~40 | Low | Global crash UX |
| `components/kiosk/CustomizationModal.js` | ~5 | Low | Add-to-cart validation |
| `backend/server.py` | ~25 | Med | Menu transform, order placement |
| **Total** | **~235 lines** | | |

Mirror the same changes in `kiosk-native/KioskApp/src/...` (out of scope for this audit but should be tracked).

---

## 9. Acceptance test scenarios for the fix

Each must pass before closing the parent CR:

1. **Poison test:** `localStorage.setItem('kiosk_menu_data', '<html>oops</html>')` → reload → app loads, shows empty menu, no white screen, Logout reachable.
2. **HTML 200 test:** Mock `/api/menu/categories` to return `text/html` → login flow shows toast "Backend returned unexpected response", no token stored.
3. **Bad timing test:** `localStorage.setItem('kiosk_timing_settings', '"banana"')` → reload, place order → success overlay renders without prep-time line.
4. **Crash recovery test:** Force-throw inside `<KioskPage>` (temporary `throw new Error()`) → error boundary shows "Reset & Reload" button → click → all kiosk_* keys cleared → login screen.
5. **Price tamper test:** POST `/api/orders` with `total: 0.01` but ₹1000 worth of items → 400 response, order not forwarded to POS.
6. **Stringy price test:** Mock `/api/menu/items` to return `"price": "199"` for one item → add to cart → cart total displays "₹199" (not NaN), order JSON has numeric price.
7. **Leak test:** Login → logout → login → logout × 5 → no growth in global click/keydown/mousemove listeners (check via DevTools → Memory → Detached event listeners).
8. **Password storage test:** Login → DevTools → Application → Session Storage → no `kiosk_session_pass` key, no plaintext password anywhere.

---

## 10. What's NOT a problem (audited and cleared)

- `CartContext` quantity math handles `quantity <= 0` correctly (auto-removes).
- `useOrientation` is robust to SSR (`typeof window` guard).
- `ThemeContext.hexToHSL` handles missing hex defensively.
- `AuthContext.useEffect` cleanup correctly clears storage on parse failure.
- Backend `fetch_pos_menu` and `fetch_pos_tables` both correctly handle 401 → return `None` → endpoint returns 503. Cache invalidation on token change works.
- `LoginPage` form validation is correct.
- `TableSelector` correctly handles `tables = []` (empty grid, no crash).
- `EditInstructionsModal` and `CustomizationModal` keyboard handling via `visualViewport` is well guarded with `if (!window.visualViewport) return;`.

---

**End of audit.** Open this with the team and triage Phase 1 first — it's a 3-hour, ~120-line change that converts the *class* of crashes responsible for the original incident into a one-tap recoverable state. Everything else can land progressively.
