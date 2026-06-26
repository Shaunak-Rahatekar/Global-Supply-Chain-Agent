import requests

payload = {
    "input": '{"id": "SHIP-001", "priority": "High", "delay_hours": 48, "total_value": 5000000, "corporate_buyer": "Stark Industries", "lat": 34.05, "lon": -118.24}',
    "userId": "test-user",
    "sessionId": "test-session",
    "appName": "supply-chain-agent"
}
url = "https://supply-chain-agent-947815477487.us-central1.run.app/supply-chain-agent/run_sse"
response = requests.post(url, json=payload, stream=True)
print(response.status_code)
for line in response.iter_lines():
    if line:
        print(line.decode('utf-8'))
