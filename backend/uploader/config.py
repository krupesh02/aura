"""
Configuration Manager for Aura Desktop Uploader.
Saves/loads settings and folder-to-event mappings to a local JSON file.
"""
import os
import json
from datetime import datetime

# Config file location: ~/.aura_uploader/config.json
CONFIG_DIR = os.path.join(os.path.expanduser("~"), ".aura_uploader")
CONFIG_FILE = os.path.join(CONFIG_DIR, "config.json")

DEFAULT_CONFIG = {
    "server_url": "http://localhost:8000",
    "auth_token": "",
    "user_email": "",
    "root_folder": "",
    "mappings": {},        # local_path -> {folder_id, event_id, folder_name, ...}
    "uploaded_files": [],  # list of already-uploaded file paths
    "settings": {
        "max_concurrent_uploads": 3,
        "retry_count": 3,
        "retry_delay_seconds": 30,
        "supported_extensions": [".jpg", ".jpeg", ".png", ".webp", ".tiff", ".bmp"],
        "max_file_size_mb": 50,
        "auto_start_watching": False,
    }
}


def ensure_config_dir():
    """Create config directory if it doesn't exist."""
    if not os.path.exists(CONFIG_DIR):
        os.makedirs(CONFIG_DIR)


def load_config() -> dict:
    """Load config from disk. Returns default config if file doesn't exist."""
    ensure_config_dir()
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
            # Merge with defaults to handle new keys added in updates
            merged = {**DEFAULT_CONFIG, **saved}
            merged["settings"] = {**DEFAULT_CONFIG["settings"], **saved.get("settings", {})}
            return merged
        except (json.JSONDecodeError, IOError):
            return DEFAULT_CONFIG.copy()
    return DEFAULT_CONFIG.copy()


def save_config(config: dict):
    """Save config to disk."""
    ensure_config_dir()
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, default=str)


def add_mapping(config: dict, local_path: str, folder_id: str, event_id: str, folder_name: str) -> dict:
    """Add a local folder -> server event mapping."""
    config["mappings"][local_path] = {
        "local_path": local_path,
        "folder_id": folder_id,
        "event_id": event_id,
        "folder_name": folder_name,
        "created_at": datetime.now().isoformat(),
        "uploaded_count": 0,
        "total_count": 0,
    }
    save_config(config)
    return config


def mark_file_uploaded(config: dict, file_path: str) -> dict:
    """Mark a file as already uploaded to avoid re-uploading."""
    if file_path not in config["uploaded_files"]:
        config["uploaded_files"].append(file_path)
        # Also increment the mapping's uploaded_count
        parent_dir = os.path.dirname(file_path)
        if parent_dir in config["mappings"]:
            config["mappings"][parent_dir]["uploaded_count"] = \
                config["mappings"][parent_dir].get("uploaded_count", 0) + 1
        save_config(config)
    return config


def is_file_uploaded(config: dict, file_path: str) -> bool:
    """Check if a file was already uploaded."""
    return file_path in config["uploaded_files"]


def get_mapping_for_path(config: dict, file_path: str) -> dict | None:
    """Find the most specific mapping for a given file path (longest match)."""
    norm_file_path = os.path.normpath(file_path).lower()
    
    # Sort mappings by path length descending so we find the most specific one first
    sorted_mapped_paths = sorted(config["mappings"].keys(), key=len, reverse=True)
    
    for mapped_path in sorted_mapped_paths:
        norm_mapped_path = os.path.normpath(mapped_path).lower()
        if norm_file_path.startswith(norm_mapped_path + os.sep) or norm_file_path == norm_mapped_path:
            return config["mappings"][mapped_path]
    
    return None
