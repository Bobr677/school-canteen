# Поллинг активации www-ресурса 1277798 и выпуска сертификата 318425
import json
import ssl
import time
import urllib.request
import urllib.error

BASE = "https://api.gcore.com"
TOKEN = "41550_b902a8dd3ed3d18c0e9e5d21d526e2379b97bd5e796be0e8e432086ab0e8648c3323c54a537b8fe6015aa645bb2f5dab57ae67861763b5a2923720e09f7e8eca"
WID = 1277798
CERT = 318425
WWW = "www.obedklass.ru"

ctx = ssl.create_default_context()


def call(method, path):
    req = urllib.request.Request(BASE + path, method=method)
    req.add_header("Authorization", "APIKey " + TOKEN)
    try:
        with urllib.request.urlopen(req, timeout=30, context=ctx) as r:
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


for i in range(20):
    code, res = call("GET", f"/cdn/resources/{WID}")
    rstatus = res.get("status") if code == 200 else f"HTTP{code}"
    code, cert = call("GET", f"/cdn/sslData/{CERT}")
    san = cert.get("cert_subject_alt") if isinstance(cert, dict) else None
    issuer = cert.get("cert_issuer") if isinstance(cert, dict) else None
    www_v, www_m = fetch(f"https://{WWW}/", verify=True)
    http_v, _ = fetch(f"http://{WWW}/", verify=False)
    apx_v, _ = fetch("https://obedklass.ru/", verify=True)
    print(f"[{i+1}] res={rstatus} issuer={issuer} san={san} "
          f"https_www={www_v}({www_m}) http_www={http_v} apex={apx_v}")
    if www_v == 200 and san and WWW in str(san):
        print("SUCCESS: www работает с валидным сертификатом")
        break
    if rstatus == "active" and san and WWW in str(san) and www_v in (200, 301):
        print("SUCCESS (с редиректом/кэшем): www активен, серт выпущен")
        break
    time.sleep(45)
