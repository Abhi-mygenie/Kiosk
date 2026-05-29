# Kiosk App — Master Execution Plan

**Repo:** `Abhi-mygenie/Kiosk@14march`
**Plan date:** 2026-05-30
**Source audits this plan consolidates:**
- `/app/memory/CRASH_AUDIT.md` — the kiosk-bricking class of bug (33 findings)
- `/app/memory/FULL_CODEBASE_AUDIT.md` — every stability/security gap (67 findings)
- `/app/memory/REFACTOR_AUDIT.md` — architecture & code-reuse (57 findings)

**Total scope:** 10 phases, ~14–17 dev-days, broken into shippable increments.

---

## Legend

| Agent | What it does | When to use |
|---|---|---|
| **E1 (main)** | Plans & writes code, edits files, runs supervisor, smoke-tests via curl/screenshots | Implementation phases |
| **testing_agent_v3** | End-to-end + integration + regression testing via Playwright/curl/pytest | After every phase that changes user-visible behavior or APIs |
| **integration_playbook_expert_v2** | Generates verified integration playbooks (Stripe, OAuth, LLMs, etc.) | Phases that add Stripe/auth/3rd-party (none in current plan; here for completeness) |
| **troubleshoot_agent** | Read-only deep RCA when something is stuck after ≥2 fix attempts | Escalation only |
| **deployment_agent** | Native deployment issue triage (env vars, hardcoded URLs, disk) | Phase 2 native APK signing + URL refactor |
| **design_agent_full_stack** | UI/UX redesign blueprints | Not used — this is a stability+refactor plan, not a redesign |
| **support_agent** | Platform capability / Github push / rollback questions | If user has process questions |

> Rule of thumb: **E1 implements, testing_agent_v3 verifies.** Other agents are escalation paths.

---

## Phase index

| # | Phase | Effort | Risk | Customer-visible? | Status |
|---|-------|--------|------|--------------------|--------|
| **P1** | Stop the bleeding — crash safety net | 1 day | Low | ✅ Self-recovery |  ☐ Not started |
| **P2** | Backend hardening — POS data + order verification | 1.5 days | Low | ⚠️ Subtle (orders) |  ☐ |
| **P3** | Native APK deployable — kill hardcoded URL | ½ day | Med | ⚠️ Required before APK ship |  ☐ |
| **P4** | Security cleanup — password, CORS, PII logs | ½ day | Low | ❌ |  ☐ |
| **P5** | CI/CD baseline — tests, lint, sign, web pipeline | 1 day | Low | ❌ |  ☐ |
| **P6** | UX polish — listener leaks, NaN UI, dialogs, fonts | 1 day | Low | ✅ Subtle |  ☐ |
| **P7** | Backend modularize — `server.py` → modules + tests | 1.5 days | Med | ❌ |  ☐ |
| **P8** | Web component dedup + routing + hooks-ify | 1.5 days | Med | ⚠️ Behaviour identical |  ☐ |
| **P9** | `packages/kiosk-core` — shared web/native | 3–4 days | High | ⚠️ Behaviour identical |  ☐ |
| **P10** | Backend test pyramid + monitoring | 1 day | Low | ❌ |  ☐ |
| | **TOTAL** | **~13–14 days** | | | |

**Independent shippable increments.** Each phase is mergeable on its own. Phases 1–6 can run before any refactor; phases 7–10 are the structural cleanup.

---

## P1 — Stop the bleeding (1 day)

**Owner:** E1  **Tester:** testing_agent_v3  **Risk:** Low (additive code, no behavior change)

### Goal
Convert the entire class of "one bad payload bricks the kiosk forever" into a one-tap recoverable state.

### Deliverables
- [ ] `components/ErrorBoundary.jsx` — catches all renders, shows logo + "Reset Kiosk" button that clears `kiosk_*` storage and reloads
- [ ] Wrap `<AppContent />` in `<ErrorBoundary>` (`App.js`)
- [ ] `utils/api.js` axios interceptor — rejects `/api/*` responses with non-JSON content-type
- [ ] `utils/safeRead.js` — `readArray(key)` / `readObject(key)` with try/catch + shape validation
- [ ] Refactor `AuthContext`, `MenuSettingsContext`, `TimingSettingsContext` to use `safeRead`
- [ ] Add `Array.isArray(x) ? x : []` guards on every `.map / .filter / .find / .reduce` site touching `menuData.*` or `settings.*`
- [ ] Persistent "Logout" button visible **outside** admin lock when ErrorBoundary triggers (recovery without admin unlock)

### Files touched (web)
- New: `frontend/src/components/ErrorBoundary.jsx`, `frontend/src/utils/safeRead.js`
- Modified: `App.js`, `contexts/AuthContext.js`, `contexts/MenuSettingsContext.js`, `contexts/TimingSettingsContext.js`, `pages/AdminSettingsPage.js`, `pages/KioskPage.js`, `utils/kioskHelpers.js`

### What testing_agent_v3 verifies
| Test ID | Scenario | Pass criteria |
|---|---|---|
| P1.T1 | `localStorage.setItem('kiosk_menu_data', '<html>oops</html>')` then reload | Login page renders, no white screen, no console fatal |
| P1.T2 | Mock `/api/menu/categories` → `Content-Type: text/html` body | Toast "Backend returned unexpected response", no token persisted |
| P1.T3 | `localStorage.setItem('kiosk_timing_settings', '"banana"')` then place order | SuccessOverlay renders without crashing |
| P1.T4 | Inject `throw new Error()` into `KioskPage` | ErrorBoundary fallback shown with "Reset Kiosk" button → click → all `kiosk_*` keys cleared → login page |
| P1.T5 | Happy path: login → browse menu → place order | No regression |

### Phase 1 done when
All 5 tests pass; manual screenshot of ErrorBoundary fallback confirms it's readable; no console errors during regression.

---

## P2 — Backend hardening (1.5 days)

**Owner:** E1  **Tester:** testing_agent_v3 (backend-only)  **Risk:** Low (additive validation)

### Goal
POS data quirks and price-tampering attacks fail gracefully, not as 500s or accepted-low-price orders.

### Deliverables
- [ ] Safe-parse all `float()` / `int()` in `transform_pos_food_to_menu_item` (mirror the pattern used for `kcal`)
- [ ] Validate `pos_data["order_id"]` is present before returning `confirmed` — else 502 with clear error
- [ ] Server-side recompute `total = subtotal + cgst + sgst - discount` in `POST /api/orders`; reject if client `total` mismatches by > ₹0.50
- [ ] Wrap `data["data"]["tables"]` access in safe lookup
- [ ] Wrap `food["category"]` access in safe lookup
- [ ] `Settings` Pydantic class validates `POS_RESTAURANT_ID`, `POS_API_BASE_URL`, `POS_API_V2_URL` at startup; logs clear errors and refuses to start if missing
- [ ] Add a `tests/unit/test_transforms.py` skeleton (full coverage in P10)

### Files touched (backend)
- Modified: `backend/server.py`
- New: `backend/app/config.py` (Settings class) — or inline if not modularizing yet
- New: `backend/tests/unit/test_transforms.py`

### What testing_agent_v3 verifies
| Test ID | Scenario | Pass criteria |
|---|---|---|
| P2.T1 | Mock POS `/foods-list` → one item has `"price": "abc"` | `/api/menu/items` returns 200; bad row's `price` is 0; other rows OK |
| P2.T2 | POST `/api/orders` with `total: 0.01`, cart subtotal ₹1000 | 400 response; POS not called |
| P2.T3 | Mock POS order response with no `order_id` and no `id` | `/api/orders` returns 502 with explicit error message |
| P2.T4 | Mock POS `/table-config` → `{"data": null}` | `/api/tables` returns 503 (not 500) with clear message |
| P2.T5 | Start backend with `POS_RESTAURANT_ID=""` | Process exits with non-zero code + clear log |
| P2.T6 | Existing pytest suite (3 files) | All pass |

### Phase 2 done when
All 6 tests pass; preprod regression (Hyatt + Kunafa logins, menu fetch, real order placement) green.

---

## P3 — Native APK deployable (½ day)

**Owner:** E1 + **deployment_agent** for any URL-baking issues  **Tester:** Manual (APK on device)  **Risk:** Med (touches build pipeline)

### Goal
Native APK reads backend URL from runtime config, not from `api.js` hardcode. Ships to any restaurant by changing env, not by recompiling.

### Deliverables
- [ ] Install `react-native-config` in `kiosk-native/KioskApp/`
- [ ] Add `.env.example` listing `API_BASE_URL`
- [ ] Replace `export const API_BASE_URL = 'https://...preview.emergentagent.com'` in `src/utils/api.js` with `Config.API_BASE_URL`
- [ ] Update `BUILD_GUIDE.md` with per-restaurant `.env` instructions
- [ ] Verify `android/app/src/main/AndroidManifest.xml` `usesCleartextTraffic` resolves to `false` for release builds
- [ ] Build a debug APK pointing at `https://preprod.mygenie.online` to prove the env injection works
- [ ] Build a debug APK pointing at `http://10.0.2.2:8001` (Android emulator local) — proves it's truly runtime-configurable

### Files touched (native)
- Modified: `kiosk-native/KioskApp/src/utils/api.js`, `BUILD_GUIDE.md`, `android/app/build.gradle`
- New: `kiosk-native/KioskApp/.env.example`, `kiosk-native/KioskApp/.env`
- Modified: `.gitignore` to exclude native `.env` but include `.env.example`

### What gets verified
| Test ID | Scenario | Pass criteria |
|---|---|---|
| P3.T1 | Build APK with `API_BASE_URL=https://kiosk-app.mygenie.online` | Install on device → app hits prod backend |
| P3.T2 | Build APK with different URL | Confirms URL is not baked anywhere |
| P3.T3 | Grep built APK for `preview.emergentagent.com` | Zero hits |

> **Deployment subagent** consulted if URL bake-in persists (it has tools to verify env propagation).

### Phase 3 done when
A single APK build can be parameterized per-restaurant via env var; manual install on an Android tablet confirms working API calls.

---

## P4 — Security cleanup (½ day)

**Owner:** E1  **Tester:** testing_agent_v3 (security checks)  **Risk:** Low

### Goal
Close the password-in-sessionStorage gap, tighten CORS, scrub PII from logs.

### Deliverables
- [ ] Remove `kiosk_session_pass` writes and reads from `LoginPage.js`
- [ ] Update `DOCUMENTATION.md:583-585` to match reality ("Remember Me stores username only; password is never persisted")
- [ ] Set production `CORS_ORIGINS=https://kiosk-app.mygenie.online` in backend `.env`
- [ ] Demote `logger.info(f"POS Buffet Order Payload: ...")` to `logger.debug` in `server.py`
- [ ] Scrub `cust_mobile` and `cust_name` from any INFO-level log lines

### Files touched
- Modified: `frontend/src/pages/LoginPage.js`, `backend/server.py`, `backend/.env`, `DOCUMENTATION.md`

### What testing_agent_v3 verifies
| Test ID | Scenario | Pass criteria |
|---|---|---|
| P4.T1 | Login flow → check `sessionStorage` | No `kiosk_session_pass` key exists |
| P4.T2 | Grep frontend bundle for `kiosk_session_pass` | Zero hits |
| P4.T3 | Cross-origin request from `https://attacker.com` to `/api/auth/login` | Blocked by CORS |
| P4.T4 | Place test order → check backend logs | No `cust_mobile` / `cust_name` in INFO logs |

### Phase 4 done when
All 4 tests pass; documentation accurately reflects implementation.

---

## P5 — CI/CD baseline (1 day)

**Owner:** E1  **Tester:** GitHub Actions CI (auto-runs)  **Risk:** Low

### Goal
Frontend changes get build-tested; native APK gets signed; release artifacts are reproducible.

### Deliverables
- [ ] Replace `npm install` → `npm ci` in `.github/workflows/build-android.yml`
- [ ] Add `npm test -- --watchAll=false` step before APK build
- [ ] Add ESLint step (`npx eslint src/`)
- [ ] Configure release keystore via GitHub Secrets (`SIGNING_KEY_BASE64`, `SIGNING_KEY_ALIAS`, `SIGNING_KEY_PASSWORD`)
- [ ] Tag artifacts with commit SHA: `KioskApp-${{ github.sha }}.apk`
- [ ] Cache `~/.gradle/caches` between runs
- [ ] **New workflow** `.github/workflows/web-ci.yml`:
  - On push/PR touching `frontend/**`
  - Run `yarn install --frozen-lockfile`, `yarn build`, `yarn lint` (configure ESLint properly first)
- [ ] **New workflow** `.github/workflows/backend-ci.yml`:
  - Run `pytest backend/tests/unit/` (fast, mocked)
  - Run `ruff check backend/`

### Files touched
- Modified: `.github/workflows/build-android.yml`
- New: `.github/workflows/web-ci.yml`, `.github/workflows/backend-ci.yml`

### What gets verified
Open a test PR; confirm all 3 workflows trigger appropriately and pass.

### Phase 5 done when
- Any frontend PR triggers web build + lint.
- Any backend PR triggers backend unit tests + lint.
- Any native PR produces a signed, versioned APK as artifact.

---

## P6 — UX polish (1 day)

**Owner:** E1  **Tester:** testing_agent_v3 + screenshot verification  **Risk:** Low

### Goal
Address the cluster of P1/P2 reliability/UX findings that don't fit cleanly elsewhere.

### Deliverables
- [ ] Convert `kioskLock` singleton → `useKioskLock()` hook with proper cleanup
- [ ] Convert `touchSound` singleton → `useTouchSound()` hook
- [ ] Replace `window.alert(...)` in `CustomizationModal` with toast notification
- [ ] Replace `window.confirm(...)` in `kioskLock.js` admin-unlock with a styled modal
- [ ] Persist `tableNumber` to `sessionStorage` (reload-survives)
- [ ] Wrap `onNewOrder` in `useCallback` in `KioskPage` (fixes SuccessOverlay countdown)
- [ ] Fix `prepTime: 0` falsy bug in `TimingSettingsPage`
- [ ] Bundle Google Fonts locally (`Big Shoulders Display`, `Montserrat`) — offline-safe
- [ ] Strip `[data-debug-wrapper]` dev-only CSS from production bundle (PostCSS plugin gated by `NODE_ENV`)
- [ ] Fix `kioskLock` 5-tap vs comment-says-3-tap mismatch (align both to 5 + correct comment)
- [ ] Defensive: cart `find` by `cartId` not `id` in MenuCard badge logic (correct in-cart highlight)

### Files touched
- Modified: `utils/kioskLock.js` → `hooks/useKioskLock.js`, `utils/touchSound.js` → `hooks/useTouchSound.js`
- Modified: `components/kiosk/CustomizationModal.js`, `pages/KioskPage.js`, `pages/TimingSettingsPage.js`
- Modified: `components/kiosk/PortraitMenuCard.js`, `components/kiosk/LandscapeMenuCard.js`
- Modified: `index.css`, `craco.config.js`
- New: `public/fonts/*` (downloaded font files)

### What testing_agent_v3 verifies
| Test ID | Scenario | Pass criteria |
|---|---|---|
| P6.T1 | Login → logout cycle ×5 | No growth in DOM event listeners (DevTools Memory) |
| P6.T2 | CustomizationModal with required variation not selected → click Add | Toast appears, no native alert |
| P6.T3 | Mid-order → set table T-5 → reload page | Table T-5 still selected |
| P6.T4 | Place order → SuccessOverlay countdown 15→0 | Smooth countdown, no resets |
| P6.T5 | Set prepTime to 0 in TimingSettings → save → place order | SuccessOverlay shows prep time of 0 (or hides), not "10" |
| P6.T6 | Block fonts.googleapis.com → reload kiosk | Heading font still loads (from local bundle) |
| P6.T7 | Production build → grep CSS for `data-debug-wrapper` | Zero hits |

### Phase 6 done when
All 7 tests pass; manual screenshot confirms styled modals replace native alerts.

---

## P7 — Backend modularize (1.5 days)

**Owner:** E1  **Tester:** testing_agent_v3 (regression on all 7 endpoints)  **Risk:** Med (refactor with no behavior change)

### Goal
Break `server.py` into modules so the transform layer is unit-testable in isolation. No API behavior change.

### Deliverables
- [ ] Split `backend/server.py` into:
  - `backend/app/main.py` (FastAPI factory)
  - `backend/app/config.py` (Settings — already started in P2)
  - `backend/app/models/` (menu, cart, auth, branding)
  - `backend/app/pos/` (client, auth, menu, tables, orders, transforms)
  - `backend/app/cache.py` (per-token TTL cache replacing module globals)
  - `backend/app/routes/` (auth, menu, tables, orders, branding)
  - `backend/app/services/order_service.py` (server-side total verification from P2)
- [ ] Use Pydantic models as `response_model=` on every route
- [ ] Decide on Mongo: delete commented code + `motor`/`pymongo` deps OR re-enable
- [ ] Split `requirements.txt` into `requirements.txt` (runtime) + `requirements-dev.txt` (pytest, black, mypy, isort, flake8)
- [ ] Run `pip freeze > requirements.txt` after split to lock versions

### Files touched
- Heavy: `backend/` directory restructure
- `backend/requirements.txt`, new `backend/requirements-dev.txt`

### What testing_agent_v3 verifies
| Test ID | Scenario | Pass criteria |
|---|---|---|
| P7.T1 | All existing pytest e2e tests (`test_kiosk_refactor.py`, `test_optional_tables.py`, `test_security_and_env.py`) | All pass |
| P7.T2 | Curl each of 7 endpoints with valid Hyatt token | Same JSON shape as before refactor (snapshot test) |
| P7.T3 | New unit tests in `tests/unit/test_transforms.py` | At least 1 test per transform helper (parse_price, parse_variations, parse_addons, parse_calories, assemble_menu_item) |
| P7.T4 | Frontend smoke test against new backend | Login → menu → order; no behavior delta |

### Phase 7 done when
All tests pass; `server.py` no longer exists at top of backend; new structure documented in `backend/README.md`.

---

## P8 — Web component dedup + routing + hooks-ify (1.5 days)

**Owner:** E1  **Tester:** testing_agent_v3 (UI regression on portrait + landscape orientations)  **Risk:** Med

### Goal
Kill the Portrait/Landscape duplication inside web; switch to real React Router routes; clean up provider composition.

### Deliverables
- [ ] Merge `PortraitMenuCard` + `LandscapeMenuCard` → `<MenuCard variant>` (~120 LOC removed)
- [ ] Extract cart row from `InlineCartItem` + landscape inline JSX → `<CartRow layout>` (~80 LOC removed)
- [ ] Split `KioskPage.js` (404 lines) into:
  - `pages/kiosk/KioskPage.jsx` (orchestrator, ~80 lines)
  - `pages/kiosk/PortraitKiosk.jsx` (~150 lines)
  - `pages/kiosk/LandscapeKiosk.jsx` (~150 lines)
- [ ] Extract `SortableCategoryItem` + `SortableMenuItem` from `AdminSettingsPage.js` (page drops from 451 → ~180 lines)
- [ ] Extract `LoadingOverlay` from `LoginPage.js` into `components/auth/LoadingOverlay.jsx`
- [ ] Convert `App.js` manual `activeView` state → `react-router-dom` routes (`/login`, `/admin/menu`, `/admin/timing`, `/kiosk`)
- [ ] Wrap all 5 providers in a single `<KioskCoreProvider>` composition component (7-level nesting → 1)

### Files touched
- Heavy refactor: `pages/KioskPage.js`, `pages/AdminSettingsPage.js`, `pages/LoginPage.js`, `App.js`
- New: `pages/kiosk/PortraitKiosk.jsx`, `pages/kiosk/LandscapeKiosk.jsx`, `components/admin/Sortable*.jsx`, `components/auth/LoadingOverlay.jsx`, `state/KioskCoreProvider.jsx`, `routes.jsx`
- Merge: `components/kiosk/MenuCard.jsx`, `components/kiosk/CartRow.jsx` (replacing 3 existing files)

### What testing_agent_v3 verifies
| Test ID | Scenario | Pass criteria |
|---|---|---|
| P8.T1 | All P1.T1–T5 tests | Still pass (no regression) |
| P8.T2 | Visual diff: Portrait Kiosk @ 768×1024 | Pixel-identical to before refactor (screenshot) |
| P8.T3 | Visual diff: Landscape Kiosk @ 1920×1080 | Pixel-identical |
| P8.T4 | Visual diff: AdminSettings drag & drop | Functional + visual parity |
| P8.T5 | Browser back button on `/admin/menu` | Navigates to `/kiosk` correctly |
| P8.T6 | Direct URL `/admin/timing` from login | Redirects to login first, then navigates after auth |
| P8.T7 | Full happy path (login → admin → kiosk → order) | Works in both portrait + landscape |

### Phase 8 done when
All 7 tests pass; line count of `pages/` directory drops by ~30%; no visual regressions.

---

## P9 — `packages/kiosk-core` shared package (3–4 days)

**Owner:** E1  **Tester:** testing_agent_v3 (parallel web + native regression)  **Risk:** High (largest blast radius — touches both apps)

### Goal
Kill ~1,400 LOC of web↔native duplication. Single source of truth for business logic.

### Sub-phases (sequential, each independently mergeable):

#### P9a — Monorepo setup (½ day)
- [ ] Convert repo to `pnpm` workspace (`pnpm-workspace.yaml`)
- [ ] Move `frontend/` → `apps/web/`
- [ ] Move `kiosk-native/KioskApp/` → `apps/native/`
- [ ] Create `packages/kiosk-core/` skeleton with `package.json`, `tsconfig.json`, empty `src/index.ts`
- [ ] Verify `apps/web` and `apps/native` still build identically post-move
- [ ] Update CI workflows to use new paths

#### P9b — Move pure functions (1 day)
- [ ] `cartMath.ts` — `subtotalOf(cart)`, `taxesOf(subtotal)`, `grandTotalOf(cart, coupon?)`
- [ ] `pricing.ts` — `normalizePrice`, `formatINR`
- [ ] `menuTransforms.ts` — `applySettings(categories, items, settings)`
- [ ] `shifts.ts` — `getCurrentPrepTime(shifts, now)`, `validateShift`
- [ ] `orderBuilder.ts` — `buildOrderPayload(cart, table, totals, customer)`
- [ ] Tests for all of the above (~50 unit tests, runs in <2s)
- [ ] Web and native both import these instead of duplicating

#### P9c — Schemas (½ day)
- [ ] Install `zod` in `kiosk-core`
- [ ] Schemas for `LoginResponse`, `CategoriesResponse`, `MenuItemsResponse`, `TablesResponse`, `OrderResponse`, `BrandingResponse`
- [ ] Both apps use `Schema.safeParse()` on every API response (replaces P1's content-type interceptor with full shape validation)

#### P9d — Adapters + hooks (1 day)
- [ ] `adapters/Storage.ts` interface (`getJson`, `setJson`, `remove`, `clearAll`)
- [ ] `adapters/Http.ts` interface (`get(url, token?)`, `post(url, body, token?)`)
- [ ] `hooks/useAuthCore.ts` — accepts adapters, returns `{ user, login, logout, refreshMenuData, isLoading }`
- [ ] `hooks/useCartCore.ts` — accepts no adapters (pure state)
- [ ] `hooks/useMenuSettingsCore.ts` — accepts storage adapter
- [ ] `hooks/useTimingSettingsCore.ts` — accepts storage adapter

#### P9e — Migrate apps to use core (1 day)
- [ ] `apps/web/src/adapters/localStorage.ts` + `axios.ts`
- [ ] `apps/native/src/adapters/asyncStorage.ts` + `axios.ts`
- [ ] Web `AuthProvider` thin wrapper calling `useAuthCore({ storage, http })`
- [ ] Native `AuthProvider` thin wrapper calling same
- [ ] Same for Cart, MenuSettings, TimingSettings contexts
- [ ] Delete `apps/web/src/contexts/*` and `apps/native/src/contexts/*` duplicate logic (becomes ~15 lines each)

### Files touched
Massive — full repo restructure. Tracked via per-sub-phase PRs.

### What testing_agent_v3 verifies (after each sub-phase)
| Test ID | Scenario | Pass criteria |
|---|---|---|
| P9.T1 | All P7.T* backend tests | Still pass (no backend change) |
| P9.T2 | All P8.T* web UI tests | Still pass (web behavior identical) |
| P9.T3 | Native APK builds and installs | Login → menu → order works |
| P9.T4 | `pnpm test --filter @kiosk/core` | All 50+ unit tests pass |
| P9.T5 | Change `kiosk-core` cartMath → web + native both see fix without code changes in apps | Validates dedup works |
| P9.T6 | Coverage report on `kiosk-core` | >80% line coverage |

### Phase 9 done when
- `packages/kiosk-core` exists, builds, tests green.
- Both apps consume it.
- Web web-CI and native APK CI both green.
- Manual smoke test: place an order on web; place the same order on native APK; backend logs are byte-identical.

---

## P10 — Backend test pyramid + monitoring (1 day)

**Owner:** E1  **Tester:** testing_agent_v3 + ongoing observability  **Risk:** Low

### Goal
Make future bugs detectable and diagnoseable.

### Deliverables
- [ ] `backend/tests/conftest.py` — shared fixtures (`auth_token_hyatt`, `auth_token_kunafa`, `pos_mock`)
- [ ] `backend/tests/unit/` — full unit coverage of `pos/transforms.py` (started in P2/P7)
- [ ] `backend/tests/integration/` — FastAPI `TestClient` with mocked `PosClient` — covers all 7 endpoints
- [ ] `backend/tests/e2e/` — current pytest files, marked `@pytest.mark.e2e`, run only in CI nightly
- [ ] Backend health endpoint `/api/health` — pings POS upstream, returns `{ status, pos_reachable, cache_age }`
- [ ] Structured logging — JSON logs with `request_id`, `user_email`, `endpoint`, `latency_ms`
- [ ] (Optional) Sentry SDK for backend + web + native

### What testing_agent_v3 verifies
| Test ID | Scenario | Pass criteria |
|---|---|---|
| P10.T1 | `pytest backend/tests/unit/` | All pass in <3s |
| P10.T2 | `pytest backend/tests/integration/` | All pass in <10s |
| P10.T3 | `curl /api/health` with POS reachable | 200 + `pos_reachable: true` |
| P10.T4 | `curl /api/health` with POS blocked | 503 + `pos_reachable: false` |
| P10.T5 | Backend logs of a single order request | All log lines share same `request_id` |

### Phase 10 done when
- Unit + integration tests run on every backend PR (CI from P5).
- `/api/health` actively exercised by uptime monitoring.
- (Optional) Sentry receiving errors from both apps.

---

## Cross-cutting tracking table — SINGLE SOURCE OF TRUTH

Status values: `☐ Not started` · `🔵 Entry Gate pending` · `🟡 In progress` · `🟠 Testing` · `🔴 Failed Exit Gate — rework` · `✅ Merged & verified` · `↩️ Rolled back`

| Phase | Status | Branch | PR # | Entry Gate | Exit Gate | Tested by | Test report |
|---|---|---|---|---|---|---|---|
| P1 | 🔵 Entry Gate pending | `cr/phase-1-safety` | – | ☐ awaiting user "go" | ☐ | testing_agent_v3 | – |
| P2 | ☐ Not started | `cr/phase-2-backend-hardening` | – | ☐ | ☐ | testing_agent_v3 | – |
| P3 | ☐ Not started | `cr/phase-3-native-config` | – | ☐ | ☐ | E1 manual + deployment_agent | – |
| P4 | ☐ Not started | `cr/phase-4-security` | – | ☐ | ☐ | testing_agent_v3 | – |
| P5 | ☐ Not started | `cr/phase-5-cicd` | – | ☐ | ☐ | GitHub Actions | – |
| P6 | ☐ Not started | `cr/phase-6-ux-polish` | – | ☐ | ☐ | testing_agent_v3 | – |
| P7 | ☐ Not started | `cr/phase-7-backend-modules` | – | ☐ | ☐ | testing_agent_v3 | – |
| P8 | ☐ Not started | `cr/phase-8-web-dedup` | – | ☐ | ☐ | testing_agent_v3 | – |
| P9a | ☐ Not started | `cr/phase-9a-monorepo` | – | ☐ | ☐ | testing_agent_v3 | – |
| P9b | ☐ Not started | `cr/phase-9b-pure-fns` | – | ☐ | ☐ | testing_agent_v3 | – |
| P9c | ☐ Not started | `cr/phase-9c-schemas` | – | ☐ | ☐ | testing_agent_v3 | – |
| P9d | ☐ Not started | `cr/phase-9d-hooks` | – | ☐ | ☐ | testing_agent_v3 | – |
| P9e | ☐ Not started | `cr/phase-9e-migrate` | – | ☐ | ☐ | testing_agent_v3 | – |
| P10 | ☐ Not started | `cr/phase-10-tests-monitoring` | – | ☐ | ☐ | testing_agent_v3 | – |

---

## Two recommended cuts

### Cut A — "Production-safe in 1 sprint" (5 days)
**P1 → P2 → P4 → P3 → P5** (in this order)

Net effect: every white-screen recoverable in one tap; orders can't be tampered; native APK can ship to any restaurant; security claims match reality; CI prevents regressions.

### Cut B — "Production-safe + scalable" (10 days)
**Cut A + P6 → P7 → P8 → P10**

Adds UX polish, backend modularization (enables unit testing of transforms), and observability. Doesn't yet kill web↔native dedup but unblocks it.

### Cut C — "Full plan" (14 days)
Cut B + **P9** (kiosk-core extraction). After this, web + native are maintained from one codebase.

---

## Decision points the user owns (not automatable)

| Decision | Needed before | Default if not decided |
|---|---|---|
| Are we keeping React Native? (vs PWA) | P9a | Keep (audit assumes yes) |
| TypeScript vs JavaScript for `kiosk-core`? | P9a | TypeScript (better schema ergonomics) |
| `pnpm` vs `yarn workspaces` vs `nx` vs `turbo`? | P9a | `pnpm workspaces` (simplest) |
| Keep Mongo dependency or delete? | P7 | Delete (current code never touches it) |
| Add Sentry/equivalent? | P10 | Yes — frontend Sentry is ~$0 for kiosk-scale traffic |
| Single restaurant per backend or multi-tenant? | P7 | Single (mirrors current usage; multi-tenant would invalidate cache strategy) |

---

## How to kick off Phase 1 right now

Just tell me **"start Phase 1"** and I will:

1. Read the current state of the 7 files Phase 1 touches.
2. Implement the ErrorBoundary, safeRead helpers, axios interceptor, and guards.
3. Hand off to **testing_agent_v3** with the 5 P1 test scenarios.
4. Fix anything testing_agent_v3 surfaces.
5. Update `PRD.md` + this tracker with Phase 1 status.
6. Summarise via the `finish` tool and wait for your green light to move to Phase 2.

Each phase follows the same loop: **E1 implement → testing_agent_v3 verify → fix → finish → wait for go-ahead**.

---

**End of plan.** Saved at `/app/memory/EXECUTION_PLAN.md`.
