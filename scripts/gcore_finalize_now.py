import json
import ssl
import time
import urllib.request
import urllib.error

BASE = "https://api.gcore.com"
TOKEN = "41550_b902a8dd3ed3d18c0e9e5d21d526e2379b97bd5e796be0e8e432086ab0e8648c3323c54a537b8fe6015aa645bb2f5dab57ae67861763b5a2923720e09f7e8eca"
RES = 1271280
REF_RES = 1257942
CERT_NAME = "obedklass-ru-le"

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


def put_res(res, cert_id, options=None):
    payload = {
        "cname": res["cname"],
        "originGroup": res["originGroup"],
        "originProtocol": res["originProtocol"],
        "sslEnabled": True,
        "sslData": cert_id,
        "primaryResource": res.get("primaryResource", True),
    }
    if options is not None:
        payload["options"] = options
    return call("PUT", f"/cdn/resources/{RES}", payload)


# 0. Если сертификат с таким именем уже есть — берём его
cert_id = None
code, certs = call("GET", "/cdn/sslData")
for c in certs if isinstance(certs, list) else []:
    if c.get("name") == CERT_NAME and not c.get("deleted"):
        cert_id = c.get("id")
        print("найден существующий сертификат:", cert_id, c.get("name"))

# 1. Создаём LE-сертификат (automated=true — выпуск при привязке к ресурсу)
if cert_id is None:
    code, resp = call("POST", "/cdn/sslData", {"automated": True, "name": CERT_NAME})
    print("POST /cdn/sslData:", code, json.dumps(resp, ensure_ascii=False)[:200])
    if code not in (200, 201):
        raise SystemExit(1)
    time.sleep(3)
    code, certs = call("GET", "/cdn/sslData")
    for c in certs if isinstance(certs, list) else []:
        if c.get("name") == CERT_NAME and not c.get("deleted"):
            cert_id = c.get("id")
    print("cert_id:", cert_id)
if not cert_id:
    raise SystemExit("не удалось определить cert_id")

# 2. Привязываем к ресурсу (это запускает выпуск LE)
code, res = call("GET", f"/cdn/resources/{RES}")
assert code == 200
code, resp = put_res(res, cert_id)
print("PUT resource (ssl attach):", code, "sslData:", resp.get("sslData") if code in (200, 201) else json.dumps(resp)[:300])
if code not in (200, 201):
    raise SystemExit(1)

# 3. Копируем опции с ресурса .online
time.sleep(10)
code, ref = call("GET", f"/cdn/resources/{REF_RES}")
if code == 200:
    code, res2 = call("GET", f"/cdn/resources/{RES}")
    code2, resp2 = put_res(res2, cert_id, options=ref.get("options") or {})
    print("PUT options from .online:", code2)

# 4. Ждём выпуск LE (до 30 мин) и 200 от сайта
print("\nЖду выпуск LE-сертификата и доступность сайта...")
for i in range(30):
    issuer = status = None
    code, cert = call("GET", f"/cdn/sslData/{cert_id}")
    if isinstance(cert, dict):
        issuer = cert.get("cert_issuer")
    code, st = call("GET", f"/cdn/sslData/{cert_id}/status")
    if isinstance(st, dict):
        status = st.get("status") or st.get("state")
    try:
        req = urllib.request.Request("https://obedklass.ru/")
        with urllib.request.urlopen(req, timeout=20, context=ctx) as r:
            site = r.status
    except urllib.error.HTTPError as e:
        site = e.code
    except Exception as e:
        site = "ERR:" + type(e).__name__
    print(f"  [{i+1}/30] cert_issuer={issuer} status={status} site={site}")
    if site == 200:
        print("SUCCESS: https://obedklass.ru доступен!")
        break
    time.sleep(60)
