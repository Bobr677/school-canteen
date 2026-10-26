# Добавляем www.obedklass.ru -> 80.240.113.62 (тот же edge IP, отличается только имя).
# Цель: чистый тест ТСПУ/DPI-фильтра (точечный блок имени vs ключевое слово),
# и потенциальный бесплатный обход, если фильтр ловит только точное имя.
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


def list_rrsets():
    code, recs = call("GET", "/dns/v2/zones/obedklass.ru/rrsets?per_page=50")
    if code != 200:
        print("LIST rrsets: HTTP", code, json.dumps(recs, ensure_ascii=False)[:300])
        return []
    out = []
    for r in recs.get("rrsets", []):
        out.append((r.get("name"), r.get("type"), r.get("ttl"),
                    r.get("short_answers") or r.get("records")))
    return out


print("=== Состояние зоны и записей ДО ===")
code, z = call("GET", "/dns/v2/zones/obedklass.ru")
if code == 200:
    print("zone:", {k: z.get(k) for k in ("name", "status", "enabled", "verified")})
else:
    print("GET zone: HTTP", code, json.dumps(z, ensure_ascii=False)[:300])

for name, rtype, ttl, ans in list_rrsets():
    print("  ", name, rtype, "ttl", ttl, ans)

# Идемпотентно добавляем www
existing = [n for n, t, _, _ in list_rrsets() if n.rstrip(".") == "www.obedklass.ru"]
if existing:
    print("\nwww уже есть — пропускаем добавление")
else:
    rr = {"ttl": 300, "resource_records": [{"content": ["80.240.113.62"], "enabled": True}]}
    code, resp = call("POST", "/dns/v2/zones/obedklass.ru/www.obedklass.ru./A", rr)
    print("\nADD www A record:", code, json.dumps(resp, ensure_ascii=False)[:300])

print("\n=== Состояние записей ПОСЛЕ ===")
for name, rtype, ttl, ans in list_rrsets():
    print("  ", name, rtype, "ttl", ttl, ans)
