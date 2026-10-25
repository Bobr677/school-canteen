import json
import time
import urllib.request

HDRS = {"Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"}

RU_NODES = ["ru1.node.check-host.net", "ru2.node.check-host.net", "ru3.node.check-host.net"]


def submit(kind, host):
    q = f"host={host}&" + "&".join(f"node={n}" for n in RU_NODES)
    req = urllib.request.Request(f"https://check-host.net/check-{kind}?{q}", headers=HDRS)
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.loads(r.read().decode())
    return data.get("request_id")


def poll(req_id, rounds=12, pause=6):
    for i in range(rounds):
        time.sleep(pause)
        req = urllib.request.Request(f"https://check-host.net/check-result/{req_id}", headers=HDRS)
        with urllib.request.urlopen(req, timeout=30) as r:
            res = json.loads(r.read().decode())
        if all(v for v in res.values()):
            break
    return res


# 1. HTTP с трёх российских узлов
rid = submit("http", "https://obedklass.ru")
print("HTTP request:", rid)
res = poll(rid)
print("=== HTTP из РФ ===")
for node, v in sorted(res.items()):
    print(f"  {node.split('.')[0]:5s} -> {json.dumps(v, ensure_ascii=False)[:150]}")

# 2. TCP 443 к edge-IP с российских узлов
rid2 = submit("tcp", "80.240.113.62:443")
print("TCP request:", rid2)
res2 = poll(rid2)
print("=== TCP 443 к 80.240.113.62 из РФ ===")
for node, v in sorted(res2.items()):
    print(f"  {node.split('.')[0]:5s} -> {json.dumps(v, ensure_ascii=False)[:150]}")

# 3. DNS с российских узлов
rid3 = submit("dns", "obedklass.ru")
print("DNS request:", rid3)
res3 = poll(rid3)
print("=== DNS из РФ ===")
for node, v in sorted(res3.items()):
    print(f"  {node.split('.')[0]:5s} -> {json.dumps(v, ensure_ascii=False)[:150]}")
