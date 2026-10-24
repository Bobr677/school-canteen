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
    print("GET resource failed:", code, res)
    raise SystemExit(1)

print("resource:", res.get("cname"), "| status:", res.get("status"))
print("sslEnabled:", res.get("sslEnabled"))
print("sslData:", json.dumps(res.get("sslData"), ensure_ascii=False))
print("originProtocol:", res.get("originProtocol"))
print("originGroup:", res.get("originGroup"))

# Список SSL-сертификатов, чтобы найти LE-сертификат для obedklass.online
code, certs = call("GET", "/cdn/sslData")
if code == 200 and isinstance(certs, list):
    print("\n--- SSL certificates ---")
    for c in certs:
        print(
            f"id={c.get('id')} name={c.get('name')} issuer={c.get('cert_issuer')} "
            f"not_before={c.get('validity_not_before')} not_after={c.get('validity_not_after')} "
            f"status={json.dumps(c.get('ssl_status') or c.get('statuses') or [], ensure_ascii=False)}"
        )
else:
    print("\nsslData list:", code, certs)
