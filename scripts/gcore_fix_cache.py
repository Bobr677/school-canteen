import json
import ssl
import urllib.request
import urllib.error

BASE = "https://api.gcore.com"
TOKEN = "41550_b902a8dd3ed3d18c0e9e5d21d526e2379b97bd5e796be0e8e432086ab0e8648c3323c54a537b8fe6015aa645bb2f5dab57ae67861763b5a2923720e09f7e8eca"
RES = 1257942

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


code, res = call("GET", f"/cdn/resources/{RES}")
if code != 200:
    print("GET failed:", code, res)
    raise SystemExit(1)

options = res.get("options") or {}

# 1. Отключаем жёсткий 4-дневный edge-кэш: кэширование по заголовкам origin (Next.js)
#    (при enabled=False API всё равно требует default/value — оставляем старое значение)
options["edge_cache_settings"] = {"enabled": False, "default": "4d"}
# 2. HTTP -> HTTPS редирект на edge (API требует value=true)
options["redirect_http_to_https"] = {"enabled": True, "value": True}

payload = {
    "cname": res["cname"],
    "originGroup": res["originGroup"],
    "originProtocol": res["originProtocol"],
    "sslEnabled": res["sslEnabled"],
    "sslData": res.get("sslData"),
    "primaryResource": res.get("primaryResource", True),
    "options": options,
}

code, resp = call("PUT", f"/cdn/resources/{RES}", payload)
print("PUT:", code)
if code not in (200, 201):
    print(json.dumps(resp, ensure_ascii=False)[:1500])
    # повтор: убрать возможные проблемные поля из errors
    raise SystemExit(1)

opts = resp.get("options") or {}
print("edge_cache_settings:", opts.get("edge_cache_settings"))
print("redirect_http_to_https:", opts.get("redirect_http_to_https"))
print("status:", resp.get("status"))
