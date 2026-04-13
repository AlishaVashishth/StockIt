import json
import os
from typing import Union, Dict, List

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
USERS_DIR = os.path.join(DATA_DIR, "users")
CURRENT_USER_FILE = os.path.join(DATA_DIR, "current_user.json")

USER_SCOPED_FILES = {
    "user.json",
    "holdings.json",
    "transactions.json",
    "missions.json",
    "lessons.json",
    "time_machine_attempts.json",
    "loss_debriefs.json",
    "ai_mentor_logs.json"
}

def _get_active_user_key() -> str:
    if not os.path.exists(CURRENT_USER_FILE):
        return ""
    try:
        with open(CURRENT_USER_FILE, "r") as f:
            payload = json.load(f)
        return payload.get("userKey", "")
    except Exception:
        return ""

def _resolve_path(filename: str) -> str:
    if filename in USER_SCOPED_FILES:
        user_key = _get_active_user_key()
        if user_key:
            return os.path.join(USERS_DIR, user_key, filename)
    return os.path.join(DATA_DIR, filename)

def read_json(filename: str) -> Union[Dict, List]:
    filepath = _resolve_path(filename)
    if not os.path.exists(filepath):
        return {}  # Could also return [] based on context, but empty dict is a safe default
    with open(filepath, "r") as f:
        return json.load(f)

def write_json(filename: str, data: Union[Dict, List]) -> None:
    filepath = _resolve_path(filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2)
