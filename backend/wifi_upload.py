import os
import sys
import time
import requests
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Configuration
# The folder where your camera saves photos via WiFi/Tethering
WATCH_FOLDER = "./photos" 
# Your backend API URL
API_URL = "http://localhost:8000/api/photos/upload"
# Provide the Event ID you want to upload these photos to
EVENT_ID = "YOUR_EVENT_ID_HERE"
# Provide a valid bearer token for authentication
AUTH_TOKEN = "YOUR_AUTH_TOKEN_HERE"

class PhotoUploadHandler(FileSystemEventHandler):
    def on_created(self, event):
        # We only care about files, not directories
        if not event.is_directory:
            filepath = event.src_path
            if filepath.lower().endswith(('.png', '.jpg', '.jpeg')):
                print(f"New photo detected: {filepath}")
                # Wait briefly to ensure the file is completely written to disk
                time.sleep(1)
                self.upload_photo(filepath)

    def upload_photo(self, filepath):
        try:
            print(f"Uploading {filepath}...")
            with open(filepath, 'rb') as f:
                files = {'file': (os.path.basename(filepath), f, 'image/jpeg')}
                data = {'event_id': EVENT_ID}
                headers = {'Authorization': f'Bearer {AUTH_TOKEN}'}
                
                response = requests.post(API_URL, files=files, data=data, headers=headers)
                
            if response.status_code == 200:
                print(f"✅ Successfully uploaded: {filepath}")
            else:
                print(f"❌ Failed to upload {filepath}. Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            print(f"Error uploading {filepath}: {e}")

if __name__ == "__main__":
    if not os.path.exists(WATCH_FOLDER):
        os.makedirs(WATCH_FOLDER)
        print(f"Created watch folder at {WATCH_FOLDER}")

    event_handler = PhotoUploadHandler()
    observer = Observer()
    observer.schedule(event_handler, WATCH_FOLDER, recursive=False)
    observer.start()
    
    print(f"📷 Watching for new photos in: {os.path.abspath(WATCH_FOLDER)}")
    print("Press Ctrl+C to stop.")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        print("\nStopped watching.")
    observer.join()
