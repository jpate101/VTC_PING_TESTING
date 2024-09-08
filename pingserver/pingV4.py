import requests
import json
from datetime import datetime
import platform
import time

# Configuration
DEVICE_IP = '192.168.1.1'
USERNAME = 'admin'
PASSWORD = 'MudM45t3r'
SERVER_URL_PING = 'https://vtc-ping-testing.onrender.com/ping'  # URL for ping
SERVER_URL_GPS = 'https://vtc-ping-testing.onrender.com/gps'   # URL for GPS

# Retrieve the computer name
computer_name = platform.node()

# Global variable to store the token
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

def send_ping(url, system_name):
    body = {
        "timestamp": datetime.utcnow().isoformat(),
        "systemName": system_name,
        "message": f"Ping from {system_name}"
    }
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(url, data=json.dumps(body), headers=headers)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f'Error sending ping: {e}')

def send_gps_data(url, system_name):
    gps_data = get_gps_data()
    if gps_data is not None:
        body = {
            "timestamp": datetime.utcnow().isoformat(),
            "systemName": system_name,
            **gps_data
        }
        headers = {"Content-Type": "application/json"}
        try:
            response = requests.post(url, data=json.dumps(body), headers=headers)
            response.raise_for_status()
        except requests.RequestException as e:
            print(f'Error sending GPS data: {e}')

# Run the functions periodically
while True:
    send_ping(SERVER_URL_PING, computer_name)
    send_gps_data(SERVER_URL_GPS, computer_name)
    time.sleep(60)  # Adjust the interval as needed