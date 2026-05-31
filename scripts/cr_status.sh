#!/usr/bin/env bash
# cr_status.sh — one-shot CR status dashboard for next agent / user.
#
# Run any time:   /app/scripts/cr_status.sh
# Reads from /app/memory/ files; never modifies anything.

set -e

CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  KIOSK CR STATUS — $(date '+%Y-%m-%d %H:%M %Z')${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════${NC}"
echo ""

# 1. Git state
cd /app 2>/dev/null
BRANCH=$(git branch --show-current 2>/dev/null || echo "(no git)")
HEAD=$(git log -1 --format='%h %s' 2>/dev/null || echo "(no commits)")
echo -e "${YELLOW}► Git state${NC}"
echo "  Branch:  $BRANCH"
echo "  HEAD:    $HEAD"
echo ""

# 2. Phase tracker — parse from CR_STATUS.md
echo -e "${YELLOW}► Phase tracker${NC}"
if [[ -f /app/memory/CR_STATUS.md ]]; then
  awk '
    /^## 📋 Phase tracker/ { in_section=1; next }
    in_section && /^## / { in_section=0 }
    in_section && /^\| \*\*P[0-9]+/ {
      # strip markdown
      gsub(/\*\*/, "")
      print "  " $0
    }
  ' /app/memory/CR_STATUS.md | head -12
else
  echo -e "  ${RED}CR_STATUS.md missing — control layer not set up?${NC}"
fi
echo ""

# 3. Active contract
echo -e "${YELLOW}► Active phase contract${NC}"
ACTIVE_CONTRACT=$(ls -t /app/memory/phases/P*_contract.md 2>/dev/null | head -1)
if [[ -n "$ACTIVE_CONTRACT" ]]; then
  echo "  $ACTIVE_CONTRACT"
  grep -E '^\*\*GATE STATUS:\*\*' "$ACTIVE_CONTRACT" | sed 's/^/    /'
else
  echo -e "  ${RED}No contracts found${NC}"
fi
echo ""

# 4. Services health
echo -e "${YELLOW}► Services${NC}"
if command -v supervisorctl >/dev/null 2>&1; then
  sudo supervisorctl status 2>/dev/null | awk '{printf "  %-12s %s\n", $1, $2}' | head -5
else
  echo "  (supervisorctl unavailable)"
fi
echo ""

# 5. API health
echo -e "${YELLOW}► API smoke${NC}"
BE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/api/ 2>/dev/null || echo "ERR")
FE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "ERR")
case "$BE_STATUS" in
  200) echo -e "  Backend  ${GREEN}HTTP 200${NC}" ;;
  *)   echo -e "  Backend  ${RED}HTTP $BE_STATUS${NC}" ;;
esac
case "$FE_STATUS" in
  200) echo -e "  Frontend ${GREEN}HTTP 200${NC}" ;;
  *)   echo -e "  Frontend ${RED}HTTP $FE_STATUS${NC}" ;;
esac
echo ""

# 6. Last test report
echo -e "${YELLOW}► Latest test report${NC}"
LAST_REPORT=$(ls -t /app/test_reports/iteration_*.json 2>/dev/null | head -1)
if [[ -n "$LAST_REPORT" ]]; then
  echo "  $LAST_REPORT"
  python3 -c "
import json, sys
try:
  d = json.load(open('$LAST_REPORT'))
  # Handle either dict-with-summary or list-of-tests shape
  if isinstance(d, dict):
    s = d.get('summary', {})
    if isinstance(s, dict):
      total = s.get('total_tests', s.get('total', '?'))
      passed = s.get('passed_tests', s.get('passed', '?'))
      rate = s.get('success_rate', '?')
      print(f'    {passed}/{total} pass ({rate})')
    else:
      print(f'    (file parsed but no summary section)')
  elif isinstance(d, list):
    total = len(d)
    passed = sum(1 for t in d if isinstance(t, dict) and t.get('status', '').lower() in ('pass', 'passed', 'success'))
    print(f'    {passed}/{total} pass')
  else:
    print(f'    (unexpected file format)')
except Exception as e:
  print(f'    (could not parse: {e})')
" 2>/dev/null || true
else
  echo "  (no test reports yet)"
fi
echo ""

# 7. Next-action pointer
echo -e "${YELLOW}► Next action${NC}"
if [[ -f /app/memory/CR_STATUS.md ]]; then
  awk '
    /^## 🎯 Next concrete actions/ { in_section=1; next }
    in_section && /^## / && !/^## 🎯/ { in_section=0 }
    in_section && /^[0-9]+\./ { print "  " $0; count++; if (count >= 3) exit }
  ' /app/memory/CR_STATUS.md
fi
echo ""

# 8. Reading list pointer
echo -e "${YELLOW}► If you are the next agent — read in this order:${NC}"
echo "  1. /app/memory/CR_STATUS.md      (you are getting a hint of this)"
echo "  2. /app/memory/CONTROL_LAYER.md  (binding rules OP-1..OP-8)"
echo "  3. /app/memory/EXECUTION_PLAN.md (10-phase plan)"
echo "  4. /app/memory/PHASE_LOG.md      (what was done)"
echo "  5. /app/memory/phases/$( basename "$ACTIVE_CONTRACT" 2>/dev/null || echo P2_contract.md )"
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════${NC}"
