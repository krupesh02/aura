"""
API Client for Aura Desktop Uploader.
Handles all communication with the backend server (login, folder/event creation, photo upload).
"""
import os
import requests
from typing import Optional


class AuraAPIClient:
    """Client to interact with the Aura Photo Platform backend API."""

    def __init__(self, server_url: str, auth_token: str = ""):
        self.server_url = server_url.rstrip("/")
        self.auth_token = auth_token

    def _headers(self) -> dict:
        """Return auth headers."""
        h = {"Accept": "application/json"}
        if self.auth_token:
            h["Authorization"] = f"Bearer {self.auth_token}"
        return h

    def _api(self, path: str) -> str:
        """Build full API URL."""
        return f"{self.server_url}{path}"

    # ── Authentication ───────────────────────────────────────────────────────

    def login(self, email: str, password: str) -> dict:
        """
        Login and get access token.
        Returns: {"access_token": "...", "user": {...}} on success.
        Raises: Exception on failure.
        """
        resp = requests.post(
            self._api("/api/auth/login"),
            json={"email": email, "password": password},
            headers={"Content-Type": "application/json"},
            timeout=15,
        )
        if resp.status_code == 200:
            data = resp.json()
            self.auth_token = data["access_token"]
            return data
        else:
            error_detail = resp.json().get("detail", resp.text) if resp.headers.get("content-type", "").startswith("application/json") else resp.text
            raise Exception(f"Login failed ({resp.status_code}): {error_detail}")

    def verify_token(self) -> bool:
        """Check if current token is still valid by calling /api/auth/me."""
        try:
            resp = requests.get(
                self._api("/api/auth/me"),
                headers=self._headers(),
                timeout=10,
            )
            return resp.status_code == 200
        except Exception:
            return False

    # ── Client Folders ───────────────────────────────────────────────────────

    def find_or_create_folder(self, name: str, price: int = 0) -> dict:
        """
        Find existing folder by name or create a new one.
        Returns: {"id": "...", "name": "...", ...}
        """
        resp = requests.post(
            self._api("/api/folders/find-or-create"),
            json={"name": name, "price": price},
            headers={**self._headers(), "Content-Type": "application/json"},
            timeout=15,
        )
        if resp.status_code == 200:
            return resp.json()
        else:
            raise Exception(f"Folder creation failed ({resp.status_code}): {resp.text}")

    # ── Events ───────────────────────────────────────────────────────────────

    def find_or_create_event(self, name: str, client_folder_id: str) -> dict:
        """
        Find existing event by name in a folder, or create a new one.
        Returns: {"id": "...", "name": "...", ...}
        """
        resp = requests.post(
            self._api("/api/events/find-or-create"),
            json={"name": name, "clientFolderId": client_folder_id},
            headers={**self._headers(), "Content-Type": "application/json"},
            timeout=15,
        )
        if resp.status_code == 200:
            return resp.json()
        else:
            raise Exception(f"Event creation failed ({resp.status_code}): {resp.text}")

    # ── Photo Upload ─────────────────────────────────────────────────────────

    def upload_photo(self, file_path: str, event_id: str, folder_name: str = "General") -> dict:
        """
        Upload a single photo to a specific event.
        Returns: {"id": "...", "url": "...", ...}
        """
        filename = os.path.basename(file_path)
        mime_type = self._guess_mime(filename)

        with open(file_path, "rb") as f:
            files = {"file": (filename, f, mime_type)}
            data = {"event_id": event_id, "folder_name": folder_name}
            resp = requests.post(
                self._api("/api/photos/upload"),
                files=files,
                data=data,
                headers={"Authorization": f"Bearer {self.auth_token}"},
                timeout=120,  # Large files can take time
            )

        if resp.status_code == 200:
            return resp.json()
        else:
            raise Exception(f"Upload failed ({resp.status_code}): {resp.text}")

    @staticmethod
    def _guess_mime(filename: str) -> str:
        """Guess MIME type from file extension."""
        ext = os.path.splitext(filename)[1].lower()
        mime_map = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
            ".tiff": "image/tiff",
            ".bmp": "image/bmp",
        }
        return mime_map.get(ext, "image/jpeg")
