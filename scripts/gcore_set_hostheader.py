import json
import ssl
import urllib.request
import urllib.error

BASE = "https://api.gcore.com"
TOKEN = "41550_b902a8dd3ed3d18c0e9e5d21d526e2379b97bd5e796be0e8e432086ab0e8648c3323c54a537b8fe6015aa645bb2f5dab57ae67861763b5a2923720e09f7e8eca"
OG = 1495965

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
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except Exception:
            return e.code, {}
    except Exception as e:
        return -1, {"_err": str(e)}


code, og = call("GET", f"/cdn/origin_groups/{OG}")
print("GET origin group:", code)
print(json.dumps(og, indent=2, ensure_ascii=False)[:1200])

if code != 200:
    raise SystemExit(1)

# Пытаемся PATCH host_header
payload = {"name": og.get("name", "obedclass-origin"),
           "host_header": "school-canteen-psi.vercel.app"}
if og.get("is_balancing_by_dns") is not None:
    payload["is_balancing_by_dns"] = og.get("is_balancing_by_dns")
if og.get("origins"):
    payload["origins"] = og["origins"]

code, resp = call("PATCH", f"/cdn/origin_groups/{OG}", payload)
print("\nPATCH:", code, json.dumps(resp, ensure_ascii=False)[:600])

if code not in (200, 201):
    # пробуем без origins
    payload.pop("origins", None)
    code, resp = call("PATCH", f"/cdn/origin_groups/{OG}", payload)
    print("PATCH retry:", code, json.dumps(resp, ensure_ascii=False)[:600])
