import requests
import json
import platform
import time
from datetime import datetime, timezone
import psutil 

# Configuration
DEVICE_IP = '192.168.1.1'
USERNAME = 'admin'
PASSWORD = 'MudM45t3r'
PING_URL = "https://vtc-ping-testing.onrender.com/ping"

IP_ADDRESSES = [
    "http://192.168.1.101/",
    "http://192.168.1.103/",
    "http://192.168.1.105/",
    "http://192.168.1.107/"
]

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
            return token
        else:
            print('Failed to authenticate with Teltonika device')
            return None
    except requests.RequestException as e:
        print(f'Error during login: {e}')
        return None

def get_gps_data():
    global token
    token = login_to_teltonika()
    if token is None:
        print("Error: could not get token")
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
            try:
                latitude, longitude = map(float, stdout.strip().split())
                if latitude == 0 and longitude == 0:
                    print("GPS values are 0 and 0, likely no GPS")
                    return {"latitude": None, "longitude": None}
                return {"latitude": latitude, "longitude": longitude}
            except ValueError:
                print("Error: Could not parse latitude and longitude from stdout")
                return {"latitude": None, "longitude": None}
        else:
            print('Unexpected response structure from Teltonika device')
            return None
    except requests.RequestException as e:
        print(f'Error fetching GPS data: {e}')
        return None

def get_signal_levels():
    global token
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
            {"command": "gsmctl", "params": ["-q"]}
        ]
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json().get('result', [])
        if len(result) > 1:
            stdout = result[1].get('stdout', '')
            print(stdout)
            return parse_signal_levels(stdout)
        else:
            print('Unexpected response structure for signal levels')
            return None
    except requests.RequestException as e:
        print(f'Error fetching signal levels: {e}')
        return None

def parse_signal_levels(stdout):
    signal_levels = {}
    for line in stdout.splitlines():
        if 'RSSI' in line:
            signal_levels['RSSI'] = int(line.split(': ')[1])
        elif 'RSRP' in line:
            signal_levels['RSRP'] = int(line.split(': ')[1])
        elif 'SINR' in line:
            signal_levels['SINR'] = int(line.split(': ')[1])
        elif 'RSRQ' in line:
            signal_levels['RSRQ'] = int(line.split(': ')[1])
    return signal_levels

def get_disk_usage():
    disk_usage = {}
    partitions = psutil.disk_partitions(all=False)
    for partition in partitions:
        usage = psutil.disk_usage(partition.mountpoint)
        disk_usage[partition.device] = {
            "total": usage.total,
            "free": usage.free
        }
    return disk_usage

def check_webpage_availability(urls):
    results = {}
    for url in urls:
        try:
            response = requests.get(url, timeout=5)  # 5 seconds timeout
            if response.status_code == 200:
                results[url] = 'Online'
            else:
                results[url] = 'Offline'
        except requests.RequestException:
            results[url] = 'Offline'
    return results

def send_ping(url, computer_name, gps_data, disk_usage, webpage_status, signal_levels):
    body = {
        "MSG type": "Ping",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "systemName": computer_name,
        "message": f"Ping from {computer_name}",
        "latitude": gps_data.get('latitude'),
        "longitude": gps_data.get('longitude'),
        "diskUsage": disk_usage,
        "webpageStatus": webpage_status,
        "signalLevels": signal_levels  
    }

    headers = {"Content-Type": "application/json"}

    try:
        # Send the HTTP POST request
        response = requests.post(url, data=json.dumps(body), headers=headers)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f'Error sending ping: {e}')

# Run the function every 60 seconds
while True:
    gps_data = get_gps_data()
    signal_levels = get_signal_levels()  # Fetch the signal levels
    disk_usage = get_disk_usage()
    webpage_status = check_webpage_availability(IP_ADDRESSES)
    send_ping(PING_URL, computer_name, gps_data or {}, disk_usage, webpage_status, signal_levels or {})
    time.sleep(60)