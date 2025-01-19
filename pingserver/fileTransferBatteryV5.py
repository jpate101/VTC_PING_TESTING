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

#  -----------

THREE_DAYS_AGO_BATTERY_DATA_FILE = os.path.join(DESTINATION_FOLDER, '3DaysAgoBatteryData.txt')
FOUR_DAYS_AGO_BATTERY_DATA_FILE = os.path.join(DESTINATION_FOLDER, '4DaysAgoBatteryData.txt')
FIVE_DAYS_AGO_BATTERY_DATA_FILE = os.path.join(DESTINATION_FOLDER, '5DaysAgoBatteryData.txt')
SIX_DAYS_AGO_BATTERY_DATA_FILE = os.path.join(DESTINATION_FOLDER, '6DaysAgoBatteryData.txt')
SEVEN_DAYS_AGO_BATTERY_DATA_FILE = os.path.join(DESTINATION_FOLDER, '7DaysAgoBatteryData.txt')

# Function to copy and manage .txt files
def manage_battery_data():
    now = time.time()
    txt_files = []

    # Check and delete old .txt files in the source folder
    for filename in os.listdir(SOURCE_FOLDER):
        if filename.endswith('.txt'):
            file_path = os.path.join(SOURCE_FOLDER, filename)

            # Only check for modification time if the file exists
            if os.path.exists(file_path):
                # Check if the file is older than 5 days
                if os.path.getmtime(file_path) < now - (8 * 86400):  # 8 days in seconds
                    try:
                        os.remove(file_path)
                    except Exception:
                        pass  # Ignore errors if the file cannot be deleted
                else:
                    txt_files.append(file_path)

    # Sort files by modification time (latest first)
    txt_files.sort(key=os.path.getmtime, reverse=True)

    # Keep only the last 3 files
    txt_files = txt_files[:7]

    # Copy files to the destination, overwriting existing ones
    try:
        if len(txt_files) > 0:
            shutil.copy2(txt_files[0], LATEST_BATTERY_DATA_FILE)

        if len(txt_files) > 1:
            shutil.copy2(txt_files[1], YESTERDAY_BATTERY_DATA_FILE)

        if len(txt_files) > 2:
            shutil.copy2(txt_files[2], TWO_DAYS_AGO_BATTERY_DATA_FILE)
        #----
            
        if len(txt_files) > 3:
            shutil.copy2(txt_files[3], THREE_DAYS_AGO_BATTERY_DATA_FILE)
        if len(txt_files) > 4:
            shutil.copy2(txt_files[4], FOUR_DAYS_AGO_BATTERY_DATA_FILE)
        if len(txt_files) > 5:
            shutil.copy2(txt_files[5], FIVE_DAYS_AGO_BATTERY_DATA_FILE)
        if len(txt_files) > 6:
            shutil.copy2(txt_files[6], SIX_DAYS_AGO_BATTERY_DATA_FILE)

    except Exception:
        pass  # Ignore errors during file copy

if __name__ == "__main__":
    while True:
        manage_battery_data()
        time.sleep(3600)  # Sleep for 1 hour (3600 seconds)