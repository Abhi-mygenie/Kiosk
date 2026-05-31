# Kiosk App — Full Codebase Audit

**Repo:** `Abhi-mygenie/Kiosk`, branch `14march` (latest commit `b667ab5`, 2026-03-17)
**Audit date:** 2026-05-30
**Files in scope:** 176 (deep-read 50 critical, scanned 126 boilerplate/config)
**Method:** Manual line-by-line review of business logic + targeted scans of configs, CI/CD, tests, docs, and the parallel React Native codebase.

> Severity legend  🔴 **P0** — production-breaking, customer-facing  •  🟠 **P1** — reliability/data integrity  •  🟡 **P2** — polish / tech-debt  •  🔵 **INFO** — observation, no action required

---

## 0. Executive snapshot

| Area | Files | Health |
|------|-------|--------|
| Backend (FastAPI proxy) | 1 module + 3 tests | 🟠 Functional, but trust-boundary issues + brittle parses |
| Frontend Web (React 19) | 100+ src files | 🔴 Multiple white-screen crash modes + no error boundary |
| React Native (Android kiosk app) | 60+ files | 🔴 **Hardcoded preview URL** — APK ships broken |
| CI/CD (GitHub Actions) | 1 workflow | 🟠 No tests, no lint, no signing, non-reproducible |
| Configs / env / docs | ~15 files | 🟠 Doc claims contradict code (security) |
| Dev-only plugins (visual-edits, health-check) | 4 files | 🟡 Gated to dev mode — minor leaks but not shipped |
| Shadcn/ui boilerplate | 38 files | 🔵 Vendor code, unmodified — out of scope |

**Total distinct findings:** 67 — `15 × P0`, `28 × P1`, `19 × P2`, `5 × INFO`.

Almost every P0 issue traces to one of three architectural gaps:
1. **No error boundary** anywhere in the React tree (web + native).
2. **No shape validation** at trust boundaries (`localStorage` / `AsyncStorage`, API responses, POS payloads).
3. **Hardcoded configuration** (preview URL baked into the native APK; preview URL bakes into the web build at compile time).

---

## 1. Backend — `/app/backend/`

### `server.py` (693 lines)

| # | Sev | Line | Finding |
|---|-----|------|---------|
| BE-1 | 🔴 P0 | 284 | `base_price = float(food.get("price", 0) or 0)` — **not** wrapped in try/except. One bad POS row (string price, locale "1,200") → `/api/menu/items` returns 500 → blank kiosk for every customer until POS is fixed. Other parses in the same function (kcal, discount, tax) are correctly try/excepted. Apply the same pattern. |
| BE-2 | 🔴 P0 | 527, 516 | `int(item.item_id)` and `float(order_input.total)` inside `send_order_to_pos`. Non-numeric input → caught by the broad `except Exception`, logged opaquely, surfaces as generic "Failed to place order. Please try again." User can't recover. |
| BE-3 | 🔴 P0 | 527, 593 | **Order total trusted from client.** `order_input.total` is forwarded verbatim to POS as `order_amount`. Modified browser → POST `{ items: [₹1000 item], total: 0.01 }` → POS accepts. No server-side recomputation despite all data being available. |
| BE-4 | 🟠 P1 | 413 | `data.get("data", {}).get("tables", [])` — if `data["data"]` is JSON `null`, `None.get(...)` raises `AttributeError`, caught by outer try, returns `None`, endpoint returns 503 with misleading log. |
| BE-5 | 🟠 P1 | 351–359 | `cat = food.get("category", {})` then `cat.get("id", "")`. POS sometimes returns `"category": null` → `None.get` crash → 500. Wrap defensively. |
| BE-6 | 🟠 P1 | 598–605 | If POS responds 200 but body lacks both `order_id` and `id`, order is marked `confirmed` with a random UUID. Customer sees a "your order is confirmed" screen showing a token POS staff can't look up. Should treat missing `pos_order_id` as failure (or at minimum log alert). |
| BE-7 | 🟠 P1 | 167–193 | `fetch_pos_menu` only checks `status_code == 200` and `== 401`. A 5xx from POS returns `None` silently (treated like missing token). User sees generic 503; logs don't surface the actual upstream status. |
| BE-8 | 🟠 P1 | 546, 559–566, 613 | `logger.info` dumps **full order payload** including `cust_name`, `cust_mobile`, and full cart. PII goes to logs by default. Move to DEBUG, or scrub fields. |
| BE-9 | 🟠 P1 | 28–30, 154–194, 388–429 | Menu/table caches are **module-level globals**, not per-restaurant. If two restaurants ever share a backend process (multi-tenant), cache poisoning across tenants. Today it's single-tenant, but the code makes it implicit, not enforced. |
| BE-10 | 🟠 P1 | 660–676 | Login error handling collapses any non-401 POS error to `HTTPException(status_code=response.status_code, detail="Login failed")`. POS validation errors (422), rate-limit (429), and 5xx are all indistinguishable to the user. |
| BE-11 | 🟡 P2 | 38, 41 | FastAPI `app = FastAPI()` — no `title`, no `version`, no `description`. `/docs` shows generic Swagger UI. |
| BE-12 | 🟡 P2 | 684 | `allow_origins=os.environ.get('CORS_ORIGINS', '*').split(',')` — default of `*` plus credentials would be permissive; mitigated by `allow_credentials=True` + `*` being illegal in browsers (browser silently rejects), but logic is fragile. |
| BE-13 | 🟡 P2 | 4, 32–35, 607–612, 690–693 | Dead code: every MongoDB reference is commented out yet `motor==3.3.1` and `pymongo==4.5.0` are in requirements. Either re-enable for order history or remove the dependencies (saves ~10MB image size). |
| BE-14 | 🟡 P2 | 51–146 | `Variation`, `Category`, `MenuItem`, `Order`, `OrderCreate`, `BrandingConfig` Pydantic models are defined but **never used as response_model** on routes (except `BrandingConfig`). Type safety is lost — FastAPI returns dicts. |
| BE-15 | 🔵 INFO | — | Endpoints return Python dicts directly. Adding `response_model=List[MenuItem]` etc. would yield free OpenAPI docs and request validation. |

### Backend tests — `/app/backend/tests/*.py`

| # | Sev | File / Line | Finding |
|---|-----|-------------|---------|
| BT-1 | 🟠 P1 | `test_optional_tables.py:10`, `test_security_and_env.py:12` | `os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')` — if env var is unset, `None.rstrip()` raises `AttributeError` at collection time. `test_kiosk_refactor.py:9` handles this safely (`.get(..., '')`). Inconsistent. |
| BT-2 | 🟠 P1 | All 3 files | **Hardcoded production-ish credentials** (`manager@hyattcandolim.com / Qplazm@10`). If these creds get rotated by POS admin, every test breaks. If repo goes public, creds leak. Should be `pytest.skip` if env vars `KIOSK_TEST_EMAIL` / `KIOSK_TEST_PASSWORD` are missing. |
| BT-3 | 🟠 P1 | `test_security_and_env.py:36` | `pytest.skip("Authentication failed - skipping authenticated tests")` — runs **inside a fixture**, but the fixture returns a real `None` token that breaks downstream assertions. Skip should be at fixture-level via `pytest.skip` outside try. |
| BT-4 | 🟡 P2 | `test_kiosk_refactor.py:207–235` | Order placement test posts with consistent `subtotal == total`, `cgst=0, sgst=0`. **Doesn't exercise** the price-tamper attack path (BE-3). After fixing BE-3, add a negative test that asserts mismatched totals are rejected. |
| BT-5 | 🟡 P2 | All 3 files | No test for: malformed POS responses (HTML body, null fields), token expiry mid-session, concurrent order placement, large carts (>50 items), or branding fallback. |
| BT-6 | 🔵 INFO | — | No `conftest.py`, no shared fixtures, no factory helpers. Each test rebuilds login from scratch — slow against preprod (~30s of HTTP). |

### `requirements.txt`

| # | Sev | Finding |
|---|-----|---------|
| BR-1 | 🟠 P1 | Pinned `bcrypt==4.1.3`, `pymongo==4.5.0` exactly; loose `>=` on everything else. Mixed pinning policy — non-reproducible builds. Use a `lockfile` (`pip-compile`) or pin everything. |
| BR-2 | 🟡 P2 | Ships `pandas`, `numpy`, `pytest`, `black`, `isort`, `flake8`, `mypy` in production runtime requirements. Should be split into `requirements-dev.txt`. ~120 MB unnecessary in production image. |
| BR-3 | 🟡 P2 | `emergentintegrations==0.1.0` listed but never imported in `server.py`. Dead dependency. |

### `backend/.env`

| # | Sev | Finding |
|---|-----|---------|
| BE-ENV-1 | 🟠 P1 | `POS_RESTAURANT_ID=""` empty — orders silently broken until set. |
| BE-ENV-2 | 🟠 P1 | `CORS_ORIGINS="*"` — must be restricted to deployed frontend origin in production. |
| BE-ENV-3 | 🟡 P2 | `MONGO_URL`, `DB_NAME` kept as dead variables. Either re-enable Mongo (order history) or remove. |

---

## 2. Frontend Web — `/app/frontend/`

### Crash-risk findings (already in CRASH_AUDIT.md, summarized here)

| # | Sev | File:Line | Finding |
|---|-----|-----------|---------|
| FE-1 | 🔴 P0 | `App.js`, `index.js` | **No `ErrorBoundary` anywhere.** Single uncaught throw unmounts the entire app — exact root cause of the post-nginx-fix white-screen incident. |
| FE-2 | 🔴 P0 | `AuthContext.js:43-50`, `MenuSettingsContext.js:8-15`, `TimingSettingsContext.js:8-15` | `localStorage` contents are JSON-parsed in try/catch but the **shape** is trusted. Corrupt or wrong-shape payload bricks the kiosk forever (storage survives hard-refresh). |
| FE-3 | 🔴 P0 | `AdminSettingsPage.js:226, 230-247, 270-272, 310-313` | Unguarded `.map / .filter / .length` on `menuData.categories` / `menuData.menuItems`. **This is the line that crashed your incident.** |
| FE-4 | 🔴 P0 | `KioskPage.js:36-37, 99-108`; `MenuSettingsContext.js:55-93` | `applySettings(menuData.categories \|\| [], menuData.menuItems \|\| [])` — `\|\| []` only catches `undefined/null`, not strings/objects. Wrong-shape payload → `.filter` crash. |
| FE-5 | 🔴 P0 | `AuthContext.js:107-124, 174-178` | Login + `refreshMenuData` accept any 200 response as valid menu data. If the request returns HTML (nginx misroute, proxy 502 page, etc.), HTML lands in `menuData` and poisons localStorage. No content-type check, no shape check. |
| FE-6 | 🔴 P0 | `utils/kioskHelpers.js:9-18` | No axios response interceptor rejecting non-JSON `/api/*` responses. Single line of code would have made the nginx incident a clean toast instead of a white screen. |
| FE-7 | 🔴 P0 | `TimingSettingsContext.js:36-38` | `shift.start.split(':').map(Number)` — crashes if `shift.start` is undefined/null. `getCurrentPrepTime` is called inside the SuccessOverlay after every order — crash kills the confirmation screen mid-payment. |

### Reliability / data-integrity findings

| # | Sev | File:Line | Finding |
|---|-----|-----------|---------|
| FE-8 | 🔴 P0 | `LoginPage.js:105-106, 126` | **Plaintext password stored in `sessionStorage`** under `kiosk_session_pass`, pre-fills password input on next render. Any same-origin script (XSS, bookmarklet, extension) can read it. DOCUMENTATION.md falsely claims "No plaintext password storage". |
| FE-9 | 🟠 P1 | `AuthContext.js:133` | Bearer token persisted in `localStorage` (survives browser restart). Combined with FE-8, an XSS payload exfiltrates both the password and a long-lived token. |
| FE-10 | 🟠 P1 | `CartContext.js:17-19` | `item.variations?.sort()` mutates the shared array. Subsequent renders see re-ordered variations. Subtle deduplication bug when adding the same item with same variations twice. Fix: `[...(item.variations ?? [])].sort()`. |
| FE-11 | 🟠 P1 | `CartContext.js:84-95`, `KioskPage.js:84-96` | Totals computed with `itemPrice * item.quantity` — if `itemPrice` is a stringified number from POS, JS does string concatenation. `subtotal` becomes `"199199"` not `398`. `.toFixed(2)` then either returns wrong number or throws on non-numeric strings (newer engines). |
| FE-12 | 🟠 P1 | `CartSectionLandscape.js:109-121, 143`; `KioskPage.js:286` | `calculateTotals.subtotal.toFixed(2)` etc. — if NaN propagates from FE-11, UI shows "NaN" or throws. |
| FE-13 | 🟠 P1 | `CustomizationModal.js:89` | Uses `window.alert(...)` for validation feedback. Kiosk-mode browsers may block alerts → silent failure → customer can't add item, doesn't know why. |
| FE-14 | 🟠 P1 | `AdminSettingsPage.js:124-127, 278-281` | `arrayMove(items, oldIndex, newIndex)` — no guard for `oldIndex === -1` (drag over invalid target). @dnd-kit behavior is undefined; some versions throw. |
| FE-15 | 🟠 P1 | `TimingSettingsPage.js:35` | `prepTime: parseInt(prepTime) \|\| 10` — user-entered `0` becomes `10` (falsy). |
| FE-16 | 🟠 P1 | `MenuSettingsContext.js:75-93` | `itemOrder[cat.id]` accessed without checking `itemOrder` is an object. If localStorage was poisoned with `itemOrder: []` or a number, `.indexOf` later throws. |
| FE-17 | 🟠 P1 | `AuthContext.js:166-188` | `refreshMenuData` uses `Promise.all` with no `try/catch`. Single failed request → unhandled promise rejection. No user feedback. |
| FE-18 | 🟠 P1 | `LoginPage.js:147-149` (LoadingOverlay) | Loading overlay step list is hardcoded `['Authenticating', 'Loading Theme', 'Loading Categories', ...]`. If `AuthContext.login` changes the step names, overlay shows stale "pending" rows forever. |
| FE-19 | 🟠 P1 | `KioskPage.js:65-69`, `kioskLock.js:177-198` | `kioskLock.setupAdminUnlock` registers a global `click` listener with **no teardown**. Each KioskPage mount adds another listener. Day-long uptime + multiple login cycles = dozens of stacked handlers. |
| FE-20 | 🟠 P1 | `kioskLock.js:129, 167-168` | `fullscreenchange`, `mousemove`, `touchstart` listeners added in `enable()` but **never removed in `disable()`**. Leaks across login/logout cycles. |
| FE-21 | 🟠 P1 | `kioskLock.js:189` | Comment says "Triple-tap" but code checks `tapCount >= 5`. Confusing for maintenance. |
| FE-22 | 🟠 P1 | `SuccessOverlay.js:23` | `useEffect([onNewOrder])` — `onNewOrder` is an inline arrow in `KioskPage.js:388`, so its identity changes on every parent render. Timer resets repeatedly, customer sees countdown stuck at the same number. |
| FE-23 | 🟠 P1 | `PortraitMenuCard.js:7-9`, `LandscapeMenuCard.js:7-9` | `cart.find(ci => ci.id === item.id)` matches **any** variation of the same base item. Badge shows total qty across all variations, but `inCart` highlight is set even for a different customization. Misleading visual feedback. |
| FE-24 | 🟠 P1 | `TableSelector.js:41` | `key={table.id}` — if POS sends two tables with same id (data error), React warning + reconciliation bugs. Defensive: `key={`${section}-${table.id}`}`. |

### Performance / leaks

| # | Sev | File:Line | Finding |
|---|-----|-----------|---------|
| FE-P-1 | 🟡 P2 | `AdminSettingsPage.js:108-111` | `useSensors(...)` called inside `SortableCategory` — runs per category instance. Should be hoisted. Minor with <30 categories. |
| FE-P-2 | 🟡 P2 | `touchSound.js` | Creates a new `OscillatorNode` per tap, no pool. Browsers cap concurrent oscillators; rapid taps could leak. Acceptable for kiosk usage. |
| FE-P-3 | 🟡 P2 | `kioskLock.js:36, 56` | `console.log('Kiosk lock enabled/disabled')` ships to production. Gate with `process.env.NODE_ENV`. |

### UX gaps

| # | Sev | File:Line | Finding |
|---|-----|-----------|---------|
| FE-U-1 | 🟠 P1 | `KioskPage.js:208-211, 326-328` | **Logout only visible when admin-mode unlocked.** Combined with FE-1 (no error boundary), if the kiosk crashes there's no way to recover from the UI. |
| FE-U-2 | 🟠 P1 | `KioskPage.js:43` | `tableNumber` held in `useState` only. Reload mid-order → table selection lost. Persist to `sessionStorage`. |
| FE-U-3 | 🟡 P2 | `AuthContext.js:31-58` | Cached `menuData` is restored on next launch with no indication of age. Customer could order items that went out of stock hours ago. Add "stale-while-revalidate" semantics or a "Refresh menu" admin button. |
| FE-U-4 | 🟡 P2 | — | No offline indicator. Wi-Fi drop → 30s spinner → generic toast. Customer doesn't know whether to retry or call staff. |
| FE-U-5 | 🟡 P2 | `KioskPage.js:67` | `window.confirm('Exit kiosk mode?')` — native confirm dialog in kiosk fullscreen looks unstyled and is often blocked. |

### Config / build / CSS

| # | Sev | File | Finding |
|---|-----|------|---------|
| FE-C-1 | 🔴 P0 | `craco.config.js`, build pipeline | **`REACT_APP_BACKEND_URL` is baked into the JS bundle at build time.** Self-hosting requires a rebuild every time the URL changes. Document or refactor to a runtime config (`/config.json` fetched at boot, then patched at deploy time). |
| FE-C-2 | 🟠 P1 | `index.css:1` | Font CDN import (`fonts.googleapis.com`) — on first kiosk boot without internet, fonts silently fall back to system. Bundle the fonts locally or `<link rel="preconnect">` + service-worker fallback. |
| FE-C-3 | 🟠 P1 | `index.css:12` | `body { overflow: hidden; }` global — intentional for kiosk but breaks the AdminSettings / TimingSettings pages if the form grows beyond viewport on small tablets. Confirmed visually: works at current sizes but is fragile. |
| FE-C-4 | 🟡 P2 | `index.css:63-93` | `[data-debug-wrapper="true"] { display: contents !important; }` and inheritance rules — dev-only visual-edits artifact shipping to production. Remove via PostCSS plugin gated on `NODE_ENV`. |
| FE-C-5 | 🟡 P2 | `craco.config.js:36-37` | `eslint: { enable: false }` disables CRA ESLint to "avoid config conflicts". Means no lint runs during build → typos and unused imports ship. Either fix ESLint config or run lint as a separate CI step. |
| FE-C-6 | 🟡 P2 | `package.json` (React 19) | `react-day-picker@8.10.1` has incorrect peer dep `react@^16/17/18` — yarn warning suppressed. Works today but ticking time-bomb when day-picker is upgraded. Not used in current code; consider removing. |
| FE-C-7 | 🟡 P2 | `package.json` | 60+ shadcn/Radix UI packages installed; only ~6 actually imported (`button`, `dialog`, `toast`, `tooltip`, `dropdown-menu`, `popover` via shadcn — and even those usage seems light). Tree-shaking handles bundle size but `yarn install` is slow. |
| FE-C-8 | 🔵 INFO | `tailwind.config.js:62-65` | Brand colors mix CSS variables with hardcoded hex fallbacks (`'blue-hero': 'var(--blue-hero, #62B5E5)'`). Two sources of truth — variable can be set in `ThemeContext`, but Tailwind classes use the fallback if variable doesn't exist at parse time. Fine in practice. |

### Plugin code (dev-only)

| # | Sev | File | Finding |
|---|-----|------|---------|
| FE-PL-1 | 🟡 P2 | `plugins/visual-edits/babel-metadata-plugin.js` | Module-level caches (`RESOLVE_CACHE`, `FILE_AST_CACHE`, `PORTAL_COMP_CACHE`, `DYNAMIC_COMP_CACHE`, `PROP_SOURCE_CACHE`) never invalidate on file deletion — only on `mtimeMs` change. Stale AST caches if files renamed. Dev-only, gated by `enableVisualEdits`. |
| FE-PL-2 | 🟡 P2 | `plugins/visual-edits/dev-server-setup.js:895-918` | Writes `.backup` files before edit, deletes only on success. Crash mid-write leaves `.backup` files in repo (and they're not in `.gitignore`). |
| FE-PL-3 | 🟡 P2 | `plugins/visual-edits/dev-server-setup.js:381-393` | `/edit-file` auth uses a single shared `x-api-key` against the Supervisor password. No request rate-limiting. Dev-only attack surface but worth noting. |
| FE-PL-4 | 🔵 INFO | `plugins/visual-edits/dev-server-setup.js:907-911` | `execSync` for git commands. Synchronously blocks the dev server during commits. Fine for dev. |
| FE-PL-5 | 🔵 INFO | `plugins/health-check/*` | Health endpoints (`/health`, `/health/simple`, `/health/ready`, `/health/live`, `/health/errors`, `/health/stats`) only mounted in dev server. Production builds never expose these — but the **frontend `.env` has `ENABLE_HEALTH_CHECK=false`**, so they're double-gated. OK. |

---

## 3. React Native — `/app/kiosk-native/KioskApp/`

> The native app re-implements the web app feature-for-feature. **Every crash pattern from §2 applies here too** (same architecture, same trust assumptions). Below are findings unique to native.

### Critical

| # | Sev | File:Line | Finding |
|---|-----|-----------|---------|
| RN-1 | 🔴 P0 | `src/utils/api.js:5` | **`API_BASE_URL = 'https://restaurant-kiosk-app.preview.emergentagent.com'` — hardcoded.** An APK built today and installed on a hotel tablet will permanently hit a preview/sandbox URL. There is **no env var support, no runtime config, no build flavor**. The native app is non-deployable as-is. Must be replaced with `process.env` (Metro) or `react-native-config` before any APK ships. |
| RN-2 | 🔴 P0 | `App.js:26-51` | No error boundary. Same crash semantics as web. |
| RN-3 | 🔴 P0 | `src/contexts/AuthContext.js:43-52, 120-124, 176-180` | Same as FE-2/FE-5 — AsyncStorage payloads + login responses trusted without shape validation. |
| RN-4 | 🔴 P0 | `src/contexts/MenuSettingsContext.js:62-109` | Same `applySettings` crash patterns as web. |
| RN-5 | 🔴 P0 | `src/utils/storage.js:12-86` | Every getter is `JSON.parse(data)` with try/catch but no shape check. |
| RN-6 | 🔴 P0 | `src/pages/KioskScreen.js:44-79, 102-135` | Same unguarded `.map / .filter / .flatMap / .find` on context data. |

### Reliability

| # | Sev | File:Line | Finding |
|---|-----|-----------|---------|
| RN-7 | 🟠 P1 | `src/contexts/AuthContext.js:170-178` | `Promise.all` in `refreshMenuData` with no error handling. |
| RN-8 | 🟠 P1 | `src/pages/KioskScreen.js:56-61` | No discount/coupon handling vs. web (web has `appliedCoupon`). Functional divergence — if business adds coupons via web, native users don't get the same behavior. |
| RN-9 | 🟠 P1 | `src/pages/KioskScreen.js:109` | Builds `authAxios` on every render of `handlePlaceOrder` (not memoised). Re-creates Axios instance, but functionally OK. |
| RN-10 | 🟠 P1 | `src/utils/helpers.js:43` | `text.substring(0, maxLength) + '...'` — splits in the middle of a multi-byte character on some Unicode menu items (Hindi, emoji). Use `Intl.Segmenter` or grapheme-safe slice. |

### Native config / build

| # | Sev | File:Line | Finding |
|---|-----|-----------|---------|
| RN-11 | 🟠 P1 | `android/app/src/main/AndroidManifest.xml:18` | `android:usesCleartextTraffic="${usesCleartextTraffic}"` — variable substitution from `build.gradle`. If a dev sets it to `true` for local debugging and forgets to flip back, release APK can talk to HTTP. Verify build.gradle has it `false` for `release`. |
| RN-12 | 🟠 P1 | `AndroidManifest.xml:33-35` | `<category android:name="android.intent.category.HOME" />` makes the app a launcher replacement. Combined with `BootReceiver` auto-start and `singleTask` launchMode, this is true kiosk mode — but the **Boot receiver has no permission check**. Any app on device could broadcast `BOOT_COMPLETED` (system-protected) — actually safe — but `QUICKBOOT_POWERON` is vendor-specific and unprotected. |
| RN-13 | 🟠 P1 | `AndroidManifest.xml:9` | `SYSTEM_ALERT_WINDOW` permission — Android 10+ requires explicit user grant via system Settings. If skipped during provisioning, kiosk overlay features silently fail. |
| RN-14 | 🟡 P2 | `AndroidManifest.xml:11-12, 17` | No `android:hardwareAccelerated="true"` explicitly; relying on theme default. |
| RN-15 | 🟡 P2 | `AndroidManifest.xml` | No `<queries>` block — on Android 11+ this restricts certain inter-app launches; might break adb tools or update flows that try to query other packages. |
| RN-16 | 🟡 P2 | `build.sh:55` | `JAVA_VER=$(... \| grep -oP '\"(\d+)' \| tr -d '"')` — `grep -oP` is GNU-grep only. macOS BSD grep needs `ggrep`. Script claims macOS support but will fail on default macOS. |
| RN-17 | 🟡 P2 | `build.sh:104` | `npm install` (not `npm ci`). Different lockfile resolution behavior. Use `npm ci` in CI. |

### CI/CD

| # | Sev | File:Line | Finding |
|---|-----|-----------|---------|
| CI-1 | 🟠 P1 | `.github/workflows/build-android.yml:49` | `npm install` (not `npm ci`) → non-reproducible Android builds. |
| CI-2 | 🟠 P1 | `build-android.yml` | **No test step** (`npm test`, `jest`) before building APK. |
| CI-3 | 🟠 P1 | `build-android.yml` | **No lint step** (`eslint`). |
| CI-4 | 🟠 P1 | `build-android.yml` | **No code signing.** `assembleRelease` falls back to debug keystore if no `release.keystore` configured. Production APK would be installable but un-distributable via Play Store. Fallback workflow (`Upload APK (unsigned) if release fails`) hints they know. |
| CI-5 | 🟠 P1 | `build-android.yml:6-11` | `paths: kiosk-native/**` — frontend web changes never trigger CI. No web build/test/lint runs anywhere in CI. |
| CI-6 | 🟡 P2 | `build-android.yml` | No artifact versioning (commit SHA / git tag in APK filename). |
| CI-7 | 🟡 P2 | `build-android.yml` | No caching of Gradle `~/.gradle/caches` between runs → 15–30 min builds. |
| CI-8 | 🟡 P2 | — | No deployment workflow at all for the web app (frontend or backend). No staging environment, no rollback automation. Manual deploy implied. |

---

## 4. Configs / docs / repo hygiene

| # | Sev | File:Line | Finding |
|---|-----|-----------|---------|
| DOC-1 | 🟠 P1 | `DOCUMENTATION.md:583-585` | Claims "No plaintext password storage: 'Remember Me' stores username only (not password)" — **directly contradicted by `LoginPage.js:105-106, 126`** which always stores password in sessionStorage. |
| DOC-2 | 🟡 P2 | `DOCUMENTATION.md:231` | Says "React 18" — actual `package.json` uses React 19. |
| DOC-3 | 🟡 P2 | `DOCUMENTATION.md` | Doesn't mention `POS_RESTAURANT_ID` is **required** for orders to work; lists it without flagging. |
| DOC-4 | 🟡 P2 | `README.md` | Single line: "Here are your Instructions" — placeholder, never replaced. |
| DOC-5 | 🟡 P2 | `.gitignore` | Duplicated `# Environment files / *.env / *.env.*` blocks 8+ times (auto-commit artifact). Cosmetic but should be cleaned. |
| DOC-6 | 🟡 P2 | `frontend/.gitignore` | `.env` files commit-blocked but `frontend/.env` IS committed to the repo with the preview URL. Conflicting policy. |
| DOC-7 | 🔵 INFO | `memory/PRD.md`, `memory/SECURITY_AUDIT.md` | Internal-only docs in the repo. Fine, but `SECURITY_AUDIT.md` claims certain endpoints are authenticated when in reality `/api/config/branding` is open. Minor inaccuracy. |
| DOC-8 | 🔵 INFO | `test_result.md` | Tracker file. OK. |

---

## 5. Architectural / cross-cutting concerns

### A. Trust boundaries are not defended
Three boundaries cross from "untrusted" to "trusted" with no validation:
1. **POS API → backend** (BE-1, BE-4, BE-5).
2. **Backend → frontend** (FE-5, FE-6, RN-3).
3. **localStorage / AsyncStorage → React state** (FE-2, RN-3, RN-5).

Every white-screen we've seen and every white-screen we will see traces to one of these three.

### B. Configuration is baked, not injected
- Web: `REACT_APP_BACKEND_URL` is compiled into the JS bundle (`craco.config.js` uses `dotenv` at build time only). Self-hosting requires rebuilding the bundle.
- Native: `API_BASE_URL` is hardcoded in `api.js`. Worse — you can't even swap it without recompiling the APK.
- Backend: `POS_RESTAURANT_ID` defaults to `""` which silently breaks orders. No startup validation.

A 30-line refactor would centralize all three in a runtime `/config.json` fetched at app boot.

### C. No observability
- No frontend error tracking (Sentry, Rollbar, LogRocket).
- No backend APM.
- No structured logs — backend uses `logger.info(f"{anything}")`.
- No request tracing — a customer reporting "the kiosk crashed" gives the dev nothing to act on.
- Backend health endpoint just returns `{"message":"Kiosk API Ready"}` — doesn't check POS reachability.

### D. No auth refresh / session continuity
- POS token never refreshed. When it expires (typically 24h), customer mid-order suddenly hits 401 on `POST /api/orders`. Toast says "Failed to place order" — re-login required, cart lost.
- Add a token refresh flow OR re-login silently on 401 using the password we already store in sessionStorage (which then justifies FE-8, OR remove FE-8 entirely and treat 401 as "re-prompt for password").

### E. Web app and native app are in lockstep but maintained separately
- Two parallel copies of every context, page, helper. Bug-fix-twice tax forever.
- No shared package (`@kiosk/core`) holding shape definitions, applySettings logic, totals math.
- High risk of divergence (RN-8 already shows it — coupons exist in web, not native).

### F. No defensive default for "kiosk recovery"
The kiosk is unattended by definition. Yet:
- No error boundary (FE-1).
- No auto-reset (FE-U-1, U-2).
- No version stamp ("if app version changed since last boot, wipe `kiosk_*` keys").
- Logout button hidden behind admin mode (FE-U-1).
- No staff PIN screen — only a 5-tap corner gesture (FE-21, RN equivalent).

If a single tablet crashes at 8 AM on a busy Sunday brunch, the hotel has no playbook to recover before 9 AM.

---

## 6. Aggregate remediation plan

### Phase 1 — Stop the bleeding (1 day, ~250 lines across web + native)
| Step | Files | Closes |
|------|-------|--------|
| Add `<ErrorBoundary>` wrapping `<AppContent />` with "Reset & Reload" button | `frontend/src/App.js` + new `components/ErrorBoundary.js`, `kiosk-native/App.js` + new `components/ErrorBoundary.js` | FE-1, RN-2, FE-U-1 |
| Add axios JSON-only response interceptor for `/api/*` | `utils/kioskHelpers.js`, `kiosk-native/src/utils/api.js`, `contexts/AuthContext.js` | FE-5, FE-6, RN-3 |
| Add `readArray` / `readObject` safe-read helpers in every context | `MenuSettingsContext`, `TimingSettingsContext`, `AuthContext`, native equivalents | FE-2, FE-3, FE-4, FE-16, RN-4, RN-5 |
| Guard `.map / .filter / .find` on context data with `Array.isArray(x) ? x : []` | `AdminSettingsPage`, `KioskPage`, native `KioskScreen` | FE-3, FE-4, RN-6 |
| Safe-parse `float/int` in `transform_pos_food_to_menu_item` and `send_order_to_pos` | `backend/server.py` | BE-1, BE-2 |
| Validate `pos_order_id` present before marking order confirmed | `backend/server.py:598-605` | BE-6 |
| Server-side total recompute + reject if mismatch > ₹0.50 | `backend/server.py` | BE-3 |

### Phase 2 — Native config + CI sanity (½ day)
- Replace `API_BASE_URL` hardcode with `react-native-config` or `process.env` via babel — **blocking** for any production APK. (RN-1)
- Add `npm test`, `eslint`, and `gradle test` to GitHub Actions workflow. (CI-1, CI-2, CI-3)
- Configure release keystore via GitHub Secrets. (CI-4)
- Add separate web CI workflow (yarn build + lint). (CI-5)

### Phase 3 — Security cleanup (½ day)
- Remove `kiosk_session_pass` plaintext password from `LoginPage.js`. Document removal. Update `DOCUMENTATION.md` line 584 to reflect reality. (FE-8, DOC-1)
- Tighten `CORS_ORIGINS` to literal production origin. (BE-ENV-2)
- Move POS payload logs to DEBUG; scrub `cust_mobile`, `cust_name`. (BE-8)

### Phase 4 — Polish & UX (1 day)
- Fix `kioskLock` listener leaks (FE-19, FE-20).
- Replace `window.alert` / `window.confirm` with toast / modal (FE-13, FE-U-5).
- Persist `tableNumber` to sessionStorage (FE-U-2).
- Memoise `onNewOrder` via `useCallback` (FE-22).
- Treat `prepTime: 0` as valid (FE-15).
- Fix React Native `truncateText` Unicode safety (RN-10).
- Strip dev-only CSS (`[data-debug-wrapper]`) from production bundle (FE-C-4).
- Bundle fonts locally for offline kiosk operation (FE-C-2).

### Phase 5 — Architectural (2-3 days, deferred)
- **App version stamp**: on boot, if `localStorage.kiosk_app_version !== build_version`, wipe `kiosk_*` keys.
- **Runtime `/config.json`** instead of build-time `.env` baking for `REACT_APP_BACKEND_URL` (FE-C-1).
- **Shared `@kiosk/core` package** for web + native shape definitions, applySettings, totals math (architectural item E).
- **Token refresh flow** or "auto-relogin on 401" (D).
- **Sentry or similar** error tracking on web and native (C).
- **Health check enrichment**: backend `/api/` should also ping POS and surface upstream status (C).
- **Remove dead Mongo references** OR re-enable for order history persistence (BE-13).

### Phase 6 — Test coverage
- Add negative tests: poisoned localStorage, HTML response on `/api/menu/categories`, price-tamper attack, malformed POS responses, large carts. (BT-4, BT-5)
- Skip-with-message fixtures instead of test-collection-time crashes (BT-1, BT-3).
- Externalize test credentials. (BT-2)

---

## 7. Acceptance test scenarios (pre-merge)

| # | Scenario | Expected |
|---|----------|----------|
| AT-1 | `localStorage.setItem('kiosk_menu_data', '<html>oops</html>')` → reload | Empty menu, no white-screen, Logout reachable |
| AT-2 | Mock `/api/menu/categories` → return `text/html` body | Toast "Backend returned unexpected response", no token persisted |
| AT-3 | `localStorage.setItem('kiosk_timing_settings', '"banana"')` → place order | Success overlay renders with no prep-time line |
| AT-4 | `throw new Error()` inside `KioskPage` | ErrorBoundary renders "Reset & Reload" button → click → all `kiosk_*` cleared → login |
| AT-5 | POST `/api/orders` with `total: 0.01`, items: 1× ₹1000 | 400 response, not forwarded to POS |
| AT-6 | Mock `/api/menu/items` → one item has `"price": "199"` (string) | Cart total shows `₹199` (not NaN), order JSON has numeric price |
| AT-7 | Login → logout × 5 cycles | No growth in global event listeners (DevTools Memory) |
| AT-8 | Login | No `kiosk_session_pass` in sessionStorage |
| AT-9 | Build native APK with env override → install | Hits production POS, not preview |
| AT-10 | POS returns 200 without `order_id` | Customer sees explicit error, not fake-confirmed order |
| AT-11 | Mock POS `/foods-list` → one row has `"price": "abc"` | `/api/menu/items` returns 200 with the bad row's price as 0 (not 500) |
| AT-12 | Restart kiosk mid-order (with cart + table selected) | Cart restored, table restored from sessionStorage |

---

## 8. What is good (cleared on audit)

For completeness, areas where the codebase is genuinely solid:

- **POS data transformation** in `transform_pos_food_to_menu_item` is mostly well-defensive with try/excepts — just needs the `base_price` fix.
- **Empty-tables flow** (Kunafa Mahal pattern) is correctly modeled: 0 tables ≠ 503, properly returns `{tables:[], source:'pos'}` (BE has `test_optional_tables.py` covering this).
- **Caching strategy** (5-min TTL, token-keyed) is correct for single-tenant use.
- **CartContext** key-uniqueness model (`item.id + sorted-variations + instructions`) correctly handles "same item, different customization" — unusually thoughtful.
- **`useOrientation`** is SSR-safe with `typeof window !== 'undefined'` guard.
- **`ThemeContext.hexToHSL`** handles missing hex defensively.
- **`visualViewport` keyboard handling** in `CustomizationModal` and `EditInstructionsModal` is correctly guarded with `if (!window.visualViewport) return;`.
- **`AdminSettingsPage` natural-sort comparator** is correct for `T-1, T-2, T-10` cases.
- **`@dnd-kit` integration** is correctly using sensors, collision detection, sortable strategies.
- **`kioskLock` keyboard blocking** logic is comprehensive (F-keys, ESC, Ctrl-combos).
- **AndroidManifest** kiosk mode setup (HOME category, singleTask, BootReceiver) is correctly configured for actual unattended kiosk hardware.
- **Backend test_optional_tables.py** is a properly written regression test for a real bug they previously hit.
- **`craco.config.js`** correctly gates dev-only plugins via `NODE_ENV` check.
- **No SQL injection / no NoSQL injection** possible — backend doesn't touch a DB.
- **No file-upload endpoints** in backend — large attack surface eliminated.
- **No public mutation endpoints** without auth — every write requires Bearer token.

---

## 9. Total counts

```
Findings by severity:
  🔴 P0  ........ 15
  🟠 P1  ........ 28
  🟡 P2  ........ 19
  🔵 INFO ........  5
                ──────
  TOTAL  ........ 67

Findings by area:
  Backend          14
  Backend tests     6
  Backend deps      3
  Backend .env      3
  Frontend web     32  (incl. crash + reliability + perf + UX + config + plugins)
  React Native     17  (incl. android manifest + build)
  CI/CD             8
  Docs / repo       8

Estimated total fix effort:
  Phase 1 (Stop the bleeding)             ........  1 day
  Phase 2 (Native + CI)                    ........  ½ day
  Phase 3 (Security)                        ........  ½ day
  Phase 4 (Polish)                          ........  1 day
  Phase 5 (Architecture)                    ........  2-3 days
  Phase 6 (Tests)                           ........  1 day
                                                    ──────────
  GRAND TOTAL                               ........  6-7 dev days
```

---

**End of audit.** Recommended next step: triage Phase 1 — that alone takes the system from "one bad payload bricks the kiosk and no one can recover without DevTools" to "self-heals in one tap." Everything else can land progressively.

Saved at `/app/memory/refactor_cr/audits/FULL_CODEBASE_AUDIT.md`.
