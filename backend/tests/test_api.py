import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url_login = "http://127.0.0.1:5000/api/auth/login"
data = json.dumps({"email": "admin@imw.com", "password": "password"}).encode('utf-8')
req = urllib.request.Request(url_login, data=data, headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req, context=ctx) as response:
        res = json.loads(response.read().decode())
        token = res.get("access_token")
except Exception as e:
    print("Login Error:", e)
    token = None

if token:
    endpoints = [
        "/api/vehicles/active",
        "/api/stats/today",
        "/api/reclamations/",
        "/api/subscriptions/",
        "/api/users/"
    ]
    for ep in endpoints:
        req = urllib.request.Request("http://127.0.0.1:5000" + ep, headers={'Authorization': f'Bearer {token}'})
        try:
            with urllib.request.urlopen(req, context=ctx) as response:
                content = json.loads(response.read().decode())
                print(f"--- {ep} ---")
                print(str(content)[:200] + "...")
        except Exception as e:
            print(f"[ERROR] {ep} -> {e}")
