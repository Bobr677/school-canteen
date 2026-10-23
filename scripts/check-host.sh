#!/usr/bin/env bash
URL="$1"
NODES="ru1.node.check-host.net&node=ru2.node.check-host.net&node=ru3.node.check-host.net&node=ru4.node.check-host.net"
REQ=$(curl -sf "https://check-host.net/check-http?host=$URL&$NODES&max_nodes=4" -H "Accept: application/json" | python3 -c "import json,sys;print(json.load(sys.stdin).get('request_id',''))")
[ -z "$REQ" ] && { echo "check-host request failed for $URL"; exit 1; }
for i in 1 2 3 4 5 6; do
  sleep 10
  DATA=$(curl -sf "https://check-host.net/check-result/$REQ" -H "Accept: application/json")
  PENDING=$(echo "$DATA" | python3 -c "import json,sys;d=json.load(sys.stdin);print(sum(1 for v in d.values() if v is None))")
  [ "$PENDING" = "0" ] && break
done
echo "$DATA" | python3 - "$URL" << 'EOF'
import json, sys
d = json.load(sys.stdin)
url = sys.argv[1]
ok, bad = 0, []
for node, res in sorted(d.items()):
    e = res[0] if res else None
    if e and isinstance(e, dict) and e.get("status") == 1 and not e.get("error"):
        ok += 1
        t = e.get("time", "?")
        print(f"  OK   {node}: {t}s")
    else:
        err = e.get("error") if isinstance(e, dict) else None
        bad.append(f"{node}: {err or 'no answer/timeout'}")
for b in bad:
    print(f"  FAIL {b}")
print(f"RESULT {url}: ok={ok}/{len(d)}")
EOF
