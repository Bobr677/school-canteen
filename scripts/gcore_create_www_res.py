# Отдельный CDN-ресурс для www.obedklass.ru (Gcore: 1 cname = 1 домен на ресурс).
# Тот же originGroup/originProtocol/options, что у 1271280. Свой automated-серт.
# Апекс (1271280) не затрагивается.
import json
import ssl
import time
import urllib.request
import urllib.error

BASE = "https://api.gcore.com"
TOKEN = "41550_b902a8dd3ed3d18c0e9e5d21d526e2379b97bd5e796be0e8e432086ab0e8648c3323c54a537b8fe6015aa645bb2f5dab57ae67861763b5a2923720e09f7e8eca"
APX = 1271280
WWW = "www.obedklass.ru"
CERT_NAME = "obedklass-www-le"

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


def fetch(url, verify=True, timeout=20):
    try:
        with urllib.request.urlopen(url, timeout=timeout, context=ctx) as r:
            return r.status, "ok"
    except urllib.error.HTTPError as e:
        return e.code, "http-error"
    except Exception as e:
        return None, type(e).__name__


# 0. Если ресурс www уже создан — используем его
www_res = None
code, allres = call("GET", "/cdn/resources?page=1&per_page=50")
if code == 200 and isinstance(allres, dict):
    for r in allres.get("results", []):
        if r.get("cname") == WWW:
            www_res = r
            print("найден существующий www-ресурс:", r.get("id"))

# 1. Конфиг апекса как шаблон
code, apx = call("GET", f"/cdn/resources/{APX}")
assert code == 200
if www_res is None:
    payload = {
        "cname": WWW,
        "originGroup": apx["originGroup"],
        "originProtocol": apx["originProtocol"],
        "sslEnabled": False,
        "primaryResource": True,
        "options": apx.get("options") or {},
    }
    code, www_res = call("POST", "/cdn/resources", payload)
    print("POST resource (www):", code)
    if code not in (200, 201):
        print(json.dumps(www_res, ensure_ascii=False)[:500])
        payload.pop("options", None)
        code, www_res = call("POST", "/cdn/resources", payload)
        print("POST retry (без options):", code)
        if code not in (200, 201):
            print(json.dumps(www_res, ensure_ascii=False)[:500])
            raise SystemExit("не удалось создать www-ресурс")

WID = www_res["id"]
print("www resource id:", WID, "| status:", www_res.get("status"))

# 2. Сертификат для www (idempotent по имени)
cert_id = None
code, certs = call("GET", "/cdn/sslData")
for c in certs if isinstance(certs, list) else []:
    if c.get("name") == CERT_NAME and not c.get("deleted"):
        cert_id = c.get("id")
if cert_id is None:
    code, resp = call("POST", "/cdn/sslData", {"automated": True, "name": CERT_NAME})
    print("POST sslData:", code, json.dumps(resp, ensure_ascii=False)[:200])
    if code not in (200, 201):
        raise SystemExit(1)
    time.sleep(5)
    code, certs = call("GET", "/cdn/sslData")
    for c in certs if isinstance(certs, list) else []:
        if c.get("name") == CERT_NAME and not c.get("deleted"):
            cert_id = c.get("id")
print("cert_id:", cert_id)
if not cert_id:
    raise SystemExit("не удалось определить cert_id")

# 3. Привязка сертификата к www-ресурсу
code, www_res2 = call("GET", f"/cdn/resources/{WID}")
put = {
    "cname": WWW,
    "originGroup": www_res2["originGroup"],
    "originProtocol": www_res2["originProtocol"],
    "sslEnabled": True,
    "sslData": cert_id,
    "primaryResource": True,
    "options": www_res2.get("options") or apx.get("options") or {},
}
code, resp = call("PUT", f"/cdn/resources/{WID}", put)
print("PUT www (ssl attach):", code,
      json.dumps(resp, ensure_ascii=False)[:300] if code not in (200, 201) else "ok")

# 4. Ждём выпуск LE на www и проверяем
ok = False
for i in range(10):
    code, cert = call("GET", f"/cdn/sslData/{cert_id}")
    san = cert.get("cert_subject_alt", "") if isinstance(cert, dict) else ""
    issuer = cert.get("cert_issuer") if isinstance(cert, dict) else None
    www_v, www_m = fetch(f"https://{WWW}/", verify=True)
    apx_v, _ = fetch("https://obedklass.ru/", verify=True)
    print(f"  [{i+1}] issuer={issuer} san='{san}' www={www_v}({www_m}) apex={apx_v}")
    if www_v == 200 and WWW in san:
        ok = True
        print("SUCCESS: https://www.obedklass.ru отвечает с валидным сертификатом")
        break
    time.sleep(30)

# 5. Итог
code, st = call("GET", f"/cdn/resources/{WID}")
print("www resource:", {k: st.get(k) for k in ("id", "cname", "status", "sslEnabled", "sslData")})
for u in (f"https://{WWW}/", f"http://{WWW}/", "https://obedklass.ru/"):
    c, m = fetch(u, verify=True, timeout=25)
    print(u, "->", c, m)
if not ok:
    print("ПРИМЕЧАНИЕ: успех не подтверждён — см. лог")
