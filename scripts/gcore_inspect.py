# Инспекция: реальные domains у 1271280 и эталона 1257942, покрытие сертификата 318362
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


for rid in (1271280, 1257942):
    code, res = call("GET", f"/cdn/resources/{rid}")
    if code == 200:
        keep = {k: res.get(k) for k in
                ("id", "cname", "domains", "sslEnabled", "sslData", "primaryResource", "status")}
        print(f"=== resource {rid} ===")
        print(json.dumps(keep, ensure_ascii=False, indent=1))
    else:
        print(f"=== resource {rid}: HTTP {code} ===")

code, cert = call("GET", "/cdn/sslData/318362")
print("=== sslData 318362 ===")
if code == 200:
    slim = {k: v for k, v in cert.items() if k not in ("cert", "chain")}
    print(json.dumps(slim, ensure_ascii=False, indent=1)[:1500])
else:
    print("HTTP", code)

code, certs = call("GET", "/cdn/sslData")
if code == 200 and isinstance(certs, list):
    print("=== все сертификаты ===")
    for c in certs:
        if not c.get("deleted"):
            print("  id:", c.get("id"), "| name:", c.get("name"), "| automated:", c.get("automated"))
