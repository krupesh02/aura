"""
Folder Watcher for Aura Desktop Uploader.
Uses watchdog to monitor a root folder for new sub-folders and new image files.
"""
import os
import time
import threading
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".tiff", ".bmp"}


def is_image_file(path):
    ext = os.path.splitext(path)[1].lower()
    return ext in IMAGE_EXTENSIONS


def is_temp_file(path):
    basename = os.path.basename(path)
    return (basename.startswith(".") or basename.startswith("~")
            or basename.endswith(".tmp") or basename.endswith(".part")
            or "Thumbs.db" in basename or "desktop.ini" in basename)


class FolderEventHandler(FileSystemEventHandler):
    def __init__(self, root_folder, on_folder_created=None, on_photo_created=None, on_log=None):
        super().__init__()
        self.root_folder = os.path.normpath(root_folder)
        self.on_folder_created = on_folder_created
        self.on_photo_created = on_photo_created
        self.on_log = on_log
        self._recently_seen = set()

    def _log(self, message):
        if self.on_log:
            self.on_log(message)

    def _handle_new_folder(self, folder_path: str):
        """Process a newly created folder (up to 2 levels deep)."""
        path = os.path.normpath(folder_path)
        
        # Give user time to rename "New folder" before we catch it
        time.sleep(2)
        if not os.path.exists(path):
            return
            
        rel_path = os.path.relpath(path, self.root_folder)
        parts = rel_path.split(os.sep)

        if len(parts) > 2:
            self._log(f"⏭️ Skipping deep nested folder: {rel_path}")
            return

        folder_name = os.path.basename(path)
        self._log(f"📁 New folder detected: {folder_name} (Level {len(parts)})")

        if self.on_folder_created:
            self.on_folder_created(path, folder_name)

    def on_created(self, event):
        path = os.path.normpath(event.src_path)
        if is_temp_file(path) or path in self._recently_seen:
            return
        self._recently_seen.add(path)
        threading.Timer(5.0, lambda: self._recently_seen.discard(path)).start()

        if event.is_directory:
            self._handle_new_folder(path)
        elif is_image_file(path):
            time.sleep(1)
            if not os.path.exists(path) or os.path.getsize(path) < 1024:
                return
            if self.on_log:
                self.on_log(f"📸 New photo detected: {os.path.basename(path)}")
            if self.on_photo_created:
                self.on_photo_created(path)

    def on_moved(self, event):
        """Handle renames/moves."""
        dest_path = os.path.normpath(event.dest_path)
        if is_temp_file(dest_path):
            return
            
        if event.is_directory:
            self._log(f"🔄 Renamed folder: {os.path.basename(event.src_path)} -> {os.path.basename(dest_path)}")
            self._handle_new_folder(dest_path)
        elif is_image_file(dest_path):
            if self.on_photo_created:
                self.on_photo_created(dest_path)


class FolderWatcher:
    def __init__(self, root_folder, on_folder_created=None, on_photo_created=None, on_log=None):
        self.root_folder = root_folder
        self.observer = None
        self.handler = FolderEventHandler(root_folder, on_folder_created, on_photo_created, on_log)
        self.on_log = on_log

    def start(self):
        if not os.path.exists(self.root_folder):
            os.makedirs(self.root_folder)
        self.observer = Observer()
        self.observer.schedule(self.handler, self.root_folder, recursive=True)
        self.observer.start()
        if self.on_log:
            self.on_log(f"👁️ Watching: {self.root_folder}")

    def stop(self):
        if self.observer:
            self.observer.stop()
            self.observer.join()
            self.observer = None
            if self.on_log:
                self.on_log("⏹️ Watcher stopped.")

    def is_running(self):
        return self.observer is not None and self.observer.is_alive()
