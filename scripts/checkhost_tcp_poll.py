import json
import time
import urllib.request
import urllib.error

H = {"Accept": "application/json"}


def get(url, tries=4):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=H)
            with urllib.request.urlopen(req, timeout=30) as r:
                txt = r.read().decode()
                if txt.strip():
                    return json.loads(txt)
        except Exception as e:
            print(f"  (retry {i+1}: {type(e).__name__})")
        time.sleep(8)
    return {}


def start_check(kind, host, nodes):
    q = "&".join(f"node={n}" for n in nodes)
    url = f"https://check-host.net/check-{kind}?host={host}&{q}&max_nodes={len(nodes)}"
    d = get(url)
    rid = d.get("request_id")
    print(f"start {kind} {host}: {rid}")
    return rid


def poll(rid, label, wait=25):
    time.sleep(wait)
    for attempt in range(4):
        d = get(f"https://check-host.net/check-result/{rid}")
        if d and all(v is not None for v in d.values()) and d:
            print(f"=== {label} ===")
            for node, res in sorted(d.items()):
                e = res[0] if res else None
                if e is None:
                    print(f"  PENDING {node}")
                elif isinstance(e, dict) and e.get("status") == 1:
                    print(f"  OK   {node}: {e.get('time')}s")
                elif isinstance(e, list) and len(e) >= 3:
                    # формат check-tcp: [status, time, msg, ...]
                    st, msg = e[0], e[2]
                    print(f"  {'OK  ' if st == 1 else 'FAIL'} {node}: {msg} ({e[1]}s)")
                else:
                    print(f"  ?    {node}: {e}")
            return
        time.sleep(12)
    print(f"=== {label} === TIMEOUT")


RU = ["ru1.node.check-host.net", "ru2.node.check-host.net", "ru3.node.check-host.net"]

# 1. Повторный опрос уже созданных заявок
poll("532b2cd3k705", "TCP 80.240.113.62:443 (Gcore Москва)")
poll("532b30aak4a3", "TCP 92.223.84.84:443 (Gcore anycast)")

# 2. Контрольная нода
rid = start_check("tcp", "ya.ru%3A443", RU)
if rid:
    poll(rid, "Контроль TCP ya.ru:443")
