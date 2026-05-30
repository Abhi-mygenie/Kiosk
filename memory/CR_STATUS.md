# 🚦 CR STATUS — Read me first

> **For the next agent (or future me) picking up this work.**
> This file is the ONE place that's always current. Read this, then act.

---

## Where we are RIGHT NOW

| | |
|---|---|
| **Active CR** | Kiosk stability + refactor (10 phases) |
| **Current phase** | **P1 ✅ Done.  P2 🔵 Awaiting Entry Gate** |
| **Active branch** | `cr/phase-1-safety` @ commit `14f6e7e` |
| **Blocked on** | User must answer 4 decisions in `phases/P2_contract.md` §10 → reply `"All defaults, start Phase 2"` (or specify overrides) |
| **Last test report** | `/app/test_reports/iteration_5.json` (P1 — 7/7 PASS) |
| **Last update** | 2026-05-30 |

---

## 🛑 STOP — Binding rules before you write any code

This CR runs under a control layer. **User has explicitly accepted OP-1 through OP-8 as binding** (see `CONTROL_LAYER.md`). The short version:

1. **One phase at a time.** Don't touch P2 work until P1 Exit Gate is closed (it is ✅).
2. **Every change traces to an audit finding** (FE-X / BE-X / RN-X / R-X). If it doesn't map → it doesn't land in this CR.
3. **testing_agent_v3 runs before every phase closure.** No exceptions, no "I tested manually."
4. **Written Change Note** for every mid-phase deviation → `phases/PXX_change_notes.md`.
5. **Rollback path** documented *before* merge, not after.
6. **User explicit approval** before phase closure — wait for "Phase X approved," don't infer.
7. **No business-logic changes inside refactor phases (P7–P9).** Refactor = behavior identical.
8. **All work on `cr/phase-X-name` branches.** No direct main commits.

If the user asks for something *outside* this CR, defer: _"Filed for separate CR; finishing P-current first."_

---

## 🥾 Boot sequence (5-minute read)

Read these files in this exact order. Do not skip.

```
1. /app/memory/CR_STATUS.md             ← you are here
2. /app/memory/CONTROL_LAYER.md          ← the rules above, in detail
3. /app/memory/EXECUTION_PLAN.md         ← 10-phase plan + status tracker
4. /app/memory/PHASE_LOG.md              ← what was actually done, per phase
5. /app/memory/phases/P2_contract.md     ← what's pending next (or next active contract)
```

After those 5 files, you know everything. The 3 audit docs (`CRASH_AUDIT.md`, `FULL_CODEBASE_AUDIT.md`, `REFACTOR_AUDIT.md`) are reference — open them only when you need the exact wording of a finding (FE-1, BE-3, etc.).

---

## 🎯 Next concrete actions (in order)

Whoever picks this up next:

1. **Confirm services running:**
   ```bash
   sudo supervisorctl status | head -6
   curl -s http://localhost:8001/api/    # expect {"message":"Kiosk API Ready"}
   ```
2. **Confirm branch:**
   ```bash
   cd /app && git branch --show-current   # should print: cr/phase-1-safety
   git log --oneline -5                    # should show 14f6e7e at HEAD
   ```
3. **Re-post P2 Entry Gate questions to user.** Open `phases/P2_contract.md` §10 — there are 4 decisions. Defaults are bolded; recommend defaults to user.
4. **Wait for user "go"** in one of these forms:
   - `"All defaults, start Phase 2"` → proceed with defaults
   - `"Go with [edits]"` → apply edits, then proceed
   - `"Hold — discussing X"` → answer questions, don't code yet
5. **On "go": create branch + implement P2** per `phases/P2_contract.md` §1 deliverables.
6. **Use `/app/scripts/verify_whitelist.sh P2`** before committing — confirms file changes are scoped.
7. **Invoke `testing_agent_v3`** with §6 test plan.
8. **Update PHASE_LOG, EXECUTION_PLAN tracker, PRD, P2 Exit Gate, CR_STATUS (this file).**
9. **Wait for user "Phase 2 approved" → then draft P3 contract**, repeat.

---

## 📋 Phase tracker (live — keep this updated)

| Phase | Status | Branch | Commit | Closed findings |
|---|---|---|---|---|
| **P1** Stop the bleeding | ✅ Merged & verified 2026-05-30 | `cr/phase-1-safety` | `14f6e7e` | FE-1, FE-2, FE-3, FE-4, FE-5, FE-6, FE-7, FE-U-1 (8 × P0) |
| **P2** Backend hardening | 🔵 Entry Gate pending | `cr/phase-2-backend-hardening` (not yet created) | – | – |
| P3 Native APK URL | ☐ Not started | – | – | – |
| P4 Security cleanup | ☐ Not started | – | – | – |
| P5 CI/CD baseline | ☐ Not started | – | – | – |
| P6 UX polish | ☐ Not started | – | – | – |
| P7 Backend modularize | ☐ Not started | – | – | – |
| P8 Web dedup | ☐ Not started | – | – | – |
| P9 kiosk-core shared package | ☐ Not started | – | – | – |
| P10 Test pyramid + monitoring | ☐ Not started | – | – | – |

> Same table also in `EXECUTION_PLAN.md` (with more columns). This one is the abbreviated dashboard. **Keep both in sync** — update both whenever a phase closes.

---

## 🧯 Emergency procedures

### If something is broken right now
1. Run `/app/scripts/cr_status.sh` (it dumps current state)
2. Check `tail -100 /var/log/supervisor/{backend,frontend}.*.log`
3. Branch `cr/phase-1-safety` is independently revertable: `git revert 14f6e7e b82815b 7a784b9 --no-edit`
4. If stuck >2 attempts → invoke `troubleshoot_agent` with logs

### If user is unhappy with current state and wants to revert the CR entirely
```bash
cd /app && git checkout main && sudo supervisorctl restart frontend backend
# now back to pre-CR state; CR docs remain in /app/memory/ but no code changes active
```

### If user wants to ship P1 independently (without continuing CR)
- Branch `cr/phase-1-safety` is production-ready. User uses Emergent "Save to GitHub" feature.
- After merge to main on GitHub, deploy. The dev-only `?force-crash=1` probe is NODE_ENV-gated so it does nothing in production.

---

## 📂 Documents map

| File | Type | When to update |
|---|---|---|
| **`CR_STATUS.md`** (this file) | Dashboard | Every phase boundary |
| `EXECUTION_PLAN.md` | Plan + full tracker | Every phase boundary |
| `PHASE_LOG.md` | Audit trail (append-only) | At phase closure |
| `CONTROL_LAYER.md` | Process rules | Only on user decision |
| `PRD.md` | Product requirements + per-phase outcomes | At phase closure |
| `HANDOVER_NOTES.md` | Original pod context (pre-CR) | Stable — historical |
| `SESSION_CLOSE.md` | End-of-session snapshot | Each session end |
| `CRASH_AUDIT.md` | Reference (33 findings) | Stable |
| `FULL_CODEBASE_AUDIT.md` | Reference (67 findings) | Stable |
| `REFACTOR_AUDIT.md` | Reference (57 findings) | Stable |
| `SECURITY_AUDIT.md` | Pre-CR internal doc | Stable |
| `phases/PXX_contract.md` | Per-phase scope + gates | Per-phase |
| `phases/PXX_change_notes.md` | Per-phase deviations | Per-phase if any |

---

## 🤝 If user types something other than the expected "start Phase X"

Common variations and how to respond:

| User says | Means | You do |
|---|---|---|
| "Continue" / "Resume" | Pick up where we left off | Re-post P2 Entry Gate from §10 |
| "What's next?" | Wants status | Show this CR_STATUS dashboard |
| "Stop" / "Pause CR" | Wants to halt | Confirm; nothing to do; CR preserved |
| "Revert everything" | Wants to undo | Run `git checkout main`; CR docs stay |
| "Skip to Phase X" | Wants to jump ahead | Push back: OP-1 says one phase at a time. Explain why, then proceed if they still insist (and document in PHASE_LOG with "skipped by user decision"). |
| "Just deploy P1" | Wants to ship now | Point to Emergent "Save to GitHub" feature; P1 is independently shippable |
| Anything off-topic | Out-of-scope question | Defer to separate CR per OP-2 |

---

**This file is the contract between sessions. Keep it accurate. Future-you (or the next agent) is depending on it.**
