# www через Gcore: POST sslData (automated) -> PUT ресурса с новым сертификатом
# И доменами ["obedklass.ru","www.obedklass.ru"] одним вызовом.
# Автоматический сертификат получает SAN по cname+domains на момент привязки.
# Откат на 318362, если apex ломается или PUT отклонён.
import json
import ssl
import time
import urllib.request
import urllib.error

BASE = "https://api.gcore.com"
TOKEN = "41550_b902a8dd3ed3d18c0e9e5d21d526e2379b97bd5e796be0e8e432086ab0e8648c3323c54a537b8fe6015aa645bb2f5dab57ae67861763b5a2923720e09f7e8eca"
RES = 1271280
OLD_CERT = 318362
NEW_CERT_NAME = "obedklass-ru-le2"
WWW = "www.obedklass.ru"

ctx = ssl.create_default_context()
ctx_nv = ssl.create_default_context()
ctx_nv.check_hostname = False
ctx_nv.verify_mode = ssl.CERT_NONE


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
        with urllib.request.urlopen(url, timeout=timeout,
                                    context=ctx if verify else ctx_nv) as r:
            return r.status, "ok"
    except urllib.error.HTTPError as e:
        return e.code, "http-error"
    except Exception as e:
        return None, type(e).__name__


def put_res(res, cert_id, domains):
    payload = {
        "cname": res["cname"],
        "originGroup": res["originGroup"],
        "originProtocol": res["originProtocol"],
        "sslEnabled": True,
        "sslData": cert_id,
        "primaryResource": True,
        "options": res.get("options") or {},
    }
    if domains is not None:
        payload["domains"] = domains
    return call("PUT", f"/cdn/resources/{RES}", payload)


code, res = call("GET", f"/cdn/resources/{RES}")
assert code == 200, f"GET resource: {code}"

# 1. Новый автоматический сертификат
code, resp = call("POST", "/cdn/sslData", {"automated": True, "name": NEW_CERT_NAME})
print("POST sslData:", code, json.dumps(resp, ensure_ascii=False)[:200])
if code not in (200, 201):
    raise SystemExit(1)
time.sleep(5)
new_cert = None
code, certs = call("GET", "/cdn/sslData")
for c in certs if isinstance(certs, list) else []:
    if c.get("name") == NEW_CERT_NAME and not c.get("deleted"):
        new_cert = c.get("id")
print("new cert_id:", new_cert)
if not new_cert:
    raise SystemExit("сертификат не найден")

# 2. PUT: новый сертификат + оба домена одновременно
code, resp = put_res(res, new_cert, ["obedklass.ru", WWW])
print("PUT (новый серт + 2 домена):", code,
      json.dumps(resp, ensure_ascii=False)[:400] if code not in (200, 201) else "ok")
if code not in (200, 201):
    print("PUT отклонён — откат на старый сертификат")
    code2, res2 = call("GET", f"/cdn/resources/{RES}")
    print("ROLLBACK:", put_res(res2, OLD_CERT, None)[0])
    raise SystemExit(1)

# 3. Ждём выпуск: SAN должен покрыть оба имени, сайты должны отвечать
ok = False
for i in range(10):
    code, cert = call("GET", f"/cdn/sslData/{new_cert}")
    san = cert.get("cert_subject_alt", "") if isinstance(cert, dict) else ""
    issuer = cert.get("cert_issuer") if isinstance(cert, dict) else None
    apex_v, _ = fetch("https://obedklass.ru/", verify=True)
    www_v, www_m = fetch(f"https://{WWW}/", verify=True)
    www_nv, _ = fetch(f"https://{WWW}/", verify=False)
    print(f"  [{i+1}] issuer={issuer} san='{san}' apex={apex_v} "
          f"www(no-verify)={www_nv} www(verify)={www_v}({www_m})")
    if www_v == 200 and apex_v == 200 and WWW in san and "obedklass.ru" in san:
        ok = True
        print("SUCCESS: сертификат покрывает оба имени, оба сайта отвечают")
        break
    if apex_v != 200:
        print("ВНИМАНИЕ: apex сломался — откат")
        code2, res2 = call("GET", f"/cdn/resources/{RES}")
        print("ROLLBACK:", put_res(res2, OLD_CERT, None)[0])
        break
    time.sleep(30)

# 4. Итоговое состояние ресурса + HTTP-проверки
code, res3 = call("GET", f"/cdn/resources/{RES}")
print("resource now:", {k: res3.get(k) for k in ("cname", "domains", "sslData", "status")})
for u in (f"https://{WWW}/", f"http://{WWW}/", "https://obedklass.ru/"):
    c, m = fetch(u, verify=(u.startswith("https://obedklass")), timeout=25)
    print(u, "->", c, m)
if not ok:
    print("ПРИМЕЧАНИЕ: полный успех не подтверждён — см. лог выше")
