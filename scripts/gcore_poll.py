import json
import ssl
import time
import urllib.error
import urllib.request

TOKEN = "41550_b902a8dd3ed3d18c0e9e5d21d526e2379b97bd5e796be0e8e432086ab0e8648c3323c54a537b8fe6015aa645bb2f5dab57ae67861763b5a2923720e09f7e8eca"
CERT_ID = 318182
RES_ID = 1257942
SITE = "https://obedklass.online/"

ctx = ssl.create_default_context()


def api(path):
    req = urllib.request.Request("https://api.gcore.com" + path)
    req.add_header("Authorization", "APIKey " + TOKEN)
    try:
        with urllib.request.urlopen(req, timeout=30, context=ctx) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return {"_http_error": e.code}


def site_status():
    req = urllib.request.Request(SITE, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=20, context=ctx) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception as e:
        return "ERR:" + type(e).__name__


deadline = time.time() + 480
round_no = 0
while time.time() < deadline:
    round_no += 1
    cert = api(f"/cdn/sslData/{CERT_ID}")
    task = api(f"/cdn/sslData/{CERT_ID}/status")
    code = site_status()
    task_info = task.get("latest_status") or task.get("statuses") or []
    print(
        f"[{round_no}] site={code} | cert_issuer={cert.get('cert_issuer')} "
        f"| valid_until={cert.get('validity_not_after')} | task={task_info} "
        f"| attempts={task.get('attempts_count')}",
        flush=True,
    )
    if code == 200 and cert.get("cert_issuer"):
        print("SUCCESS: сайт доступен по HTTPS, сертификат выпущен")
        break
    if code == 200:
        print("сайт отвечает по HTTPS (сертификат в деталях ещё не обновился)")
        break
    time.sleep(45)
else:
    print("TIMEOUT: за 8 минут сайт не ответил 200 — нужен force-retry или ждать дольше")
