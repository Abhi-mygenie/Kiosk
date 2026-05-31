# HANDOVER NOTES — Kiosk Self-Ordering App

**Prepared for:** Next deployment / dev agent
**Source repo:** https://github.com/Abhi-mygenie/Kiosk.git
**Branch pulled:** `14march` (latest commit `b667ab5` @ 2026-03-17 19:13 UTC)
**Date of initial handover:** 2026-05-29
**Last updated:** 2026-05-30 (CR Phase 1 closed)
**Environment:** Emergent preview pod (Kubernetes container, FastAPI + React + MongoDB base image)

> ⚠️ **An active multi-phase REFACTOR CR is paused mid-execution.** It has its own governance under `/app/memory/refactor_cr/`. If you are continuing that work, run `/app/scripts/refactor_cr_status.sh` and read `/app/memory/refactor_cr/STATUS.md`. For any other work (new features, bug fixes, etc.), proceed normally — the refactor control layer does NOT apply.

---

## 0. Where the CR stands today (2026-05-30)

| Phase | Status |
|---|---|
| **P1** Stop the bleeding (ErrorBoundary + safeRead + axios guard) | ✅ Merged & verified — commit `b82815b` |
| **P2** Backend hardening | 🔵 Contract drafted, awaiting user "go" |
| P3–P10 | ☐ Planned, not started |

**Active branch:** `cr/phase-1-safety` (do not return to `main` until ready to ship P1)

---

## 1. Current Status: ✅ RUNNING

| Service  | Status   | Port (internal) | Verified                                |
|----------|----------|-----------------|-----------------------------------------|
| backend  | RUNNING  | 8001            | `GET /api/` → `{"message":"Kiosk API Ready"}` |
| frontend | RUNNING  | 3000            | HTTP 200, login UI renders (Hyatt Centric branding) |
| mongodb  | RUNNING  | 27017           | Idle — backend does **not** use Mongo (proxy-only app) |

**Public preview URL:** `https://kiosk-branch.preview.emergentagent.com`

### What was verified end-to-end
- Backend health endpoint responds.
- Login proxy works: `POST /api/auth/login` against `manager@hyattcandolim.com / Qplazm@10` returns a valid POS bearer token.
- Frontend builds, hot-reloads, and renders the Welcome Back / Sign In screen.
- Branding endpoint `/api/config/branding` returns the default theme.

### What was NOT verified (needs config — see §5)
- Placing an order (`POST /api/orders`) → requires `POS_RESTAURANT_ID` to be set.
- Native Android build (the repo also contains `kiosk-native/` for an APK build via GitHub Actions / EAS / local gradle).

---

## 2. Architecture (recap)

```
Browser / Tablet (React, port 3000)
        │  REACT_APP_BACKEND_URL → /api/*
        ▼
FastAPI backend  (proxy + cache, port 8001)
        │  POS_API_BASE_URL / POS_API_V2_URL
        ▼
External POS API:  https://preprod.mygenie.online/api/{v1,v2}
```

- The backend is **stateless** — no DB writes. 5-minute in-memory cache for menu & tables.
- All persistent customer-side state (menu order, hidden items, timing shifts, "remember me" username) is in **localStorage / sessionStorage**.
- Auth token comes from the POS API and is held in `sessionStorage` (web) — re-login required when it expires.

Full architecture, API spec, ordering flow, build instructions: see `/app/DOCUMENTATION.md`.

---

## 3. How the code got here

```bash
# Cloned 14march branch:
git clone --branch 14march --single-branch https://github.com/Abhi-mygenie/Kiosk.git /tmp/KioskWorking

# rsynced into /app, preserving:
#   /app/.git/, /app/.emergent/, /app/backend/.env, /app/frontend/.env
rsync -a --delete \
  --exclude='.git' --exclude='.emergent' \
  --exclude='backend/.env' --exclude='frontend/.env' \
  --exclude='frontend/node_modules' --exclude='backend/__pycache__' \
  /tmp/KioskWorking/ /app/

# Installed deps
cd /app/backend && pip install -r requirements.txt
cd /app/frontend && yarn install

# Restarted
sudo supervisorctl restart backend frontend
```

> **NB:** The repo's `.gitignore` on `14march` has duplicated `# Environment files / *.env / *.env.*` blocks appended by an auto-generated commit. This is cosmetic only — does not affect builds. The `17march-v2` branch is functionally identical to `14march` minus those auto-commits.

---

## 4. Environment files (current values)

### `/app/backend/.env`
```env
MONGO_URL="mongodb://localhost:27017"   # unused, kept for platform compatibility
DB_NAME="test_database"                 # unused
CORS_ORIGINS="*"
POS_API_BASE_URL="https://preprod.mygenie.online/api/v1"
POS_API_V2_URL="https://preprod.mygenie.online/api/v2"
POS_RESTAURANT_ID=""                    # ⚠️  EMPTY — must be set to place orders
POS_RESTAURANT_NAME=""                  # cosmetic only
```

### `/app/frontend/.env` (DO NOT EDIT `REACT_APP_BACKEND_URL`)
```env
REACT_APP_BACKEND_URL=https://kiosk-branch.preview.emergentagent.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

---

## 5. ⚠️ Action items for the next deployment agent

### Blocking — to enable real orders
1. **Set `POS_RESTAURANT_ID`** in `/app/backend/.env` for the restaurant being deployed.
   - This is the numeric/string ID expected by the POS `buffet-place-order` endpoint
     (`server.py` line ~535, field `"restaurant_id"`).
   - Without it, login + menu + tables all work, but order placement will be rejected by POS.
   - Obtain from the POS admin / MyGenie dashboard for the account being onboarded.
2. **Set `POS_RESTAURANT_NAME`** (optional, currently unused in business logic — only read into a module-level constant). Safe to leave blank.
3. After editing `.env`, run: `sudo supervisorctl restart backend`.

### Optional — production hardening
- Switch `POS_API_*_URL` from `preprod.mygenie.online` to the **production** POS host when going live.
- Restrict `CORS_ORIGINS` from `*` to the deployed frontend origin.
- Decide whether to keep `MONGO_URL` / `DB_NAME` — backend never connects to Mongo in this branch (`motor` imports are commented out in `server.py`). They can stay as-is; the supervisor-managed mongod is idle but harmless.

### Native Android APK (not built here)
- Source: `/app/kiosk-native/KioskApp/`
- Three build paths documented in `DOCUMENTATION.md` §Build & Deployment:
  1. GitHub Actions workflow `.github/workflows/build-android.yml` (push to repo → APK artifact).
  2. Local: `cd kiosk-native/KioskApp && ./build.sh` (needs JDK 17, Node 18+, Android SDK 36, NDK 27.1.12297006).
  3. Expo EAS: `eas build --platform android --profile preview`.

---

## 6. Test credentials (from `DOCUMENTATION.md`)

| Account       | Email                            | Password   | Has tables? |
|---------------|----------------------------------|------------|-------------|
| Hyatt Centric | `manager@hyattcandolim.com`      | `Qplazm@10`| Yes         |
| Kunafa Mahal  | `owner@kunafamahal.com`          | `Qplazm@10`| No (token flow) |

Verified live: `manager@hyattcandolim.com` returns a valid bearer token through the proxy.

---

## 7. Backend API surface (proxy to POS)

| Method | Endpoint                  | Auth   | Notes                                  |
|--------|---------------------------|--------|----------------------------------------|
| GET    | `/api/`                   | —      | Health                                 |
| POST   | `/api/auth/login`         | —      | Proxies to POS `auth/vendoremployee/login` |
| GET    | `/api/menu/categories`    | Bearer | Derived from POS foods list, cached 5m |
| GET    | `/api/menu/items[?category=ID]` | Bearer | Cached 5m, transformed schema    |
| GET    | `/api/tables`             | Bearer | Filters `rtype=TB` + natural sort      |
| POST   | `/api/orders`             | Bearer | Forwards to POS `buffet-place-order`   |
| GET    | `/api/config/branding`    | —      | Static `BrandingConfig` defaults       |

All POS-dependent endpoints return **503** when `POS_API_V2_URL` is unreachable or returns an error.

---

## 8. Operational commands (quick reference)

```bash
# Restart services
sudo supervisorctl restart backend frontend

# Tail logs
tail -n 100 /var/log/supervisor/backend.*.log
tail -n 100 /var/log/supervisor/frontend.*.log

# Status
sudo supervisorctl status

# Smoke test
curl -s http://localhost:8001/api/
curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@hyattcandolim.com","password":"Qplazm@10"}'

# Frontend dev URL (external):
# https://kiosk-branch.preview.emergentagent.com
```

Hot-reload is enabled for both services. Restart is only needed after `.env` or dependency changes.

---

## 9. Known quirks / gotchas

1. **`.gitignore` has duplicated env-ignore lines** on this branch (auto-commit artifact). Cosmetic.
2. **MongoDB is provisioned but unused** — `motor` imports + DB writes are commented out in `server.py`. The app is purely a POS proxy on this branch.
3. **Menu/table cache is keyed by token.** A new login invalidates the cache → fresh fetch from POS. TTL = 5 minutes.
4. **`POS_RESTAURANT_ID` is currently `""`** — orders will fail until set.
5. **Frontend `REACT_APP_BACKEND_URL`** must remain the platform-issued preview URL; do not change.
6. **Two near-identical branches exist** on the repo: `14march` (latest, used here) and `17march-v2` differ only by 2 auto-commits touching `.gitignore` + `.emergent/emergent.yml`. Functionally identical app code.

---

## 10. File map (top level)

```
/app
├── backend/
│   ├── server.py          # 693 lines — proxy + transforms + caching
│   ├── requirements.txt
│   ├── tests/             # pytest suite (3 files: refactor, optional tables, security/env)
│   └── .env
├── frontend/              # React 19 + craco + Tailwind + Shadcn UI
│   ├── src/{App.js, pages/, components/, contexts/, hooks/, utils/}
│   └── .env
├── kiosk-native/          # React Native Android counterpart (separate build pipeline)
├── memory/
│   ├── PRD.md             # product requirements
│   ├── SECURITY_AUDIT.md  # endpoint inventory + secrets posture
│   └── HANDOVER_NOTES.md  # THIS FILE
├── DOCUMENTATION.md       # full technical spec (~600 lines)
└── test_result.md
```

— end of handover —
