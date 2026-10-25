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
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except Exception:
            return e.code, {}
    except Exception as e:
        return -1, {"_err": str(e)}


# 1. Забираем проверенную конфигурацию существующего ресурса
code, old = call("GET", "/cdn/resources/1257942")
if code != 200:
    print("GET old failed:", code, old)
    raise SystemExit(1)

payload = {
    "cname": "obedklass.ru",
    "originGroup": old["originGroup"],
    "originProtocol": old["originProtocol"],
    "sslEnabled": False,
    "primaryResource": True,
    "options": old.get("options") or {},
}

# 2. Создаём ресурс для obedklass.ru
code, res = call("POST", "/cdn/resources", payload)
print("POST:", code)
if code not in (200, 201):
    print(json.dumps(res, ensure_ascii=False)[:800])
    # повтор без options, если проблема в них
    payload.pop("options")
    code, res = call("POST", "/cdn/resources", payload)
    print("POST retry (no options):", code)
    if code not in (200, 201):
        print(json.dumps(res, ensure_ascii=False)[:800])
        raise SystemExit(1)

print("NEW RESOURCE ID:", res.get("id"))
print("cname:", res.get("cname"))
print("status:", res.get("status"))
print("sslEnabled:", res.get("sslEnabled"))
