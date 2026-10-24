import json
import ssl
import urllib.request
import urllib.error

BASE = "https://api.gcore.com"
TOKEN = "41550_b902a8dd3ed3d18c0e9e5d21d526e2379b97bd5e796be0e8e432086ab0e8648c3323c54a537b8fe6015aa645bb2f5dab57ae67861763b5a2923720e09f7e8eca"
OG = 1495965

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


payload = {
    "name": "obedclass-origin",
    "sources": [
        {
            "source": "school-canteen-psi.vercel.app",
            "backup": False,
            "enabled": True,
            "tag": "default",
            "host_header_override": "school-canteen-psi.vercel.app",
        }
    ],
}

code, resp = call("PATCH", f"/cdn/origin_groups/{OG}", payload)
print("PATCH:", code)
print(json.dumps(resp, indent=2, ensure_ascii=False)[:800])
