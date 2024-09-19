# -*- coding: utf-8 -*-
"""
Created on Wed Sep 18 14:17:15 2024

@author: JoshuaPaterson
"""

import os
import shutil
import time
from datetime import datetime

# Define source and destination folders
SOURCE_FOLDER = r"C:\Users\JoshuaPaterson\Downloads\Testing1"
DESTINATION_FOLDER = r"C:\Users\JoshuaPaterson\Downloads\Testing2"

def is_same_day(file_time):
    """Check if the file was modified today."""
    return file_time.date() == datetime.now().date()

def copy_and_manage_files():
    """Copy files and manage deletion based on modification date and size."""
    for filename in os.listdir(SOURCE_FOLDER):
        source_file_path = os.path.join(SOURCE_FOLDER, filename)
        
        if os.path.isfile(source_file_path):
            # Get the modification time and size of the file
            file_mod_time = datetime.fromtimestamp(os.path.getmtime(source_file_path))
            file_size = os.path.getsize(source_file_path)
            
            # Destination file path
            destination_file_path = os.path.join(DESTINATION_FOLDER, filename)

            if is_same_day(file_mod_time):
                # If it's the same day, copy or update in the destination folder
                shutil.copy2(source_file_path, destination_file_path)
                print(f"Copied/Updated: {filename} to {DESTINATION_FOLDER}")
            else:
                # If not the same day, check if the file exists in the destination
                if os.path.exists(destination_file_path):
                    dest_file_size = os.path.getsize(destination_file_path)
                    
                    # Check if the sizes are the same
                    if file_size != dest_file_size:
                        # If sizes are different, copy the updated file
                        shutil.copy2(source_file_path, destination_file_path)
                        print(f"Updated different size: {filename} in {DESTINATION_FOLDER}")
                else:
                    # If it doesn't exist in the destination, delete it from the source
                    os.remove(source_file_path)
                    print(f"Deleted: {filename} from {SOURCE_FOLDER}")

def main():
    while True:
        copy_and_manage_files()
        time.sleep(60)  # Wait for a minute before checking again

if __name__ == "__main__":
    main()