# Добавляем www.obedklass.ru в домены CDN-ресурса 1271280.
# Если существующий сертификат (318362, только apex) не покроет www —
# выпускаем новый automated-сертификат и перепривязываем. При неудаче — откат.
import json
import ssl
import time
import urllib.request
import urllib.error

BASE = "https://api.gcore.com"
TOKEN = "41550_b902a8dd3ed3d18c0e9e5d21d526e2379b97bd5e796be0e8e432086ab0e8648c3323c54a537b8fe6015aa645bb2f5dab57ae67861763b5a2923720e09f7e8eca"
RES = 1271280
WWW = "www.obedklass.ru"
NEW_CERT_NAME = "obedklass-ru-le2"

ctx = ssl.create_default_context()
ctx_noverify = ssl.create_default_context()
ctx_noverify.check_hostname = False
ctx_noverify.verify_mode = ssl.CERT_NONE


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
                                    context=ctx if verify else ctx_noverify) as r:
            return r.status, "ok"
    except urllib.error.HTTPError as e:
        return e.code, "http-error"
    except Exception as e:
        return None, type(e).__name__


def put_resource(res, cert_id, domains):
    payload = {
        "cname": res["cname"],
        "originGroup": res["originGroup"],
        "originProtocol": res["originProtocol"],
        "sslEnabled": True,
        "sslData": cert_id,
        "primaryResource": res.get("primaryResource", True),
        "domains": domains,
        "options": res.get("options") or {},
    }
    return call("PUT", f"/cdn/resources/{RES}", payload)


# 0. Текущее состояние ресурса
code, res = call("GET", f"/cdn/resources/{RES}")
if code != 200:
    raise SystemExit(f"GET resource: HTTP {code}")
old_domains = list(res.get("domains") or [])
old_cert = res.get("sslData")
print("domains:", old_domains, "| sslData:", old_cert,
      "| sslEnabled:", res.get("sslEnabled"))

if WWW in old_domains:
    print("www уже в доменах — PUT не нужен")
    new_domains = old_domains
    cert_id = old_cert
else:
    new_domains = old_domains + [WWW]
    cert_id = old_cert

    # 1. Попытка 1: существующий сертификат
    code, resp = put_resource(res, old_cert, new_domains)
    print("PUT (сущ. сертификат + www):", code,
          json.dumps(resp, ensure_ascii=False)[:200] if code not in (200, 201) else "ok")

    # 2. Попытка 2: новый automated-сертификат
    if code not in (200, 201):
        print("Сущ. сертификат не покрывает www — выпускаю новый")
        code2, resp2 = call("POST", "/cdn/sslData",
                            {"automated": True, "name": NEW_CERT_NAME})
        print("POST /cdn/sslData:", code2, json.dumps(resp2, ensure_ascii=False)[:200])
        if code2 not in (200, 201):
            raise SystemExit("не удалось создать sslData")
        time.sleep(5)
        new_cert = None
        code3, certs = call("GET", "/cdn/sslData")
        for c in certs if isinstance(certs, list) else []:
            if c.get("name") == NEW_CERT_NAME and not c.get("deleted"):
                new_cert = c.get("id")
        print("new cert_id:", new_cert)
        if not new_cert:
            raise SystemExit("новый сертификат не найден")

        code4, res2 = call("GET", f"/cdn/resources/{RES}")
        code5, resp5 = put_resource(res2, new_cert, new_domains)
        print("PUT (новый сертификат + www):", code5,
              json.dumps(resp5, ensure_ascii=False)[:300] if code5 not in (200, 201) else "ok")
        if code5 not in (200, 201):
            print("ОТКАТ: возвращаю исходные домены и сертификат")
            code6, res3 = call("GET", f"/cdn/resources/{RES}")
            code7, resp7 = put_resource(res3, old_cert, old_domains)
            print("ROLLBACK:", code7)
            raise SystemExit("не удалось привязать новый сертификат")
        cert_id = new_cert

# 3. Ждём выпуск/действие сертификата и проверяем сайт
print("\nПроверяю сертификат и доступность (до ~4 мин)...")
for i in range(8):
    code, cert = call("GET", f"/cdn/sslData/{cert_id}")
    issuer = cert.get("cert_issuer") if isinstance(cert, dict) else None
    code2, st = call("GET", f"/cdn/sslData/{cert_id}/status")
    status = (st.get("status") or st.get("state")) if isinstance(st, dict) else None
    apex_v, apex_m = fetch("https://obedklass.ru/", verify=True)
    www_nov, www_nm = fetch(f"https://{WWW}/", verify=False)
    www_v, www_m = fetch(f"https://{WWW}/", verify=True)
    print(f"  [{i+1}] cert={cert_id} issuer={issuer} status={status} | "
          f"apex={apex_v}({apex_m}) www_noverify={www_nov} www_verify={www_v}({www_m})")
    if www_v == 200 and apex_v == 200:
        print("SUCCESS: и apex, и www отвечают с валидным сертификатом")
        break
    time.sleep(30)

# 4. HTTP-проверки edge
for u in (f"http://{WWW}/", "http://obedklass.ru/"):
    c, m = fetch(u, verify=False, timeout=25)
    print("HTTP", u, "->", c, m)
