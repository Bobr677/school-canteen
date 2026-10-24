import json
import ssl
import time
import urllib.request

BASE = "https://api.gcore.com"
TOKEN = "41550_b902a8dd3ed3d18c0e9e5d21d526e2379b97bd5e796be0e8e432086ab0e8648c3323c54a537b8fe6015aa645bb2f5dab57ae67861763b5a2923720e09f7e8eca"
RES = 1257942

CTX = ssl.create_default_context()


def call(method, path, payload=None):
    req = urllib.request.Request(BASE + path, method=method)
    req.add_header("Authorization", "APIKey " + TOKEN)
    if payload is not None:
        req.add_header("Content-Type", "application/json")
        data = json.dumps(payload).encode()
    else:
        data = None
    try:
        with urllib.request.urlopen(req, data=data, timeout=30, context=CTX) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except Exception:
            return e.code, {}


code, res = call("GET", f"/cdn/resources/{RES}")
if code != 200:
    print("GET failed:", code, res)
    raise SystemExit(1)

print("current sslEnabled:", res.get("sslEnabled"), "| status:", res.get("status"))

payload = dict(res)
payload["sslEnabled"] = True

code, resp = call("PUT", f"/cdn/resources/{RES}", payload)
print("PUT:", code)
if code not in (200, 201):
    errors = resp.get("errors", {})
    print("errors:", json.dumps(errors, ensure_ascii=False))
    drop = []
    for field in errors:
        if field in payload:
            drop.append(field)
    if drop:
        print("retrying without fields:", drop)
        for f in drop:
            payload.pop(f, None)
        payload["sslEnabled"] = True
        code, resp = call("PUT", f"/cdn/resources/{RES}", payload)
        print("PUT retry:", code)
        if code not in (200, 201):
            print("errors:", json.dumps(resp.get("errors", {}), ensure_ascii=False))
            raise SystemExit(1)

print("sslEnabled:", resp.get("sslEnabled"))
print("sslData:", json.dumps(resp.get("sslData"), ensure_ascii=False))
print("status:", resp.get("status"))
