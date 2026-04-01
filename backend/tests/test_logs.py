import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url_login = "http://127.0.0.1:5000/api/auth/login"
data = json.dumps({"email": "admin@imw.com", "password": "password"}).encode('utf-8')
req = urllib.request.Request(url_login, data=data, headers={'Content-Type': 'application/json'})

with urllib.request.urlopen(req, context=ctx) as response:
    token = json.loads(response.read().decode())["access_token"]

req = urllib.request.Request("http://127.0.0.1:5000/api/logs/", headers={'Authorization': f'Bearer {token}'})
with urllib.request.urlopen(req, context=ctx) as response:
    logs = json.loads(response.read().decode())
    print("Logs count:", len(logs.get("data", [])))
    if logs.get("data"):
        print("First log:", logs["data"][0])
        print("Last log:", logs["data"][-1])
