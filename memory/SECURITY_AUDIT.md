# Security Audit Report
**Date:** March 17, 2026  
**Scope:** Full project — Backend, Web App, Native App  
**Test Report:** `/app/test_reports/iteration_4.json`

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 0 | - |
| MEDIUM | 4 | Open |
| LOW | 4 | Open |

**No critical vulnerabilities found.** Auth bypass protection working correctly. Passwords not stored in client storage. Backend secrets properly in `.env`.

---

## Security Checklist

| Check | Status | Details |
|-------|--------|---------|
| No hardcoded secrets (API keys, passwords, tokens) | PASS | No secrets found in source code |
| Passwords NOT in localStorage | PASS | Only username stored for "Remember Me" |
| Passwords NOT in AsyncStorage (native) | PASS | Only username stored |
| Auth required on all protected endpoints | PASS | All menu/tables/orders return 401 without token |
| Backend secrets in .env | PASS | POS URLs, restaurant ID in `/app/backend/.env` |
| No XSS vulnerabilities | PASS | No `dangerouslySetInnerHTML` or `innerHTML` usage |
| No SQL injection | N/A | No database (MongoDB commented out) |
| CORS configured | WARNING | `allow_origins='*'` — too permissive for production |
| Error messages sanitized | PARTIAL | Login errors sanitized; Pydantic validation errors expose structure |

---

## External Endpoints

### Backend → POS API (External)

| Endpoint | File | Purpose | Auth |
|----------|------|---------|------|
| `{POS_API_BASE_URL}/auth/vendoremployee/login` | `server.py:655` | User authentication | No |
| `{POS_API_V2_URL}/vendoremployee/product/foods-list?food_for=Normal` | `server.py:169` | Fetch menu items | Bearer token |
| `{POS_API_V2_URL}/vendoremployee/restaurant-settings/table-config` | `server.py:405` | Fetch table config | Bearer token |
| `{POS_API_V2_URL}/vendoremployee/buffet/buffet-place-order` | `server.py:549` | Place order | Bearer token |

**POS API Base URLs (from .env):**
- `POS_API_BASE_URL` = `https://preprod.mygenie.online/api/v1`
- `POS_API_V2_URL` = `https://preprod.mygenie.online/api/v2`

### Frontend → Backend (Internal)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/auth/login` | Authentication |
| `GET /api/config/branding` | UI branding config |
| `GET /api/menu/categories` | Menu categories |
| `GET /api/menu/items` | Menu items |
| `GET /api/tables` | Table configuration |
| `POST /api/orders` | Place order |

### Native App → Backend

Same 6 endpoints as frontend. API URL sourced from `/app/kiosk-native/KioskApp/src/utils/api.js`.

---

## MEDIUM Priority Issues

### 1. Hardcoded Hyatt Logo URL (10+ occurrences)
**Severity:** MEDIUM  
**URL:** `https://customer-assets.emergentagent.com/job_aba4da0b-91ee-4a40-b348-36daa43480a8/artifacts/zyial4es_piyush_hyatt_logo_1.png`

**Web App Files:**
- `/app/frontend/src/pages/LoginPage.js` (lines 37, 163)
- `/app/frontend/src/pages/KioskPage.js` (lines 182, 297)
- `/app/frontend/src/pages/AdminSettingsPage.js` (line 349)
- `/app/frontend/src/pages/TimingSettingsPage.js` (line 63)

**Native App Files:**
- `/app/kiosk-native/KioskApp/src/pages/LoginScreen.js` (line 83)
- `/app/kiosk-native/KioskApp/src/pages/AdminSettingsScreen.js` (line 24)
- `/app/kiosk-native/KioskApp/src/pages/LoadingScreen.js` (line 11)
- `/app/kiosk-native/KioskApp/src/components/Header.js` (line 12)
- `/app/kiosk-native/KioskApp/src/components/LoginProgressOverlay.js` (line 28)

**Recommendation:** Move to branding config returned by `GET /api/config/branding`. Use `BrandingConfig.logo_url` from backend.

---

### 2. Hardcoded Restaurant Name "Hyatt Centric" (3 occurrences)
**Severity:** MEDIUM

**Files:**
- `/app/frontend/src/pages/LoginPage.js` (line 164) — alt text
- `/app/frontend/src/pages/KioskPage.js` (lines 183, 297) — alt text

**Recommendation:** Use `BrandingConfig.restaurant_name` from backend API.

---

### 3. Native App API_BASE_URL Hardcoded
**Severity:** MEDIUM  
**File:** `/app/kiosk-native/KioskApp/src/utils/api.js` (line 5)  
**Value:** `https://restaurant-kiosk-app.preview.emergentagent.com`

**Recommendation:** Use `react-native-config` or build-time env variables for different environments (dev/staging/production).

---

### 4. CORS allow_origins='*'
**Severity:** MEDIUM  
**File:** `/app/backend/server.py` (lines 683-688)  
**Current:** `allow_origins=os.environ.get('CORS_ORIGINS', '*').split(',')`

**Recommendation:** Set `CORS_ORIGINS` in `.env` to specific domain(s) in production:
```
CORS_ORIGINS=https://your-kiosk-domain.com
```

---

## LOW Priority Issues

### 5. Hardcoded Toast Colors in App.js
**Severity:** LOW  
**File:** `/app/frontend/src/App.js` (lines 65-67)  
**Values:** `#EBF6FD`, `#62B5E5`, `#06293F`

**Recommendation:** Use CSS variables from theme (`var(--blue-light)`, `var(--blue-hero)`, `var(--blue-dark)`).

---

### 6. Inline Hex Colors in Native TimingSettingsScreen
**Severity:** LOW  
**File:** `/app/kiosk-native/KioskApp/src/pages/TimingSettingsScreen.js`

**Recommendation:** Use `colors` theme from `../theme/colors.js`.

---

### 7. Console.log Statements in Production Code
**Severity:** LOW

**Web App:**
- `/app/frontend/src/utils/kioskLock.js` (lines 36, 56)
- `/app/frontend/src/contexts/AuthContext.js` (line 101)
- `/app/frontend/src/utils/touchSound.js` (line 17)

**Native App:**
- `/app/kiosk-native/KioskApp/src/utils/storage.js` (6 statements)
- `/app/kiosk-native/KioskApp/src/contexts/AuthContext.js` (2 statements)

**Recommendation:** Remove or wrap with `__DEV__` / `process.env.NODE_ENV` check.

---

### 8. Pydantic Validation Errors Expose Input Structure
**Severity:** LOW  
**File:** `/app/backend/server.py` (order validation)

**Recommendation:** Add a global exception handler for `RequestValidationError` that returns a generic message:
```python
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(status_code=422, content={"detail": "Invalid request data"})
```

---

## Other Hardcoded Values (Informational)

| Value | File | Severity |
|-------|------|----------|
| MyGenie logo SVG URL | `LoginPage.js:91,286` | INFO (branding watermark) |
| Default restaurant name "Hotel Lumiere" | `server.py:119` | LOW (fallback default) |
| Google Fonts URL | `server.py:132` | INFO (safe to hardcode) |
| Default branding colors | `ThemeContext.js:44-59` | INFO (fallback defaults) |
| Tax rates CGST 2.5%, SGST 2.5% | `KioskPage.js`, `KioskScreen.js` | INFO (business logic) |

---

## Positive Security Findings

- Password storage properly handled — NOT in localStorage or AsyncStorage
- Legacy password storage cleanup code present (`AsyncStorage.removeItem('kiosk_remember_pass')`)
- All protected API endpoints require valid Bearer token (verified with 401 tests)
- Backend acts as proxy — frontend never calls POS API directly
- No `dangerouslySetInnerHTML` or raw HTML injection anywhere
- Session token stored in sessionStorage (web) — cleared on browser close
