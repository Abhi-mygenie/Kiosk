# Kiosk Refactor CR — Control Layer (Governance Framework)

**Scope:** Governs execution of `EXECUTION_PLAN.md` (10 phases, ~13–14 dev-days)
**Owner:** User (final approver) + E1 (executor)
**Created:** 2026-05-30
**Status:** ✅ Active — applies to every phase from P1 onwards

> This document is the **control layer**. No phase starts without an Entry Gate. No phase closes without an Exit Gate. No deviation lands without a documented Change Note. The goal: every commit in this CR is traceable to one of the audited findings.

---

## 0. Why this exists

Every refactor goes off the rails the same way:
1. Phase 1 ships with "small extra fix" tacked on → 2 days late.
2. Phase 2 starts before Phase 1 is fully tested → regression lands in Phase 3.
3. Testing is skipped "because it's a tiny change" → kiosks brick on Sunday brunch.
4. Two months in, nobody remembers what was actually done.

The control layer prevents all four. It costs ~10 minutes per phase boundary; it saves days of unwinding.

---

## 1. Operating principles (non-negotiable)

| # | Principle | Why |
|---|---|---|
| OP-1 | **One phase at a time.** No P2 work starts until P1 has passed Exit Gate. | Prevents lost work + ambiguous test results |
| OP-2 | **Every change traces back to an audit finding.** If a fix doesn't map to FE-X / BE-X / RN-X / R-X, it doesn't land in this CR — file a separate issue. | Prevents scope creep |
| OP-3 | **Testing agent runs before phase closure.** Always. No "I tested it manually". | Catches the bugs main-agent's blind spots miss |
| OP-4 | **Every phase has a written Change Note** added to `PHASE_LOG.md`. | Audit trail for any future investigation |
| OP-5 | **Rollback path documented before merge.** | A 10-second decision when something breaks at 2am |
| OP-6 | **User explicitly approves Exit Gate.** "Looks good" in chat is sufficient, but it must be there. | Phase closure is a deliberate act, not implicit |
| OP-7 | **No business-logic changes inside refactor phases (P7–P9).** Behaviour must be byte-identical pre/post. Bug fixes go in stability phases (P1–P6). | Prevents refactors masking regressions |
| OP-8 | **No phase commits to `main`/`master` directly.** All work on `cr/phase-X-name` branches. PR + merge. | Reviewable; revertable |

---

## 2. Phase Contract template

Every phase, before the first line of code, fills out this contract. Stored in `/app/memory/phases/PXX_contract.md`.

```markdown
# Phase PXX — <Name>

## 1. Scope
**In scope (deliverables):**
- [ ] Item 1 (traces to: FE-1, FE-2)
- [ ] Item 2 (traces to: BE-3)
- ...

**Out of scope:**
- Item X — defer to phase PYY
- Item Y — file as separate CR

## 2. Files touched (whitelist)
Phase may modify ONLY:
- `path/to/file1.js`
- `path/to/file2.py`
- ...

Any file outside this list → STOP, update contract first.

## 3. Audit findings closed by this phase
- [ ] FE-1
- [ ] FE-2
- [ ] BE-3
- ... (must reference the audit ID exactly)

## 4. Entry Gate (must be ✅ before starting)
- [ ] Previous phase Exit Gate passed
- [ ] Decision points relevant to this phase resolved (see EXECUTION_PLAN §"Decision points")
- [ ] User has typed "start Phase XX" (explicit go-ahead)
- [ ] Branch `cr/phase-XX-<name>` created from latest `main`

## 5. Exit Gate (must be ✅ before closing)
- [ ] All deliverables checked off
- [ ] Files touched match whitelist (use `git diff --stat` to confirm)
- [ ] All audit findings listed in §3 marked closed
- [ ] testing_agent_v3 phase test plan executed; report at `/app/test_reports/iteration_X.json`
- [ ] All HIGH/CRITICAL test failures fixed (no carry-over)
- [ ] LOW/MEDIUM test findings either fixed or explicitly deferred with rationale
- [ ] `PHASE_LOG.md` entry written
- [ ] `EXECUTION_PLAN.md` tracker table updated (status, PR #, dates)
- [ ] `PRD.md` updated with "what was implemented"
- [ ] Rollback procedure documented in §7 below
- [ ] User typed approval (e.g. "Phase XX approved")

## 6. Risks identified for this phase
- Risk 1 — mitigation
- ...

## 7. Rollback procedure
If a regression is detected post-merge:
1. `git revert <merge-commit>` on `main`
2. Restart services: `sudo supervisorctl restart backend frontend`
3. Verify previous behaviour restored via: <specific curl / screenshot test>
4. File regression as new audit finding; re-plan phase with the additional constraint

Expected rollback time: < 5 minutes

## 8. Notes / open questions
(Free-form)
```

---

## 3. Entry Gate checklist (per phase)

Before E1 writes any code for a phase, **every** box must be ticked:

```
┌─ ENTRY GATE — Phase PXX ────────────────────────────────────┐
│                                                              │
│  ☐ Phase Contract drafted at /app/memory/phases/PXX_contract.md │
│  ☐ Previous phase's Exit Gate passed (or N/A for P1)        │
│  ☐ User said "start Phase XX" (or selected the cut)         │
│  ☐ Decision points resolved (TS vs JS, monorepo tool, etc.) │
│  ☐ Branch cr/phase-XX-<name> created from main              │
│  ☐ Whitelist of files-to-touch agreed                       │
│  ☐ Audit findings to close listed (FE-X, BE-Y, etc.)        │
│  ☐ Test plan drafted (which tests testing_agent_v3 will run)│
│  ☐ Rollback plan drafted                                    │
│                                                              │
│  GATE STATUS: ☐ PENDING   ☐ PASSED   ☐ BLOCKED              │
│  Approver: ___________  Date: ___________                   │
└──────────────────────────────────────────────────────────────┘
```

If any box can't be ticked, **don't start the phase** — resolve the blocker first.

---

## 4. Exit Gate checklist (per phase)

Before merging the phase PR:

```
┌─ EXIT GATE — Phase PXX ─────────────────────────────────────┐
│                                                              │
│  Code quality                                                │
│  ☐ All deliverables in Contract §1 implemented              │
│  ☐ Files modified ⊆ whitelist in Contract §2                │
│  ☐ No scope creep (no commits unrelated to listed findings) │
│  ☐ Lint passes (ruff for backend, eslint for frontend)      │
│  ☐ Build passes (yarn build / pip install / gradle assemble)│
│                                                              │
│  Testing                                                     │
│  ☐ testing_agent_v3 invoked with phase test plan            │
│  ☐ Test report read in full at /app/test_reports/iter_X.json│
│  ☐ All HIGH/CRITICAL failures fixed                         │
│  ☐ MEDIUM failures fixed OR deferred with documented reason │
│  ☐ Regression: previous phases' tests still green           │
│  ☐ Manual smoke test: login → menu → order (web + native    │
│     if relevant)                                             │
│                                                              │
│  Documentation                                               │
│  ☐ PHASE_LOG.md entry added (template in §6 below)          │
│  ☐ PRD.md updated                                            │
│  ☐ EXECUTION_PLAN.md tracker table updated                  │
│  ☐ Rollback procedure in Contract §7 verified executable    │
│  ☐ test_credentials.md updated if auth touched              │
│                                                              │
│  Sign-off                                                    │
│  ☐ User typed "Phase XX approved" (or equivalent)           │
│                                                              │
│  GATE STATUS: ☐ PENDING   ☐ PASSED   ☐ FAILED → REWORK      │
│  Approver: ___________  Date: ___________                   │
└──────────────────────────────────────────────────────────────┘
```

**If Exit Gate fails:** phase loops — fix → re-test → re-gate. Don't proceed to next phase even with "minor stuff left over".

---

## 5. Status board (single source of truth)

Lives at top of `/app/memory/EXECUTION_PLAN.md` (already there — keep it updated).

```
| Phase | Status        | Branch              | PR # | Entry Gate | Exit Gate | Tested by         | Report |
|-------|---------------|---------------------|------|------------|-----------|-------------------|--------|
| P1    | ☐ Not started | cr/phase-1-safety  | –    | ☐         | ☐        | testing_agent_v3  | –      |
| P2    | ☐ Not started | cr/phase-2-backend | –    | ☐         | ☐        | testing_agent_v3  | –      |
| ...   |               |                     |      |            |           |                   |        |
```

**Status values:**
- `☐ Not started`
- `🔵 Entry Gate pending`
- `🟡 In progress`
- `🟠 Testing`
- `🔴 Failed Exit Gate — rework`
- `✅ Merged & verified`
- `↩️ Rolled back` (with link to follow-up phase)

E1 updates this after every meaningful event. User reads this to know "where are we right now?" without scrolling chat history.

---

## 6. Phase Log (audit trail)

Append-only log at `/app/memory/PHASE_LOG.md`. Entry per phase:

```markdown
## Phase P1 — Stop the bleeding

**Branch:** `cr/phase-1-safety`
**Started:** 2026-05-30 14:00 IST
**Merged:** 2026-05-31 11:30 IST
**Approver:** <user>
**Duration:** 18h elapsed, ~7h dev time

### Audit findings closed
- ✅ FE-1 (ErrorBoundary added at App.js root)
- ✅ FE-2 (safeRead helpers in all 3 contexts)
- ✅ FE-3, FE-4 (Array.isArray guards in AdminSettings + KioskPage)
- ✅ FE-5, FE-6 (axios JSON content-type interceptor)
- ✅ FE-7 (TimingSettingsContext shift.start.split safe-guarded)

### Files modified (matches whitelist ✅)
- frontend/src/App.js                              (+5/-2)
- frontend/src/components/ErrorBoundary.jsx        (+58 new)
- frontend/src/utils/safeRead.js                   (+24 new)
- frontend/src/utils/kioskHelpers.js               (+18/-2)
- frontend/src/contexts/AuthContext.js             (+12/-8)
- frontend/src/contexts/MenuSettingsContext.js     (+9/-4)
- frontend/src/contexts/TimingSettingsContext.js   (+11/-3)
- frontend/src/pages/AdminSettingsPage.js          (+14/-6)
- frontend/src/pages/KioskPage.js                  (+8/-3)

### Test report
`/app/test_reports/iteration_5.json`
- P1.T1 (poison localStorage)        ✅ PASS
- P1.T2 (HTML response)              ✅ PASS
- P1.T3 (bad timing settings)        ✅ PASS
- P1.T4 (forced crash)               ✅ PASS
- P1.T5 (regression happy-path)      ✅ PASS

### Deviations from plan
None.

### Risks discovered (not in original plan)
- Found that `kiosk_branding` is also read on startup; added safeRead there too.
  Logged as new finding FE-NEW-1 (defensive, covered by safeRead pattern).

### Rollback verified
Tested `git revert HEAD` locally; supervisor restart restored prior behaviour in 4s.

### Next phase
P2 starts on user go-ahead.
```

---

## 7. Change Notes (mid-phase deviations)

Sometimes mid-phase you discover something. Don't silently add it; file a **Change Note** at `/app/memory/phases/PXX_change_notes.md`:

```markdown
## CN-P1-001 — 2026-05-30 16:45
**Found while implementing:** safeRead helper
**Issue:** `kiosk_branding` localStorage key wasn't in original Phase 1 scope but reads through same poisonable path
**Decision:** ✅ Include in this phase (1 extra line, same pattern, zero risk)
**Approved by:** User (chat confirmation: "yeah cover that too")
**Updated Contract:** Added `kiosk_branding` to FE-2's scope; whitelist unchanged (AuthContext already in list)
```

If a deviation requires touching a file NOT on the whitelist → **STOP**, get user approval to amend Contract, then proceed.

---

## 8. Communication cadence

| Event | When | Format |
|---|---|---|
| Phase Entry | Before starting | E1 posts Contract summary in chat → user replies "go" |
| In-progress check | After each major sub-step | E1 brief 2-line status: what done, what next |
| Test results | After testing_agent_v3 returns | E1 posts test summary table; user can drill into report file |
| Exit Gate | Before merge | E1 posts Exit Gate checklist filled in → user replies "approved" |
| Rollback | If post-merge regression | E1 posts within 5 min: "rolling back Phase XX, reason: ..." |
| Phase closed | After merge | E1 posts 3-line summary; updates tracker |

> **Heuristic:** if you can't summarise phase status in 3 lines, you've lost the thread.

---

## 9. Escalation paths

| Symptom | Action |
|---|---|
| Test failure E1 can't reproduce | Invoke **troubleshoot_agent** with full context (logs, repro steps, failed test ID) |
| testing_agent_v3 reports something cosmetic and refuses to retest | Read the report carefully; if truly cosmetic, document in Change Note and proceed |
| 3+ test iterations on same phase without convergence | Pause; check Contract — likely scope-creep or unclear deliverable |
| Native APK won't deploy correctly | Invoke **deployment_agent** with build logs |
| User asks for something outside this CR | Politely defer: "Filed for separate CR; finishing P_current first" |
| User wants to skip a gate | Push back once with the OP-3/OP-6 principle; if user still insists, document the skip in PHASE_LOG with explicit "skipped by user decision" note |

---

## 10. Quality bars (Definition of Done)

For a phase to be ✅ **Merged & verified**:

1. **Functional:** All test scenarios in Phase Contract §3 pass.
2. **Regression-clean:** No tests from previous phases regress.
3. **Documented:** PHASE_LOG entry, Contract closed out, tracker updated.
4. **Scope-clean:** `git diff --stat` shows only whitelisted files (or change notes for additions).
5. **Approved:** User explicit go-ahead recorded in chat / log.
6. **Reversible:** `git revert` would restore prior behaviour cleanly (no cross-phase entanglement).

If any of the 6 isn't satisfied → phase is **not done**, regardless of how good the code looks.

---

## 11. Anti-patterns to flag (red flags during execution)

| Smell | Action |
|---|---|
| "Let's also fix this while we're here" without Change Note | STOP — file CN or defer |
| Skipping testing_agent because "it's a tiny change" | OP-3 says no. Run it. |
| Phase taking >2× estimated effort | Re-read Contract; likely scope creep. Pause, re-scope. |
| `git diff` shows files outside whitelist | STOP. Either remove changes or update Contract |
| User saying "looks fine, move on" without saying "approved" | Ask explicitly: "Phase XX approved?" — get a yes |
| Test report `iteration_X.json` not read line-by-line | Re-read. Low-priority bugs in low-priority paths still bricked the kiosk last time. |
| Multiple phases' work mixed in one PR | Split. Phase boundaries = PR boundaries. |

---

## 12. Tooling support (light automation, optional)

The control layer is mostly process. A few small scripts make it cheaper to enforce:

### 12.1 `verify_whitelist.sh` — confirms `git diff` ⊆ whitelist
```bash
#!/usr/bin/env bash
# /app/scripts/verify_whitelist.sh PXX
PHASE=$1
WHITELIST=$(grep -E '^- `' /app/memory/phases/${PHASE}_contract.md | sed 's/.*`\(.*\)`.*/\1/')
TOUCHED=$(git diff --name-only main...HEAD)
for f in $TOUCHED; do
  if ! echo "$WHITELIST" | grep -qx "$f"; then
    echo "❌ File outside whitelist: $f"
    exit 1
  fi
done
echo "✅ All touched files in whitelist"
```

### 12.2 `phase_status.sh` — pretty-prints the tracker
```bash
#!/usr/bin/env bash
grep -E '^\| P[0-9]+' /app/memory/EXECUTION_PLAN.md
```

### 12.3 Pre-commit hook (optional)
Block commits touching files outside the current phase's whitelist. Implement only if discipline slips.

---

## 13. Quick-reference card (for daily use)

```
┌─────────────────────────────────────────────────────────────┐
│  KIOSK CR — DAILY CHECKLIST                                 │
│                                                              │
│  Starting work today?                                        │
│   1. Read EXECUTION_PLAN tracker → know current phase       │
│   2. Read PXX_contract.md → know today's scope              │
│   3. Read last PHASE_LOG entry → know where we left off     │
│                                                              │
│  About to commit?                                            │
│   4. git diff --stat — touches only whitelisted files? ✓    │
│   5. Each change maps to an audit ID (FE-/BE-/RN-/R-)? ✓    │
│                                                              │
│  Phase feels done?                                           │
│   6. Run Exit Gate checklist                                 │
│   7. Invoke testing_agent_v3                                 │
│   8. Read test report fully                                  │
│   9. Update PHASE_LOG, tracker, PRD                          │
│  10. Ask user: "Phase XX approved?"                         │
│  11. Get explicit "yes" → merge                              │
│  12. Update tracker to ✅ Merged & verified                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 14. Initial setup tasks (do these once, now)

To activate the control layer:

- [ ] Create `/app/memory/phases/` directory
- [ ] Create empty `/app/memory/PHASE_LOG.md` with this header:
   ```
   # Kiosk CR — Phase Log
   Append-only audit trail. Newest entries at bottom.
   ```
- [ ] Confirm `/app/memory/EXECUTION_PLAN.md` tracker table has the Status / Branch / Entry / Exit columns added
- [ ] (Optional) Create `/app/scripts/verify_whitelist.sh`
- [ ] Acknowledge OP-1 through OP-8 — user confirms acceptance of these rules

After these 5 items, the next "start Phase 1" command triggers:

1. E1 drafts `P1_contract.md` and posts summary to chat.
2. User reads, confirms scope ("looks good, go" or "tweak this then go").
3. E1 ticks Entry Gate boxes in chat → starts implementation.
4. Process loop runs.
5. Exit Gate, merge, log, next phase.

---

## 15. Roles & responsibilities (R-A-C-I)

| Activity | E1 | testing_agent_v3 | User | troubleshoot_agent | deployment_agent |
|---|---|---|---|---|---|
| Draft Phase Contract | **R** | I | **A** | – | – |
| Implement code | **R/A** | – | I | C | C (P3) |
| Run test plan | I | **R/A** | I | – | – |
| Read test report | **R** | I | C | C | – |
| Fix test failures | **R/A** | I | I | C | – |
| Approve Entry Gate | I | – | **R/A** | – | – |
| Approve Exit Gate | I | I | **R/A** | – | – |
| Merge PR | I | – | **R/A** | – | – |
| Rollback | **R/A** | I | C/A | C | C |
| Update logs | **R/A** | – | I | – | – |

**R** = Responsible (does the work), **A** = Accountable (signs off), **C** = Consulted, **I** = Informed.

---

## 16. Acceptance: what "this control layer is working" looks like

After 3 phases, you should be able to ask any of these questions and answer in <30 seconds by reading one of the docs:

- "What's the current phase status?" → `EXECUTION_PLAN.md` tracker
- "What did Phase X actually change?" → `PHASE_LOG.md` entry
- "Why was finding FE-9 not closed in Phase 4?" → `P4_contract.md` §1 (out of scope) + reason
- "How do we roll back Phase 5 if needed?" → `P5_contract.md` §7
- "Did we test scenario Y in Phase 3?" → test report linked from `PHASE_LOG.md`

If any of those takes >30 seconds, the control layer has a gap — fix the doc.

---

**End of control layer spec.** Once user confirms OP-1 through OP-8, this becomes binding for the duration of the Kiosk CR.

Saved at `/app/memory/CONTROL_LAYER.md`.
