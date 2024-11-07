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

# Function to copy and manage .txt files
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

    # Sort files by modification time (latest first)
    txt_files.sort(key=os.path.getmtime, reverse=True)

    # Keep only the last 3 files
    txt_files = txt_files[:3]

    # Copy files to the destination, overwriting existing ones
    try:
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

    except Exception as e:
        print(f"An error occurred while copying files: {e}")
        print("Restarting the loop...")

if __name__ == "__main__":
    while True:
        manage_battery_data()
        print("Waiting for 1 hour...")
        time.sleep(3600)  # Sleep for 1 hour (3600 seconds)