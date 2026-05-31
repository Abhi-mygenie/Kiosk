# `/app/memory/refactor_cr/` — Kiosk Refactor CR governance

> **Scope:** everything in this directory and its sub-directories applies **only** to the multi-phase Kiosk Refactor CR. It is **not** a general framework for future work on this codebase.

If you're picking up new feature work or bug fixes on the kiosk app, you can safely **ignore this entire folder** and proceed per normal Emergent platform conventions. The audits under `audits/` may still be useful as context.

If you're continuing the refactor, start here:

```
1. /app/scripts/refactor_cr_status.sh           ← run first (dashboard)
2. /app/memory/refactor_cr/STATUS.md             ← always-current state
3. /app/memory/refactor_cr/CONTROL_LAYER.md      ← OP-1 to OP-8 (binding for refactor only)
4. /app/memory/refactor_cr/EXECUTION_PLAN.md     ← 10-phase plan + tracker
5. /app/memory/refactor_cr/PHASE_LOG.md          ← what was done, per phase
6. /app/memory/refactor_cr/phases/PXX_contract.md ← active phase scope + gates
```

## Files at a glance

| File | Purpose |
|---|---|
| `STATUS.md` | Live dashboard — current phase, branch, blockers, next action |
| `CONTROL_LAYER.md` | Process rules (OP-1 to OP-8) + cross-session handoff guide §17 |
| `EXECUTION_PLAN.md` | 10-phase roadmap + full tracker table |
| `PHASE_LOG.md` | Append-only audit trail of what was done per phase |
| `SESSION_CLOSE.md` | End-of-session snapshot (resume point) |
| `audits/CRASH_AUDIT.md` | 33 findings on the original kiosk-bricking class |
| `audits/FULL_CODEBASE_AUDIT.md` | 67 stability/security findings across 176 files |
| `audits/REFACTOR_AUDIT.md` | 57 architecture/dedup findings |
| `phases/PXX_contract.md` | Per-phase scope, whitelist, gates, test plan, rollback |
| `phases/PXX_change_notes.md` | Per-phase deviations from contract (only if any) |

## Helper scripts (in `/app/scripts/`)

| Script | Purpose |
|---|---|
| `refactor_cr_status.sh` | One-shot dashboard — git, services, contract, tests, next action |
| `refactor_cr_verify_whitelist.sh <phase>` | Confirm `git diff` ⊆ phase contract's file whitelist |

Both scripts are read-only — they never modify state.

## Why this folder exists

A standard Emergent project uses `/app/memory/PRD.md` for product context and that's enough. This codebase grew an additional layer of governance because the team is running a deliberate, multi-phase refactor with strict change-control. Once the refactor is complete (P10 closes), this entire folder can be archived or deleted — `PRD.md` and `HANDOVER_NOTES.md` are sufficient for normal operation.
