import requests
import json
from datetime import datetime
import platform
import time

# URL of the server
#url = "http://192.168.20.45:3000/ping"
# url = "http://180.150.100.57:3000/ping"  # Uncomment this if you want to use this URL
url = "https://vtc-ping-testing.onrender.com/ping"

# Retrieve the computer name
computer_name = platform.node()

# Function to send a ping request
def send_ping(url, computer_name):
    body = {
        "MSG type": "Ping",
        "timestamp": datetime.utcnow().isoformat(),
        "systemName": computer_name,
        "message": f"Ping from {computer_name}"
    }

    headers = {"Content-Type": "application/json"}

    try:
        # Send the HTTP POST request
        response = requests.post(url, data=json.dumps(body), headers=headers)
        # Suppress output to prevent pop-ups
        response.raise_for_status()
    except requests.RequestException as e:
        # Handle errors silently
        pass

# Run the function every 20 seconds
while True:
    send_ping(url, computer_name)
    time.sleep(5)