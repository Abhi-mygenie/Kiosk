# Phase P1 — Stop the bleeding

**Owner:** E1
**Tester:** testing_agent_v3
**Branch:** `cr/phase-1-safety`
**Estimated effort:** 1 day
**Risk:** Low (additive code, no behavior change to happy-path)

---

## 1. Scope

### In scope (deliverables)
- [ ] **D1.1** Create `<ErrorBoundary>` component that catches render errors and shows a "Reset Kiosk" fallback UI which (a) clears all `kiosk_*` keys from localStorage/sessionStorage and (b) reloads the page. *(traces to: FE-1, FE-U-1)*
- [ ] **D1.2** Wrap `<AppContent />` in `<ErrorBoundary>` in `App.js`. *(traces to: FE-1)*
- [ ] **D1.3** Create `utils/safeRead.js` exporting `readArray(key)`, `readObject(key)`, `readString(key)` — each does `JSON.parse` inside try/catch + shape validation, returns safe default (`[]`, `{}`, `null`) on any failure. *(traces to: FE-2)*
- [ ] **D1.4** Refactor `AuthContext.js:31-58` to use `readObject('kiosk_user')`, `readObject('kiosk_menu_data')`, `readObject('kiosk_branding')` AND shape-validate `menuData` has `categories`/`menuItems`/`tables` as arrays before `setMenuData(...)`. *(traces to: FE-2, FE-5)*
- [ ] **D1.5** Add `Array.isArray(...)` guards on every `.map / .filter / .find / .reduce` site in `AdminSettingsPage.js` and `KioskPage.js` that touches `menuData.categories`, `menuData.menuItems`, or `menuData.tables`. *(traces to: FE-3, FE-4)*
- [ ] **D1.6** Add axios response interceptor in `kioskHelpers.js` `createAuthAxios()` that rejects `/api/*` responses with `Content-Type` not containing `application/json`. Same for the bare `axios` instance used in `AuthContext.login()` for branding + auth calls — apply at point of consumption. *(traces to: FE-5, FE-6)*
- [ ] **D1.7** Guard `TimingSettingsContext.getCurrentPrepTime()` against malformed `shift.start` / `shift.end` (string check before `.split(':')`). *(traces to: FE-7)*
- [ ] **D1.8** In `KioskPage.js`, make Logout button visible whenever ErrorBoundary fallback renders OR when the kiosk is in a "broken state" — i.e., the recovery path must not require admin unlock. *(traces to: FE-U-1)*

### Out of scope (defer)
- Password storage removal → **P4**
- listener leaks in kioskLock → **P6**
- useCallback for SuccessOverlay → **P6**
- `kiosk_session_pass` cleanup → **P4**
- `cart.find` semantics fix → **P6**
- Server-side total recompute → **P2**
- Native equivalent of all of the above → **P9** (will be done once in `kiosk-core`)
- React Native ErrorBoundary → **P9** (or follow-up native-only mini-phase if needed sooner)

---

## 2. Files touched (whitelist)

Phase may modify ONLY these files. Any change outside this list → STOP, file Change Note.

- `frontend/src/App.js`
- `frontend/src/components/ErrorBoundary.jsx` *(new)*
- `frontend/src/utils/safeRead.js` *(new)*
- `frontend/src/utils/kioskHelpers.js`
- `frontend/src/contexts/AuthContext.js`
- `frontend/src/contexts/MenuSettingsContext.js`
- `frontend/src/contexts/TimingSettingsContext.js`
- `frontend/src/pages/AdminSettingsPage.js`
- `frontend/src/pages/KioskPage.js`
- `/app/memory/refactor_cr/phases/P1_contract.md` *(this file, for closure stamp)*
- `/app/memory/refactor_cr/PHASE_LOG.md` *(append entry on closure)*
- `/app/memory/refactor_cr/EXECUTION_PLAN.md` *(update tracker row only)*
- `/app/memory/PRD.md` *(append "what was implemented")*

**Total file count:** 9 source + 4 docs = 13 files max.

---

## 3. Audit findings closed by this phase

| ID | Source | Description | Closed by |
|---|---|---|---|
| FE-1 | FULL_CODEBASE_AUDIT | No ErrorBoundary anywhere | D1.1, D1.2 |
| FE-2 | FULL_CODEBASE_AUDIT | localStorage shape never validated | D1.3, D1.4 |
| FE-3 | FULL_CODEBASE_AUDIT | Unguarded `.map` on `menuData.categories` in AdminSettings | D1.5 |
| FE-4 | FULL_CODEBASE_AUDIT | Unguarded `.filter` in `applySettings` callers | D1.5 |
| FE-5 | FULL_CODEBASE_AUDIT | Login accepts non-JSON 200 responses | D1.4, D1.6 |
| FE-6 | FULL_CODEBASE_AUDIT | No axios JSON-only interceptor | D1.6 |
| FE-7 | FULL_CODEBASE_AUDIT | `shift.start.split(':')` crashes on bad data | D1.7 |
| FE-U-1 | FULL_CODEBASE_AUDIT | Logout trapped behind admin unlock; no recovery | D1.1 (Reset button) + D1.8 |

**Total findings closed:** 8 (all 🔴 P0).

---

## 4. Entry Gate (must be ✅ before starting)

- [✅] Previous phase Exit Gate passed → N/A (Phase 1 — bootstrap)
- [✅] Decision points relevant to this phase resolved → None block Phase 1; all open decisions affect P7/P9 only
- [⏳] User has typed "start Phase 1" (or "Accepted — proceed... and start Phase 1") → **YES, received 2026-05-30**
- [⏳] Branch `cr/phase-1-safety` created from latest state → **to be created at implementation kickoff**
- [✅] Contract drafted at `/app/memory/refactor_cr/phases/P1_contract.md` → this file
- [✅] Files whitelist agreed → §2 above
- [✅] Audit findings listed → §3 above
- [✅] Test plan drafted → §6 below
- [✅] Rollback plan drafted → §7 below

**GATE STATUS:** 🔵 PENDING USER REVIEW
**Awaiting:** User reads this contract → posts "P1 contract approved, proceed" (or edits)

---

## 5. Exit Gate (will be filled at phase end)

### Code quality
- [x] All deliverables D1.1–D1.8 implemented
- [x] `git diff --name-only main...HEAD` ⊆ §2 whitelist (verified via `/app/scripts/refactor_cr_verify_whitelist.sh P1`; `test_reports/iteration_5.json` covered by CN-P1-001)
- [x] No commits unrelated to listed findings
- [x] Lint passes (eslint clean on all 9 touched files)
- [x] Build passes (webpack compiled successfully; frontend restarted clean)

### Testing
- [x] testing_agent_v3 invoked with §6 test plan
- [x] Test report read fully at `/app/test_reports/iteration_5.json`
- [x] All HIGH/CRITICAL failures fixed → none reported (7/7 PASS)
- [x] MEDIUM failures fixed OR deferred → 2 informational, neither blocking, both documented in PHASE_LOG
- [x] Regression: existing pytest suite untouched (backend not modified in P1)
- [x] Manual smoke: login → menu → order (verified by testing_agent_v3 in T5)

### Documentation
- [x] PHASE_LOG.md entry added
- [x] PRD.md updated with Phase 1 outcomes
- [x] EXECUTION_PLAN.md tracker row P1 → `🟠 Exit Gate pending (user approval)`
- [x] Rollback procedure §7 verified (mental dry-run: `git revert b82815b` + supervisor restart, <5s)
- [x] test_credentials.md → no changes (no auth touched) ✓
- [x] Change Note CN-P1-001 filed for `test_reports/iteration_5.json` outside literal whitelist

### Sign-off
- [x] **User typed "Phase 1 approved" — 2026-05-30** ✅

**GATE STATUS:** ✅ PASSED — Phase 1 closed, ready to start P2.

---

## 6. Test plan (for testing_agent_v3)

### Test scenarios

| ID | Scenario | Setup | Expected | Severity |
|---|---|---|---|---|
| **P1.T1** | Poison `kiosk_menu_data` with HTML string | `localStorage.setItem('kiosk_menu_data', '<html>oops</html>')` → reload `/` | Login page renders normally, no white screen, no fatal console error. Console may show one safeRead warning. | CRITICAL |
| **P1.T2** | Backend returns HTML for `/api/menu/categories` | Intercept network during login → return `Content-Type: text/html` body | Login fails with a visible toast/error like "Backend returned unexpected response". No token persisted in localStorage. | CRITICAL |
| **P1.T3** | Poison `kiosk_timing_settings` with non-array | `localStorage.setItem('kiosk_timing_settings', '"banana"')` → login → place order | SuccessOverlay renders. No crash. Prep time row gracefully hidden or shows fallback. | HIGH |
| **P1.T4** | Forced component crash | Temporarily add `throw new Error('test')` inside `<KioskPage>` render → reload | ErrorBoundary fallback shown with logo + "Reset Kiosk" button. Click button → all `kiosk_*` keys cleared → page reloads → login screen appears. Logout button reachable from fallback. | CRITICAL |
| **P1.T5** | Regression — happy path | Fresh browser → login as Hyatt → browse categories → add 2 items → select table → place order | All steps succeed. Order confirmation shows. No console errors. | CRITICAL |
| **P1.T6** | Regression — admin flow | Login → 5-tap top-left corner → enter admin → reorder a category → save → verify reorder persisted | All steps succeed. | HIGH |
| **P1.T7** | Schema mismatch — `tables` is not an array | Manually edit `kiosk_menu_data.tables` to `{}` → reload while logged in | Kiosk loads. No crash. Table selector either shows empty or hides. | HIGH |

### How testing_agent_v3 will be invoked

After implementation completes, E1 calls testing_agent_v3 with this JSON:

```json
{
  "original_problem_statement_and_user_choices_inputs": "Phase 1 of Kiosk CR — add ErrorBoundary, safeRead helpers, axios JSON-only interceptor, and Array.isArray guards. Goal: any poisoned localStorage or non-JSON API response must NOT crash the React app. Recovery via a Reset Kiosk button on the ErrorBoundary fallback.",
  "features_or_bugs_to_test": [
    "P1.T1: Poisoned localStorage 'kiosk_menu_data' does not crash app",
    "P1.T2: Non-JSON response to /api/menu/categories does not poison state, surfaces clear error",
    "P1.T3: Malformed kiosk_timing_settings does not crash SuccessOverlay",
    "P1.T4: Forced crash inside KioskPage shows ErrorBoundary fallback with Reset Kiosk button that clears storage and reloads",
    "P1.T5: Happy path login -> menu -> order still works (regression)",
    "P1.T6: Admin flow still works (regression)",
    "P1.T7: Non-array tables shape does not crash kiosk"
  ],
  "files_of_reference": [
    "frontend/src/App.js (ErrorBoundary wraps AppContent)",
    "frontend/src/components/ErrorBoundary.jsx (new, fallback UI + Reset Kiosk button)",
    "frontend/src/utils/safeRead.js (new, readArray/readObject/readString helpers)",
    "frontend/src/utils/kioskHelpers.js (axios JSON-only interceptor)",
    "frontend/src/contexts/AuthContext.js (uses safeRead, validates menuData shape)",
    "frontend/src/contexts/MenuSettingsContext.js (uses safeRead, shape validation)",
    "frontend/src/contexts/TimingSettingsContext.js (uses safeRead, getCurrentPrepTime safe-guards)",
    "frontend/src/pages/AdminSettingsPage.js (Array.isArray guards on .map/.filter)",
    "frontend/src/pages/KioskPage.js (Array.isArray guards, Logout always reachable)"
  ],
  "required_credentials": [
    "manager@hyattcandolim.com / Qplazm@10 (Hyatt — has tables)",
    "owner@kunafamahal.com / Qplazm@10 (Kunafa Mahal — no tables, regression)"
  ],
  "testing_type": "frontend only (skip backend) — no backend changes in P1",
  "agent_to_agent_context_note": "Phase 1 of an 10-phase refactor governed by CONTROL_LAYER.md. Must verify each test scenario above. Read PHASE_LOG.md and EXECUTION_PLAN.md for full context. For T4 (forced crash), the testing agent may need to temporarily edit a file to throw, OR I can leave a hidden /forced-crash-test query param trigger — let me know which is preferred.",
  "prev_test_files_and_folder": "No prior test reports for this CR. /app/test_reports/ may contain unrelated iterations.",
  "mocked_api": {
    "has_mocked_apis": false,
    "mocked_apis_list": []
  },
  "other_misc_info": "Frontend URL: https://kiosk-branch.preview.emergentagent.com. Backend uses POS preprod (no mocking). For T2, testing agent should use Playwright network interception to return text/html for /api/menu/categories."
}
```

---

## 7. Rollback procedure

If a regression is detected post-merge:

### Quick rollback (under 5 minutes)
```bash
# 1. Identify the merge commit
git log --oneline -5

# 2. Revert it
git revert <merge-commit-sha> --no-edit

# 3. Restart frontend (backend untouched in P1)
sudo supervisorctl restart frontend

# 4. Verify previous behaviour via:
curl -s http://localhost:8001/api/                # backend health (untouched)
# Then open https://kiosk-branch.preview.emergentagent.com — confirm login renders.
```

### What "previous behaviour" means here
- Login flow works as before P1
- Existing kiosk happy path works
- ErrorBoundary is GONE — meaning a future crash will again brick the kiosk (back to pre-P1 risk)

### Re-plan
1. File the regression as a new audit finding (e.g., `FE-NEW-XYZ`)
2. Amend P1 contract with the additional constraint
3. Re-implement → re-test → re-gate

### Expected rollback time: < 5 minutes

---

## 8. Risks identified for this phase

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| ErrorBoundary swallows legitimate errors → silent app failures | Low | Med | Boundary logs errors to console + (future) Sentry. Fallback shows error message. |
| `safeRead` returns `[]` instead of restoring previous good state → user sees empty kiosk on next launch | Med | Low | Acceptable trade-off; "empty menu + Reset button" is better than white screen. Document in PRD. |
| Axios interceptor breaks branding endpoint (returns 200 application/json but in some envs might differ) | Low | Med | Interceptor scoped to `/api/*` and only rejects when content-type ≠ json AND we're parsing it — but we'd allow empty responses. Add unit test if time permits. |
| `Array.isArray` guards introduce a subtle behavior change (e.g., previously rendering "0 items" now renders empty) | Low | Low | Manual smoke (T5) covers happy path explicitly. |
| forced-crash test (T4) — adding `throw` to KioskPage temporarily — risk of accidentally committing | Med | High | Use a hidden query-param trigger (`?force-crash=1`) inside an `if (NODE_ENV !== 'production')` block — never compiled into prod bundle. Removed after test or kept as a dev aid. **Decision needed from user — see §10.** |
| Branch protection / merge process not yet established for this repo | Med | Low | Will use a feature branch + manual user approval before merge (no PR review tool configured in this env) |

---

## 9. Notes / progress log (free-form, updated during implementation)

*(empty — will be filled as work progresses)*

---

## 10. Open questions for user (resolve before implementation kickoff)

**Q1.** For test P1.T4 (forced crash), do you prefer:
- (a) **Hidden dev-only trigger** — a `?force-crash=1` query param that throws if `NODE_ENV !== 'production'`. Stays in code as a debugging aid. *(recommended)*
- (b) **Temp edit during test** — testing agent edits a file, runs test, reverts.
- (c) **Manual user test only** — skip automated coverage of T4.

**Q2.** A standalone `ErrorBoundary` component or use React's official `react-error-boundary` library (3KB, well-maintained)?
- (a) **Custom (no new dep)** — ~50 lines, no install. *(recommended for minimal blast radius)*
- (b) **`react-error-boundary`** — battle-tested, slightly nicer API.

**Q3.** When ErrorBoundary fires, should the fallback button label be:
- (a) "Reset Kiosk" — strong, clear *(recommended for tablet user)*
- (b) "Reload" — softer
- (c) "Start Over" — customer-friendly

These are the only 3 decisions needed to start coding. Defaults are bolded; reply with edits or "all defaults, go".

---

**End of contract.**

Closure status: ☐ Open — awaiting Entry Gate approval from user.
