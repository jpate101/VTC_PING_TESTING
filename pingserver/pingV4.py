import requests
import json
from datetime import datetime
import platform
import time

# Configuration
DEVICE_IP = '192.168.1.1'
USERNAME = 'admin'
PASSWORD = 'MudM45t3r'
PING_URL = "https://vtc-ping-testing.onrender.com/ping"

# Retrieve the computer name
computer_name = platform.node()

# Global variable for the authentication token
token = None

def login_to_teltonika():
    global token
    url = f'http://{DEVICE_IP}/api/login'
    headers = {
        'Content-Type': 'application/json'
    }
    data = {
        'username': USERNAME,
        'password': PASSWORD
    }

    try:
        response = requests.post(url, headers=headers, data=json.dumps(data))
        response.raise_for_status()
        if response.status_code == 200:
            token = response.json().get('data', {}).get('token')
        else:
            print('Failed to authenticate with Teltonika device')
            return None
    except requests.RequestException as e:
        print(f'Error during login: {e}')
        return None

def get_gps_data():
    global token
    if token is None:
        token = login_to_teltonika()
        if token is None:
            return None
    
    url = f'http://{DEVICE_IP}/ubus'
    headers = {}
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "call",
        "params": [
            token,
            "file",
            "exec",
            {"command": "gpsctl", "params": ["-ix"]}
        ]
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json().get('result', [])
        if len(result) > 1:
            stdout = result[1].get('stdout', '')
            latitude, longitude = map(float, stdout.strip().split())
            if latitude == 0 and longitude == 0:
                print("GPS values are 0 and 0, likely no GPS")
                return None
            return {"latitude": latitude, "longitude": longitude}
        else:
            print('Unexpected response structure from Teltonika device')
            return None
    except requests.RequestException as e:
        print(f'Error fetching GPS data: {e}')
        return None

def send_ping(url, computer_name, gps_data):
    body = {
        "MSG type": "Ping",
        "timestamp": datetime.utcnow().isoformat(),
        "systemName": computer_name,
        "message": f"Ping from {computer_name}",
        "latitude": gps_data.get('latitude'),
        "longitude": gps_data.get('longitude')
    }

    headers = {"Content-Type": "application/json"}

    try:
        # Send the HTTP POST request
        response = requests.post(url, data=json.dumps(body), headers=headers)
        response.raise_for_status()
    except requests.RequestException as e:
        # Handle errors silently
        print(f'Error sending ping: {e}')

# Run the function every 20 seconds
while True:
    gps_data = get_gps_data()
    send_ping(PING_URL, computer_name, gps_data or {})
    time.sleep(20)