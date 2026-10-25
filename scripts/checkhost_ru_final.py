import json
import time
import urllib.request

HDRS = {"Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"}
TARGET = "https://obedklass.ru"

req = urllib.request.Request(
    f"https://check-host.net/check-http?host={TARGET}&max_nodes=7", headers=HDRS)
with urllib.request.urlopen(req, timeout=30) as r:
    data = json.loads(r.read().decode())
req_id = data.get("request_id")
nodes = data.get("nodes", [])
print("request_id:", req_id)
print("узлы:", [n[1] for n in nodes])

for i in range(12):
    time.sleep(5)
    req2 = urllib.request.Request(f"https://check-host.net/check-result/{req_id}", headers=HDRS)
    with urllib.request.urlopen(req2, timeout=30) as r:
        res = json.loads(r.read().decode())
    done = all(v for v in res.values())
    print(f"  [{i+1}] готовы {sum(1 for v in res.values() if v)}/{len(res)}")
    if done:
        break

print("\n=== РЕЗУЛЬТАТЫ ===")
for node, v in sorted(res.items()):
    loc = node.split(".")[0]
    print(f"{loc:14s} -> {json.dumps(v, ensure_ascii=False)[:160]}")
