import json
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx


logger = logging.getLogger(__name__)

_DEV_STORE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
_DEV_STORE_PATH = os.path.join(_DEV_STORE_DIR, "gaffer_memory.json")


class WalrusMemory:
    def __init__(self, store_path: Optional[str] = None):
        self.endpoint = os.environ.get("WALRUS_ENDPOINT", "").rstrip("/")
        self.api_key = os.environ.get("WALRUS_API_KEY", "")
        self._dev_mode = not (bool(self.endpoint) and bool(self.api_key))

        if store_path:
            self._store_path = store_path
        else:
            self._store_path = _DEV_STORE_PATH

        if self._dev_mode:
            os.makedirs(os.path.dirname(self._store_path), exist_ok=True)
            logger.info("DEV MODE — %s", self._store_path)
        else:
            logger.info("PRODUCTION — %s", self.endpoint)

    # ── Dev mode helpers ──────────────────────────────────────────

    def _load_store(self) -> dict:
        if not os.path.exists(self._store_path):
            return {}
        try:
            with open(self._store_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return {}

    def _save_store(self, store: dict) -> None:
        os.makedirs(os.path.dirname(self._store_path), exist_ok=True)
        with open(self._store_path, "w", encoding="utf-8") as f:
            json.dump(store, f, indent=2, ensure_ascii=False)

    def _dev_read(self, user_id: str) -> Optional[dict]:
        store = self._load_store()
        return store.get(user_id)

    def _dev_write(self, user_id: str, data: dict) -> bool:
        store = self._load_store()
        store[user_id] = data
        self._save_store(store)
        return True

    def _dev_delete(self, user_id: str) -> bool:
        store = self._load_store()
        if user_id not in store:
            return False
        del store[user_id]
        self._save_store(store)
        return True

    def _dev_all_users(self) -> List[str]:
        store = self._load_store()
        return list(store.keys())

    # ── Prod mode helpers ─────────────────────────────────────────

    def _prod_read(self, user_id: str) -> Optional[dict]:
        try:
            with httpx.Client(timeout=10) as client:
                resp = client.get(
                    f"{self.endpoint}/v1/memory/{user_id}",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                )
                if resp.status_code == 404:
                    return None
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.error("PROD read error: %s", e)
            return None

    def _prod_write(self, user_id: str, data: dict) -> bool:
        try:
            with httpx.Client(timeout=10) as client:
                resp = client.put(
                    f"{self.endpoint}/v1/memory/{user_id}",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json=data,
                )
                resp.raise_for_status()
                return True
        except Exception as e:
            logger.error("PROD write error: %s", e)
            return False

    # ── Public API ────────────────────────────────────────────────

    def read(self, user_id: str) -> Optional[dict]:
        if not user_id:
            return None
        if self._dev_mode:
            return self._dev_read(user_id)
        return self._prod_read(user_id)

    def write(self, user_id: str, data: dict) -> bool:
        if not user_id:
            return False
        data["userId"] = user_id
        data["lastUpdated"] = datetime.now(timezone.utc).isoformat()
        if self._dev_mode:
            return self._dev_write(user_id, data)
        return self._prod_write(user_id, data)

    def delete(self, user_id: str) -> bool:
        if not user_id:
            return False
        if self._dev_mode:
            return self._dev_delete(user_id)
        return self._prod_delete(user_id)

    def all_users(self) -> List[str]:
        if not self._dev_mode:
            return []
        return self._dev_all_users()

    @staticmethod
    def generate_id() -> str:
        return str(uuid.uuid4())
