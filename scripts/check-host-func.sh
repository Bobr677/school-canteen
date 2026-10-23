#!/usr/bin/env bash
check_one() {
  local URL="$1"
  local NODES="ru1.node.check-host.net&node=ru2.node.check-host.net&node=ru3.node.check-host.net&node=ru4.node.check-host.net"
  local REQ="" DATA="" PENDING="" attempt=""
  for attempt in 1 2 3; do
    REQ=$(curl -s "https://check-host.net/check-http?host=$URL&$NODES&max_nodes=4" -H "Accept: application/json" | python3 -c "import json,sys
try: print(json.load(sys.stdin).get('request_id',''))
except Exception: print('')" )
    [ -n "$REQ" ] && break
    sleep 25
  done
  [ -z "$REQ" ] && { echo "RESULT $URL: request failed (rate limit)"; return; }
  for i in 1 2 3 4 5 6 7 8; do
    sleep 10
    DATA=$(curl -s "https://check-host.net/check-result/$REQ" -H "Accept: application/json")
    PENDING=$(echo "$DATA" | python3 -c "import json,sys
try:
  d=json.load(sys.stdin); print(sum(1 for v in d.values() if v is None))
except Exception: print('err')" )
    [ "$PENDING" = "0" ] && break
  done
  echo "$DATA" | python3 - "$URL" << 'EOF'
import json, sys
try:
    d = json.load(sys.stdin)
except Exception:
    print(f"RESULT {sys.argv[1]}: result parse failed"); sys.exit(0)
url = sys.argv[1]
ok, bad = 0, []
for node, res in sorted(d.items()):
    e = res[0] if res else None
    if e and isinstance(e, dict) and e.get("status") == 1 and not e.get("error"):
        ok += 1
    else:
        err = e.get("error") if isinstance(e, dict) else None
        bad.append(f"{node.split('.')[0]}: {err or 'timeout'}")
for b in bad:
    print(f"  FAIL {b}")
print(f"RESULT {url}: ok={ok}/{len(d)}")
EOF
}
