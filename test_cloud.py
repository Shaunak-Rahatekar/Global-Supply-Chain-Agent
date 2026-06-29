import requests
import json

session_url = "https://supply-chain-agent-947815477487.us-central1.run.app/apps/app/users/default_user/sessions"
resp = requests.post(session_url, json={"state": {}})
session_id = resp.json().get("id")

print(f"Session ID: {session_id}")

payload = {
    "app_name": "app",
    "user_id": "default_user",
    "session_id": session_id,
    "new_message": {
        "role": "user",
        "parts": [{"text": '{"id": "SHIP-001", "priority": "High", "delay_hours": 48, "total_value": 5000000, "corporate_buyer": "Stark Industries", "lat": 34.05, "lon": -118.24}'}]
    },
    "streaming": True
}
url = "https://supply-chain-agent-947815477487.us-central1.run.app/run_sse"
response = requests.post(url, json=payload, stream=True)
print("Status Code:", response.status_code)
for line in response.iter_lines():
    if line:
        print(line.decode('utf-8'))
