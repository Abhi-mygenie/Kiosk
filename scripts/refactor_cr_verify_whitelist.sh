#!/usr/bin/env bash
#
# refactor_cr_verify_whitelist.sh — confirms git diff ⊆ phase whitelist
# Scope: REFACTOR CR only. Not for general feature work.
#
# Usage:  ./refactor_cr_verify_whitelist.sh <phase_id>   (e.g. P1, P2, P9a)
#
# Reads the file whitelist from /app/memory/refactor_cr/phases/<phase_id>_contract.md,
# section "## 2. Files touched (whitelist)", then compares against the
# files actually modified vs main.
#
# Exit codes:
#   0  → all touched files in whitelist
#   1  → at least one file outside whitelist (lists offenders)
#   2  → usage error or contract not found

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <phase_id>"
  echo "Example: $0 P1"
  exit 2
fi

PHASE="$1"
CONTRACT="/app/memory/refactor_cr/phases/${PHASE}_contract.md"

if [[ ! -f "$CONTRACT" ]]; then
  echo "❌ Contract not found: $CONTRACT"
  exit 2
fi

# Extract whitelist: lines like "- `path/to/file`" inside section §2
WHITELIST=$(awk '
  /^## 2\. Files touched/  { in_section=1; next }
  /^## 3\./                 { in_section=0 }
  in_section && /^- `/      {
    sub(/^- `/, "")
    sub(/`.*$/, "")
    print
  }
' "$CONTRACT")

if [[ -z "$WHITELIST" ]]; then
  echo "❌ Whitelist empty or unparseable in $CONTRACT"
  exit 2
fi

# Files changed vs main (committed + staged + unstaged)
TOUCHED=$(git diff --name-only main 2>/dev/null; git diff --name-only --cached; git diff --name-only)
TOUCHED=$(echo "$TOUCHED" | sort -u | grep -v '^$' || true)

if [[ -z "$TOUCHED" ]]; then
  echo "ℹ️  No files changed vs main."
  exit 0
fi

OFFENDERS=""
for f in $TOUCHED; do
  if ! echo "$WHITELIST" | grep -qFx "$f"; then
    OFFENDERS="$OFFENDERS $f"
  fi
done

echo "----- Whitelist ($PHASE) -----"
echo "$WHITELIST"
echo ""
echo "----- Touched files -----"
echo "$TOUCHED"
echo ""

if [[ -n "$OFFENDERS" ]]; then
  echo "❌ Files outside whitelist:"
  for f in $OFFENDERS; do echo "  - $f"; done
  echo ""
  echo "Either remove the changes, or update the Contract §2 with a Change Note."
  exit 1
fi

echo "✅ All touched files in whitelist."
exit 0
