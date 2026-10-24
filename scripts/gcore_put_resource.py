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

# Ключевые поля, которые нельзя потерять
keep = {
    "cname": res["cname"],
    "originGroup": res["originGroup"],
    "originProtocol": res["originProtocol"],
    "sslEnabled": res["sslEnabled"],
    "sslData": res.get("sslData"),
    "primaryResource": res.get("primaryResource", True),
    "hostHeader": "school-canteen-psi.vercel.app",
    "status": res.get("status"),
}
# Добавляем опции, если есть
for opt_key in ("options",):
    if opt_key in res and res[opt_key] is not None:
        keep[opt_key] = res[opt_key]

print("PUT payload keys:", sorted(keep.keys()))
code, resp = call("PUT", f"/cdn/resources/{RES}", keep)
print("PUT:", code)
if code not in (200, 201):
    print(json.dumps(resp, ensure_ascii=False)[:1000])
    # повтор без hostHeader, если поле не принято
    if "hostHeader" in keep:
        errors = str(resp.get("errors", ""))
        if "hostHeader" in errors:
            keep.pop("hostHeader")
            code, resp = call("PUT", f"/cdn/resources/{RES}", keep)
            print("PUT retry w/o hostHeader:", code)
            print(json.dumps(resp, ensure_ascii=False)[:600])
    if code not in (200, 201):
        raise SystemExit(1)
else:
    print("hostHeader =", resp.get("hostHeader"))

# Purge весь кэш ресурса
code, resp = call("DELETE", f"/cdn/resources/{RES}/cache/purge_all")
print("purge_all:", code, json.dumps(resp, ensure_ascii=False)[:200])
