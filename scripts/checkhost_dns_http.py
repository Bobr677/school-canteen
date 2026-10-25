import json
import time
import urllib.request

HDRS = {"Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"}


def submit(kind, host, max_nodes=10):
    url = f"https://check-host.net/check-{kind}?host={host}&max_nodes={max_nodes}"
    req = urllib.request.Request(url, headers=HDRS)
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.loads(r.read().decode())
    return data.get("request_id"), [n[0] for n in data.get("nodes", [])]


def poll(req_id, rounds=14, pause=6):
    for i in range(rounds):
        time.sleep(pause)
        req = urllib.request.Request(f"https://check-host.net/check-result/{req_id}", headers=HDRS)
        with urllib.request.urlopen(req, timeout=30) as r:
            res = json.loads(r.read().decode())
        done = sum(1 for v in res.values() if v)
        total = len(res)
        if i == 0 or done == total:
            print(f"  [{i+1}] готовы {done}/{total}")
        if done == total:
            break
    return res


# 1. DNS с российских и других узлов
print("=== CHECK-DNS obedklass.ru ===")
rid, nodes = submit("dns", "obedklass.ru", 10)
print("request:", rid, "| узлов:", len(nodes))
dns_res = poll(rid)

# 2. HTTP с российских узлов (больше узлов)
print("\n=== CHECK-HTTP https://obedklass.ru ===")
rid2, nodes2 = submit("http", "https://obedklass.ru", 10)
print("request:", rid2, "| узлов:", len(nodes2))
http_res = poll(rid2)

print("\n=== DNS-РЕЗУЛЬТАТЫ ===")
for node, v in sorted(dns_res.items()):
    print(f"{node:22s} -> {json.dumps(v, ensure_ascii=False)[:180]}")

print("\n=== HTTP-РЕЗУЛЬТАТЫ ===")
for node, v in sorted(http_res.items()):
    print(f"{node:22s} -> {json.dumps(v, ensure_ascii=False)[:180]}")
