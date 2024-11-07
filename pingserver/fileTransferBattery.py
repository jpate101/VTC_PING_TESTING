import os
import shutil
import time

# Get the system username
username = os.getlogin()

# Define source and destination folders using the system username
SOURCE_FOLDER = rf"C:\Users\{username}\Documents\Dashboard\Recordings"
DESTINATION_FOLDER = rf"C:\Users\{username}\Phibion Pty Ltd\MoTec Log file - {username} Logged Data\Disk Space Health Check Output"
LATEST_BATTERY_DATA_FILE = os.path.join(DESTINATION_FOLDER, 'latestBatteryData.txt')
YESTERDAY_BATTERY_DATA_FILE = os.path.join(DESTINATION_FOLDER, 'yesterdayBatteryData.txt')
TWO_DAYS_AGO_BATTERY_DATA_FILE = os.path.join(DESTINATION_FOLDER, '2DaysAgoBatteryData.txt')

# Function to copy and delete .txt files
def manage_battery_data():
    now = time.time()
    txt_files = []

    # Check and delete old .txt files in the source folder
    for filename in os.listdir(SOURCE_FOLDER):
        if filename.endswith('.txt'):
            file_path = os.path.join(SOURCE_FOLDER, filename)
            txt_files.append(file_path)

            # Check if the file is older than 5 days
            if os.path.getmtime(file_path) < now - (5 * 86400):  # 5 days in seconds
                os.remove(file_path)
                print(f"Deleted old file from source: {filename}")

    # Check and delete only files that were created by this script in the destination folder
    destination_files = [
        LATEST_BATTERY_DATA_FILE,
        YESTERDAY_BATTERY_DATA_FILE,
        TWO_DAYS_AGO_BATTERY_DATA_FILE
    ]

    for file_path in destination_files:
        # Check if the file exists and if it is older than 1 hour
        if os.path.exists(file_path) and os.path.getmtime(file_path) < now - 3600:  # 1 hour in seconds
            os.remove(file_path)
            print(f"Deleted old file from destination: {os.path.basename(file_path)}")

    # Sort files by modification time (latest first)
    txt_files.sort(key=os.path.getmtime, reverse=True)

    # Copy latest, yesterday, and two days ago files if they exist
    if len(txt_files) > 0:
        latest_file = txt_files[0]
        shutil.copy2(latest_file, LATEST_BATTERY_DATA_FILE)
        print(f"Copied latest file to: {LATEST_BATTERY_DATA_FILE}")

    if len(txt_files) > 1:
        yesterday_file = txt_files[1]
        shutil.copy2(yesterday_file, YESTERDAY_BATTERY_DATA_FILE)
        print(f"Copied second latest file to: {YESTERDAY_BATTERY_DATA_FILE}")

    if len(txt_files) > 2:
        two_days_ago_file = txt_files[2]
        shutil.copy2(two_days_ago_file, TWO_DAYS_AGO_BATTERY_DATA_FILE)
        print(f"Copied third latest file to: {TWO_DAYS_AGO_BATTERY_DATA_FILE}")

    if not txt_files:
        print("No .txt files found to manage.")

if __name__ == "__main__":
    while True:
        manage_battery_data()
        print("Waiting for 1 hour...")
        time.sleep(3600)  # Sleep for 1 hour (3600 seconds)