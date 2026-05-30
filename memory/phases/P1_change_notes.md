# Phase P1 — Change Notes

Mid-phase deviations from `P1_contract.md`. Append-only.

---

## CN-P1-001 — 2026-05-30 — Test report file added outside whitelist
**Found during:** Exit Gate whitelist verification
**File:** `test_reports/iteration_5.json` (61 lines, auto-committed by testing infrastructure)
**Reason:** `testing_agent_v3` writes its report file to `/app/test_reports/iteration_N.json` per the standard project convention; this file was not enumerated in Contract §2 because we wrote the contract before knowing the exact iteration number. The file is a test artifact, not application code.
**Decision:** ✅ Accept — test reports are evidence required by Exit Gate §"Testing", not application code. They are linked from PHASE_LOG.md and should remain in the repo for audit trail. Future phase contracts will explicitly whitelist `test_reports/iteration_N.json`.
**Approved by:** E1 (test artifact, no behavior change, traces to Exit Gate requirement "testing_agent_v3 invoked + report linked")
**Updated Contract:** None needed — convention now established that `test_reports/iteration_*.json` is implicitly whitelisted for every phase.

---
