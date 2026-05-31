# Phase P2 — Backend hardening

**Owner:** E1
**Tester:** testing_agent_v3 (backend-only)
**Branch:** `cr/phase-2-backend-hardening`
**Estimated effort:** 1.5 days
**Risk:** Low (additive validation, no behavior change to happy-path responses)

---

## 1. Scope

### In scope (deliverables)
- [ ] **D2.1** Safe-parse `base_price` in `transform_pos_food_to_menu_item` (line 284). Mirror the existing try/except pattern used for `calories`/`discount`/`tax`. *(traces to: BE-1)*
- [ ] **D2.2** Safe-parse every `float()` / `int()` in `send_order_to_pos` that touches client/POS input — specifically `int(item.item_id)` and `float(item.price)` inside the order item loop. *(traces to: BE-2)*
- [ ] **D2.3** Add server-side total verification in `POST /api/orders` route. Recompute expected total = `sum(item.price × item.quantity) + cgst + sgst - discount` from the cart and reject if client-provided `total` differs by more than ₹0.50. Return HTTP 400 with explicit `detail: "Order total mismatch — possible client tampering"`. *(traces to: BE-3)*
- [ ] **D2.4** Wrap `data["data"]["tables"]` lookup in `fetch_pos_tables` with safe-get pattern: if `data` or `data["data"]` is None/non-dict, treat as empty result and log a clear warning. *(traces to: BE-4)*
- [ ] **D2.5** Wrap `food["category"]` lookup in `transform_pos_food_to_menu_item` with safe-get: if `food.get("category")` returns None or non-dict, default to empty category metadata. *(traces to: BE-5)*
- [ ] **D2.6** Validate `pos_order_id` is present in POS response BEFORE returning `order.status = "confirmed"`. If both `order_id` and `id` are missing in `pos_data`, return HTTP 502 with `detail: "POS accepted order but did not return an order ID. Please verify with restaurant staff."` *(traces to: BE-6)*
- [ ] **D2.7** Pydantic `Settings` class at module top that validates `POS_API_BASE_URL`, `POS_API_V2_URL`, and `POS_RESTAURANT_ID` are non-empty at startup. If `POS_RESTAURANT_ID` is empty, log a clear WARNING at startup (not fatal — keeps preview environment working for menu/tables while making the silent-order-break issue visible). For `POS_API_BASE_URL` / `POS_API_V2_URL` missing, log ERROR but allow startup (tests need to import). *(traces to: BE-ENV-1)*
- [ ] **D2.8** New test file `backend/tests/unit/test_transforms.py` skeleton with at minimum **3 unit tests**: (a) `transform_pos_food_to_menu_item` with bad price coerces to 0, (b) bad calories already coerces to 0 (regression), (c) order total verification rejects mismatched totals. *(traces to: BT-5, full coverage in P10)*

### Out of scope (defer)
- Full `server.py` modularization → **P7**
- Removing dead Mongo imports/dependencies → **P7** (deferred decision point)
- Per-token cache class → **P7**
- `response_model=` on routes → **P7**
- PII scrubbing from logs → **P4**
- CORS tightening → **P4**
- Frontend changes → none in P2

---

## 2. Files touched (whitelist)

Phase may modify ONLY these files. Any change outside this list → STOP, file Change Note.

- `backend/server.py`
- `backend/tests/unit/__init__.py` *(new — empty marker)*
- `backend/tests/unit/test_transforms.py` *(new)*
- `/app/memory/refactor_cr/phases/P2_contract.md` *(this file, for closure stamp)*
- `/app/memory/refactor_cr/phases/P2_change_notes.md` *(if deviations occur)*
- `/app/memory/refactor_cr/PHASE_LOG.md` *(append entry on closure)*
- `/app/memory/refactor_cr/EXECUTION_PLAN.md` *(update tracker row only)*
- `/app/memory/PRD.md` *(append "what was implemented")*
- `/app/test_reports/iteration_*.json` *(implicit per CN-P1-001 convention)*

**Total file count:** 3 source + 6 docs/tests = 9 files max.

> Note: `backend/.env` is intentionally NOT in the whitelist. P2 adds startup validation that *reads* env vars but does not require .env edits. Production-ready `.env` updates land in P4.

---

## 3. Audit findings closed by this phase

| ID | Source | Description | Closed by |
|---|---|---|---|
| BE-1 | FULL_CODEBASE_AUDIT | Unguarded `float(food.get("price"))` → 500s entire `/api/menu/items` on bad row | D2.1 |
| BE-2 | FULL_CODEBASE_AUDIT | Unguarded `int(item.item_id)` / `float(item.price)` in order builder | D2.2 |
| BE-3 | FULL_CODEBASE_AUDIT | Order total trusted from client (price-tampering possible) | D2.3 |
| BE-4 | FULL_CODEBASE_AUDIT | `data["data"]["tables"]` crashes if intermediate is None | D2.4 |
| BE-5 | FULL_CODEBASE_AUDIT | `food["category"]` crashes if POS returns null category | D2.5 |
| BE-6 | FULL_CODEBASE_AUDIT | Order marked confirmed even when POS returns no order_id | D2.6 |
| BE-ENV-1 | FULL_CODEBASE_AUDIT | `POS_RESTAURANT_ID=""` silently breaks orders | D2.7 |
| BT-5 (partial) | FULL_CODEBASE_AUDIT | No unit tests for transform layer | D2.8 |

**Total findings closed:** 8 (3 × 🔴 P0 + 5 × 🟠 P1).

---

## 4. Entry Gate (must be ✅ before starting)

- [x] Previous phase Exit Gate passed → P1 ✅ approved 2026-05-30
- [x] Decision points relevant to this phase resolved → None block P2 (Mongo decision deferred to P7)
- [ ] User has typed "start Phase 2" (or equivalent) → **awaiting**
- [ ] Branch `cr/phase-2-backend-hardening` created from `cr/phase-1-safety` HEAD → **to be created at kickoff**
- [x] Contract drafted at `/app/memory/refactor_cr/phases/P2_contract.md` → this file
- [x] Files whitelist agreed → §2 above
- [x] Audit findings listed → §3 above
- [x] Test plan drafted → §6 below
- [x] Rollback plan drafted → §7 below

**GATE STATUS:** 🔵 PENDING USER REVIEW

---

## 5. Exit Gate (filled at phase end)

### Code quality
- [ ] All deliverables D2.1–D2.8 implemented
- [ ] `git diff` ⊆ §2 whitelist (verify via `/app/scripts/refactor_cr_verify_whitelist.sh P2`)
- [ ] No commits unrelated to listed findings
- [ ] Lint passes: `ruff check backend/` exits 0
- [ ] Backend supervisor restarts cleanly post-changes

### Testing
- [ ] New unit tests in `backend/tests/unit/test_transforms.py` pass (target: ≥3 tests, all green)
- [ ] Existing pytest suite (`backend/tests/test_kiosk_refactor.py`, `test_optional_tables.py`, `test_security_and_env.py`) still passes against live preprod POS
- [ ] testing_agent_v3 invoked with §6 test plan (backend-only)
- [ ] Test report read fully
- [ ] All HIGH/CRITICAL failures fixed
- [ ] MEDIUM failures fixed OR explicitly deferred

### Regression on P1
- [ ] Frontend `?force-crash=1` still triggers ErrorBoundary (no backend interference)
- [ ] Login + menu fetch + order placement still work for Hyatt creds (full happy path)
- [ ] Non-JSON guard from P1 still rejects forged HTML responses (axios interceptor unchanged)

### Documentation
- [ ] PHASE_LOG.md entry added
- [ ] PRD.md updated
- [ ] EXECUTION_PLAN.md tracker row P2 → `✅ Merged & verified`
- [ ] Rollback procedure verified

### Sign-off
- [ ] User typed "Phase 2 approved"

---

## 6. Test plan (for testing_agent_v3)

### Test scenarios

| ID | Scenario | Setup | Expected | Severity |
|---|---|---|---|---|
| **P2.T1** | Bad POS price coerces to 0 | Unit test: call `transform_pos_food_to_menu_item({"id": 1, "name": "X", "price": "abc", ...})` | Returns dict with `price: 0`, no exception | CRITICAL |
| **P2.T2** | Bad POS price — full endpoint | If feasible, intercept POS `/foods-list` to inject one bad row. Call `GET /api/menu/items` | Returns 200, bad row has price 0, other rows OK | HIGH |
| **P2.T3** | Order total tamper rejected | POST `/api/orders` with cart items summing to ₹1000, body `total: 0.01` | Returns 400 with detail mentioning "mismatch" | CRITICAL |
| **P2.T4** | Order total within tolerance accepted | POST `/api/orders` with cart items summing to ₹1000, body `total: 1000.30` (within ₹0.50) | Returns 200 (forwarded to POS) | HIGH |
| **P2.T5** | POS returns 200 without order_id | Mock POS order endpoint to return 200 + `{"status": "ok"}` (no order_id, no id) | Returns 502 with detail mentioning "POS accepted order but did not return an order ID" | HIGH |
| **P2.T6** | Null POS tables data | Mock POS `/table-config` to return `{"data": null}` | `/api/tables` returns 503 (not 500), clear message | MEDIUM |
| **P2.T7** | Null POS category | Inject a food with `"category": null` in transform path | Returns valid menu item with empty category metadata, no crash | MEDIUM |
| **P2.T8** | Existing pytest regression | Run `pytest backend/tests/` (excluding new unit tests) | All pre-existing tests pass | CRITICAL |
| **P2.T9** | POS_RESTAURANT_ID empty warning | Start backend with `POS_RESTAURANT_ID=""` | Backend starts; WARNING log line "POS_RESTAURANT_ID is empty - orders will fail" visible | MEDIUM |
| **P2.T10** | Frontend P1 regression | Reload kiosk, login, place order with valid creds | Works end-to-end; ErrorBoundary still works on `?force-crash=1` | CRITICAL |

### How testing_agent_v3 will be invoked
- testing_type: `"backend only"` for P2.T1–T9
- P2.T10 done by E1 manually via curl + screenshot (frontend behavior unchanged)

---

## 7. Rollback procedure

If a regression is detected post-merge:

### Quick rollback (under 2 minutes)
```bash
git revert <p2-merge-commit> --no-edit
sudo supervisorctl restart backend
```

### Verification
```bash
curl -s http://localhost:8001/api/                          # health
curl -s https://kiosk-branch.preview.emergentagent.com/api/ # external
# Then place a test order via the UI to confirm legacy behavior restored
```

### Re-plan
1. File regression as new audit finding (e.g., `BE-NEW-XYZ`)
2. Amend P2 contract with additional constraint
3. Re-implement → re-test → re-gate

**Expected rollback time:** < 2 minutes (backend restart is faster than frontend HMR)

---

## 8. Risks identified for this phase

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Server-side total recompute differs from frontend's calculation due to rounding | Med | Med | Use `round(total, 2)` and ₹0.50 tolerance window — frontend uses 18% GST same as backend (verified in audit FA-7). Add explicit unit test for tolerance window. |
| `Settings` Pydantic class breaks tests that import `server.py` without env vars set | Low | Low | Use `Field(default="")` with WARNING log instead of `Field(..., min_length=1)` — startup never blocked, but env hygiene visible. |
| `tests/unit/` directory structure conflicts with existing flat `tests/` layout | Low | Low | Both can coexist. Mark unit tests independently; e2e tests untouched. |
| Server-side total verification breaks legitimate orders with coupons/discounts | Med | High | Include discount in recompute: `total = subtotal + cgst + sgst - discount`. Coupons are P9 scope, so P2 keeps it simple and trusts current frontend math. |
| New 502 response on missing pos_order_id may impact existing flows that previously succeeded | Low | Med | Inspect POS response shape via current logs before implementing; if 99% of responses have order_id, this is purely defensive. |

---

## 9. Notes / progress log (free-form)

*(empty — will be filled as work progresses)*

---

## 10. Open questions for user (resolve before implementation kickoff)

**Q1.** Server-side total tolerance — how much rounding slack?
- (a) **₹0.50** — generous, accommodates ₹ paise rounding 👈 **My recommendation**
- (b) ₹0.01 — strict, catches every penny
- (c) ₹1.00 — extra-lenient

**Q2.** When `POS_RESTAURANT_ID` is empty at startup, what's the behavior?
- (a) **WARNING log + continue startup** — preview env works for menu/tables; orders fail clearly when attempted 👈 **My recommendation** (matches current preview pod)
- (b) ERROR log + refuse to start — strict, but breaks preview/test workflows
- (c) WARNING + reject all `POST /api/orders` upfront — somewhere in between

**Q3.** When server-side total mismatch is detected — HTTP status code?
- (a) **400 Bad Request** — client supplied wrong data 👈 **My recommendation**
- (b) 422 Unprocessable Entity — more semantically precise for validation
- (c) 409 Conflict — request data inconsistent

**Q4.** Unit tests location — `backend/tests/unit/` (new) or extend existing `backend/tests/`?
- (a) **New `backend/tests/unit/` directory** — clean separation; aligns with P7 modularization 👈 **My recommendation**
- (b) Add to existing `backend/tests/` flat layout — minimum disruption now

These are the only 4 decisions needed to start coding. Defaults are bolded; reply with edits or "all defaults, go".

---

**End of contract.**

Closure status: ☐ Open — awaiting Entry Gate approval from user.
