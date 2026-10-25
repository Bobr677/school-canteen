import json
import ssl
import urllib.request
import urllib.error
import time

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


def zone_state(tag):
    code, info = call("GET", "/dns/v2/zones/obedklass.ru")
    if code == 200:
        print(f"[{tag}] status={info.get('status')} enabled={info.get('enabled')}")
        return info
    print(f"[{tag}] GET zone: HTTP {code} {json.dumps(info)[:200]}")
    return None


# 0. Текущее состояние
zone_state("before")

# 1. Удаляем зону (внутри 1 A-запись — пересоздадим)
code, resp = call("DELETE", "/dns/v2/zones/obedklass.ru")
print("DELETE zone:", code, json.dumps(resp, ensure_ascii=False)[:200])
if code not in (200, 204):
    raise SystemExit("DELETE failed")

time.sleep(3)

# 2. Создаём зону заново — Gcore повторно проверит делегирование в реестре
code, resp = call("POST", "/dns/v2/zones", {"name": "obedklass.ru", "rollback": False})
print("CREATE zone:", code, json.dumps(resp, ensure_ascii=False)[:300])
if code not in (200, 201, 409):
    raise SystemExit("CREATE failed")

time.sleep(3)

# 3. Состояние после пересоздания
info = zone_state("after-create")

# 4. Возвращаем A-запись (idempotent: 400/409 если уже есть — ок)
rr = {"ttl": 300, "resource_records": [{"content": ["80.240.113.62"], "enabled": True}]}
code, resp = call("POST", "/dns/v2/zones/obedklass.ru/obedklass.ru./A", rr)
print("ADD A record:", code, json.dumps(resp, ensure_ascii=False)[:200])

# 5. Финальное состояние + если зона снова disabled — пробуем enable endpoint
info = zone_state("final")
if info and not info.get("enabled"):
    code, resp = call("PATCH", "/dns/v2/zones/obedklass.ru/enable")
    print("PATCH enable:", code, json.dumps(resp, ensure_ascii=False)[:200])
    zone_state("post-enable")
