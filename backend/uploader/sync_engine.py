"""
Sync Engine for Aura Desktop Uploader.
Orchestrates folder watching, auto-creation on server, and photo uploads.
"""
import os
import threading
import queue
from uploader.config import (
    load_config, save_config, add_mapping,
    mark_file_uploaded, is_file_uploaded, get_mapping_for_path
)
from uploader.api_client import AuraAPIClient
from uploader.watcher import FolderWatcher, is_image_file


def clean_folder_name(raw_name):
    """Convert folder name to a clean display name. E.g. 'Sneha_Wedding' -> 'Sneha Wedding'."""
    return raw_name.replace("_", " ").replace("-", " ").strip()


class SyncEngine:
    """Core engine that connects folder watching with server API calls."""

    def __init__(self, on_log=None, on_status_update=None, on_upload_progress=None):
        self.config = load_config()
        self.api = None
        self.watcher = None
        self.on_log = on_log
        self.on_status_update = on_status_update  # callback(mapping_dict)
        self.on_upload_progress = on_upload_progress  # callback(file, success, msg)
        self.upload_queue = queue.Queue()
        self._upload_workers = []
        self._running = False

    def log(self, msg):
        if self.on_log:
            self.on_log(msg)

    # ── Auth ─────────────────────────────────────────────────────────────────

    def login(self, server_url, email, password):
        """Login to server and save token."""
        self.config["server_url"] = server_url
        self.config["user_email"] = email
        self.api = AuraAPIClient(server_url)
        result = self.api.login(email, password)
        self.config["auth_token"] = self.api.auth_token
        save_config(self.config)
        self.log(f"✅ Logged in as {email}")
        return result

    def restore_session(self):
        """Try to restore a previous session from saved config."""
        if self.config.get("auth_token") and self.config.get("server_url"):
            self.api = AuraAPIClient(self.config["server_url"], self.config["auth_token"])
            if self.api.verify_token():
                self.log(f"✅ Session restored for {self.config.get('user_email', 'unknown')}")
                return True
            else:
                self.log("⚠️ Saved token expired. Please login again.")
                self.config["auth_token"] = ""
                save_config(self.config)
                return False
        return False

    # ── Watching ─────────────────────────────────────────────────────────────

    def start_watching(self, root_folder, price: int = 0):
        """Start watching a root folder. The root folder itself becomes the Client Folder."""
        if not self.api or not self.api.auth_token:
            self.log("❌ Not logged in! Please login first.")
            return False

        self.config["root_folder"] = os.path.normpath(root_folder)
        save_config(self.config)

        # Step 1: Immediately map the Root Folder as the Client Folder
        root_name = os.path.basename(self.config["root_folder"])
        self.log(f"📂 Initializing Main Folder: '{root_name}' (Price: ₹{price})...")
        try:
            folder_data = self.api.find_or_create_folder(clean_folder_name(root_name), price=price)
            folder_id = folder_data["id"]
            
            # Map the root folder to the Client Folder (no default event)
            self.config = add_mapping(self.config, self.config["root_folder"], folder_id, "", root_name)
            self.log(f"✅ Main Folder '{root_name}' is ready on server.")
        except Exception as e:
            self.log(f"❌ Failed to initialize Main Folder: {e}")
            return False

        # Step 2: Start Watcher
        self.watcher = FolderWatcher(
            root_folder=self.config["root_folder"],
            on_folder_created=self._on_folder_created,
            on_photo_created=self._on_photo_created,
            on_log=self.log,
        )
        self.watcher.start()
        self._running = True
        self._start_upload_workers()

        # Step 3: Scan existing folders as Events
        self._initial_scan(self.config["root_folder"])
        return True

    def stop_watching(self):
        """Stop the watcher and upload workers."""
        self._running = False
        if self.watcher:
            self.watcher.stop()
        self.log("⏹️ Sync stopped.")

    # ── Callbacks ────────────────────────────────────────────────────────────

    def _on_folder_created(self, folder_path, folder_name):
        """Called when a new sub-folder is detected. These are all Events."""
        norm_path = os.path.normpath(folder_path)
        root_path = self.config.get("root_folder")
        
        # IGNORE "New folder" - let the user rename it first!
        if folder_name.lower() == "new folder":
            self.log(f"⏳ Ignoring placeholder '{folder_name}'. Rename it to sync.")
            return

        if norm_path == root_path or norm_path in self.config["mappings"]:
            return

        # Only process direct children of root folder
        parent_dir = os.path.dirname(norm_path)
        if parent_dir != root_path:
            return

        self.log(f"📁 New sub-folder detected: '{folder_name}'")
        threading.Thread(target=self._auto_create_event, args=(norm_path, folder_name), daemon=True).start()

    def _on_photo_created(self, file_path):
        """Called when a new photo file is detected."""
        norm_path = os.path.normpath(file_path)
        if is_file_uploaded(self.config, norm_path):
            return
        self.upload_queue.put(norm_path)

    # ── Auto Create Logic ────────────────────────────────────────────────────

    def _auto_create_event(self, folder_path, raw_folder_name):
        """Create a sub-event inside the Main Root Folder."""
        display_name = clean_folder_name(raw_folder_name)
        
        # Get the root mapping to find Client Folder ID
        root_path = self.config.get("root_folder")
        root_mapping = self.config["mappings"].get(root_path)
        
        if not root_mapping:
            self.log(f"⚠️ Root mapping not found for {root_path}. Cannot create event '{display_name}'.")
            return

        folder_id = root_mapping["folder_id"]
        self.log(f"📋 Creating Event '{display_name}' on server...")

        try:
            event_data = self.api.find_or_create_event(display_name, folder_id)
            event_id = event_data["id"]

            self.config = add_mapping(self.config, folder_path, folder_id, event_id, display_name)
            self.log(f"✅ Event '{display_name}' mapped successfully.")

            if self.on_status_update:
                self.on_status_update(self.config["mappings"])

            self._scan_folder_photos(folder_path)
        except Exception as e:
            self.log(f"❌ Event creation failed for {display_name}: {e}")

    # ── Upload Workers ───────────────────────────────────────────────────────

    def _start_upload_workers(self):
        """Start background upload worker threads."""
        count = self.config.get("settings", {}).get("max_concurrent_uploads", 3)
        self.log(f"⚙️ Starting {count} upload workers...")
        self._upload_workers = []
        for i in range(count):
            t = threading.Thread(target=self._upload_worker, args=(i+1,), daemon=True)
            t.start()
            self._upload_workers.append(t)

    def _upload_worker(self, worker_id):
        """Worker thread that processes the upload queue."""
        self.log(f"👷 Worker {worker_id} started.")
        while self._running:
            try:
                try:
                    file_path = self.upload_queue.get(timeout=2)
                except queue.Empty:
                    continue

                if is_file_uploaded(self.config, file_path):
                    continue
                
                # self.log(f"🔍 [W{worker_id}] Checking: {os.path.basename(file_path)}")
                mapping = get_mapping_for_path(self.config, file_path)
                
                # Path comparison fix for Windows
                root_path = self.config.get("root_folder", "").lower()
                file_dir = os.path.dirname(file_path).lower()
                
                if mapping:
                    mapped_local = mapping.get("local_path", "").lower()
                    # If this is the root mapping but the photo is in a sub-dir, wait for sub-dir mapping
                    if mapped_local == root_path and file_dir != root_path:
                        mapping = None

                if not mapping:
                    # Parent folder not yet mapped — re-queue after delay
                    self.log(f"⏳ Waiting for event mapping: {os.path.basename(file_path)}")
                    threading.Timer(3.0, lambda fp=file_path: self.upload_queue.put(fp)).start()
                    continue

                event_id = mapping.get("event_id", "")
                
                # If no event_id (Root folder with no sub-folders), create 'Main Gallery' on the fly
                if not event_id:
                    try:
                        self.log("📋 Root photo detected. Auto-creating 'Main Gallery'...")
                        folder_id = mapping["folder_id"]
                        event_data = self.api.find_or_create_event("Main Gallery", folder_id)
                        event_id = event_data["id"]
                        # Update mapping
                        self.config = add_mapping(self.config, self.config["root_folder"], folder_id, event_id, mapping["folder_name"])
                    except Exception as e:
                        self.log(f"❌ Failed to create on-demand gallery: {e}")
                        continue

                retries = self.config.get("settings", {}).get("retry_count", 3)

                for attempt in range(1, retries + 1):
                    try:
                        self.log(f"📤 [W{worker_id}] Uploading: {os.path.basename(file_path)}")
                        self.api.upload_photo(file_path, event_id)
                        self.config = mark_file_uploaded(self.config, file_path)
                        self.log(f"✅ [W{worker_id}] Uploaded: {os.path.basename(file_path)}")
                        
                        if self.on_upload_progress:
                            self.on_upload_progress(file_path, True, "Success")
                        break
                    except Exception as e:
                        self.log(f"⚠️ [W{worker_id}] Upload error (attempt {attempt}): {e}")
                        if attempt == retries:
                            self.log(f"💀 Failed to upload: {os.path.basename(file_path)}")
                            if self.on_upload_progress:
                                self.on_upload_progress(file_path, False, str(e))
                
                self.upload_queue.task_done()

            except Exception as fatal_e:
                self.log(f"🚨 Fatal worker error: {fatal_e}")
                time.sleep(1)

    # ── Scanning ─────────────────────────────────────────────────────────────

    def _initial_scan(self, root_folder):
        """Scan existing sub-folders and register them."""
        self.log("🔍 Scanning existing folders...")
        try:
            for item in os.listdir(root_folder):
                item_path = os.path.join(root_folder, item)
                if os.path.isdir(item_path):
                    norm = os.path.normpath(item_path)
                    if item.lower() == "new folder":
                        continue
                    if norm not in self.config["mappings"]:
                        self._on_folder_created(item_path, item)
                    else:
                        self.log(f"✅ Already mapped: {item}")
                        self._scan_folder_photos(item_path)
        except Exception as e:
            self.log(f"❌ Scan error: {e}")

    def _scan_folder_photos(self, folder_path):
        """Queue all un-uploaded photos in a folder."""
        count = 0
        for root, dirs, files in os.walk(folder_path):
            for f in files:
                fp = os.path.normpath(os.path.join(root, f))
                if is_image_file(fp) and not is_file_uploaded(self.config, fp):
                    self.upload_queue.put(fp)
                    count += 1
        if count > 0:
            self.log(f"📥 Queued {count} photos from {os.path.basename(folder_path)}")
