import json
import ssl
import urllib.request
import urllib.error

BASE = "https://api.gcore.com"
TOKEN = "41550_b902a8dd3ed3d18c0e9e5d21d526e2379b97bd5e796be0e8e432086ab0e8648c3323c54a537b8fe6015aa645bb2f5dab57ae67861763b5a2923720e09f7e8eca"

ctx = ssl.create_default_context()


def call(method, path, payload=None):
    req = urllib.request.Request(BASE + path, method=method)
    req.add_header("Authorization", "APIKey " + TOKEN)
    if payload is not None:
        req.add_header("Content-Type", "application/json")
        data = json.dumps(payload).encode()
    else:
        data = None
    try:
        with urllib.request.urlopen(req, data=data, timeout=30, context=ctx) as r:
            body = r.read().decode()
            return r.status, (json.loads(body) if body.strip() else {})
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except Exception:
            return e.code, {}
    except Exception as e:
        return -1, {"_err": str(e)}


# 1. Создаём зону obedklass.ru (409 = уже создана ранее — ок)
code, zone = call("POST", "/dns/v2/zones", {"name": "obedklass.ru", "rollback": False})
print("create zone:", code, json.dumps(zone, ensure_ascii=False)[:300])
if code not in (200, 201, 409):
    raise SystemExit(1)

# 2. Добавляем A-запись @ -> 80.240.113.62 (TTL 300)
# v2 API: POST /dns/v2/zones/{zone}/{rrset_name}/{type}
rr = {
    "ttl": 300,
    "resource_records": [{"content": ["80.240.113.62"], "enabled": True}],
}
for rname in ("obedklass.ru.",):
    code, resp = call("POST", f"/dns/v2/zones/obedklass.ru/{rname}/A", rr)
    print(f"add A record ({rname}):", code, json.dumps(resp, ensure_ascii=False)[:300])
    if code in (200, 201):
        break

# 3. Проверяем итоговое состояние зоны
code, info = call("GET", "/dns/v2/zones/obedklass.ru")
if code == 200:
    print("zone:", json.dumps({k: info.get(k) for k in ("name", "primary", "verified", "action", "status", "constants")}, ensure_ascii=False))
code, records = call("GET", "/dns/v2/zones/obedklass.ru/rrsets?per_page=20")
if code == 200:
    print("records:")
    for r in records.get("rrsets", []):
        print("  ", r.get("name"), r.get("type"), r.get("ttl"), r.get("short_answers") or r.get("records"))
