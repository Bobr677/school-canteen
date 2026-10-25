import json
import ssl
import time
import urllib.request
import urllib.error

BASE = "https://api.gcore.com"
TOKEN = "41550_b902a8dd3ed3d18c0e9e5d21d526e2379b97bd5e796be0e8e432086ab0e8648c3323c54a537b8fe6015aa645bb2f5dab57ae67861763b5a2923720e09f7e8eca"
RES = 1271280          # CDN-ресурс obedklass.ru
REF_RES = 1257942      # ресурс obedklass.online — источник проверенных опций
SITE = "https://obedklass.ru/"
ZONE = "obedklass.ru"

ctx = ssl.create_default_context()
LOG = open("/home/z/my-project/scripts/auto_finalize2.log", "a", buffering=1)


def log(msg):
    stamp = time.strftime("%H:%M:%S")
    line = f"[{stamp}] {msg}"
    print(line)
    LOG.write(line + "\n")


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


def zone_state():
    code, info = call("GET", f"/dns/v2/zones/{ZONE}")
    if code == 200:
        return info.get("status"), bool(info.get("enabled"))
    return f"HTTP{code}", False


def site_status():
    try:
        req = urllib.request.Request(SITE)
        with urllib.request.urlopen(req, timeout=20, context=ctx) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception as e:
        return "ERR:" + type(e).__name__


# ---- ЭТАП 1: ждать активации зоны Gcore (до 3 часов, проверка раз в 60с) ----
log("AUTOPILOT-2 START: жду активации DNS-зоны (status=active, enabled=true)")
activated = False
for attempt in range(180):
    status, enabled = zone_state()
    if attempt == 0 or attempt % 10 == 9:
        log(f"zone check #{attempt+1}: status={status} enabled={enabled}")
    if enabled and status in ("active", "delegated"):
        activated = True
        log(f"ЗОНА АКТИВИРОВАНА: status={status} enabled={enabled}")
        break
    if not enabled:
        # каждые 10 попыток пробуем enable — вдруг статус уже поменялся у Gcore
        if attempt % 10 == 9:
            code, resp = call("PATCH", f"/dns/v2/zones/{ZONE}/enable")
            if code in (200, 204):
                log(f"PATCH enable succeeded: {code}")
                continue
        time.sleep(60)
    else:
        time.sleep(60)

if not activated:
    log("TIMEOUT: зона не активирована за 3 часа. Выход.")
    raise SystemExit(1)

# ---- ЭТАП 2: включить SSL на CDN-ресурсе .ru ----
time.sleep(60)  # минута на расхождение состояния
code, res = call("GET", f"/cdn/resources/{RES}")
if code != 200:
    log(f"GET resource failed: {code}")
    raise SystemExit(1)
log(f"resource status={res.get('status')} sslEnabled={res.get('sslEnabled')}")

payload = {
    "cname": res["cname"],
    "originGroup": res["originGroup"],
    "originProtocol": res["originProtocol"],
    "sslEnabled": True,
    "sslData": res.get("sslData"),
    "primaryResource": res.get("primaryResource", True),
}
code, resp = call("PUT", f"/cdn/resources/{RES}", payload)
log(f"PUT sslEnabled=true: {code} sslData={resp.get('sslData') if code in (200, 201) else resp}")
if code not in (200, 201):
    raise SystemExit(1)
cert_id = resp.get("sslData")

# ---- ЭТАП 3: скопировать опции с ресурса .online ----
time.sleep(10)
code, ref = call("GET", f"/cdn/resources/{REF_RES}")
if code == 200:
    code, res2 = call("GET", f"/cdn/resources/{RES}")
    payload2 = {
        "cname": res2["cname"],
        "originGroup": res2["originGroup"],
        "originProtocol": res2["originProtocol"],
        "sslEnabled": True,
        "sslData": cert_id,
        "primaryResource": res2.get("primaryResource", True),
        "options": ref.get("options") or {},
    }
    code2, resp2 = call("PUT", f"/cdn/resources/{RES}", payload2)
    log(f"PUT options from .online: {code2}")
else:
    log(f"GET ref resource failed: {code} — опции не скопированы (не критично)")

# ---- ЭТАП 4: ждать 200 от сайта (до 40 минут) ----
log("Жду выпуск LE-сертификата и доступность сайта...")
for attempt in range(40):
    issuer = None
    if cert_id:
        code, cert = call("GET", f"/cdn/sslData/{cert_id}")
        issuer = cert.get("cert_issuer")
    site = site_status()
    log(f"attempt {attempt+1}: site={site} cert_issuer={issuer}")
    if site == 200:
        log("SUCCESS: https://obedklass.ru доступен!")
        raise SystemExit(0)
    time.sleep(60)

log("TIMEOUT: за 40 минут сайт не ответил 200. Требуется ручная проверка.")
