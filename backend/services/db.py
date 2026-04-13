import json
import os
from typing import Union, Dict, List, Optional
import contextvars
from datetime import datetime, timezone, date

active_user_email = contextvars.ContextVar("active_user_email", default="")

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
    email = active_user_email.get()
    if email:
        import re
        key = re.sub(r"[^a-z0-9]+", "_", email.strip().lower()).strip("_")
        return key
    
    # Fallback to current_user.json ONLY for local execution if API header didn't catch it
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


def _parse_yyyy_mm_dd(value: str) -> Optional[date]:
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


def _today_utc() -> date:
    return datetime.now(timezone.utc).date()


def enforce_streak_on_app_open() -> Dict:
    """Reset streak if user skipped at least one full calendar day."""
    user_data = read_json("user.json")
    if not isinstance(user_data, dict) or not user_data:
        return user_data if isinstance(user_data, dict) else {}

    streak = int(user_data.get("streakCount", 0) or 0)
    last_activity = _parse_yyyy_mm_dd(
        user_data.get("lastActivityDate", "") or user_data.get("lastActiveDate", "")
    )
    today = _today_utc()

    changed = False
    if last_activity and (today - last_activity).days > 1 and streak != 0:
        user_data["streakCount"] = 0
        changed = True
    elif "streakCount" not in user_data:
        user_data["streakCount"] = streak
        changed = True

    if changed:
        write_json("user.json", user_data)

    return user_data


def record_activity_and_update_streak() -> Dict:
    """Update streak after a user completes a practice/learning activity."""
    user_data = read_json("user.json")
    if not isinstance(user_data, dict) or not user_data:
        return user_data if isinstance(user_data, dict) else {}

    today = _today_utc()
    last_activity = _parse_yyyy_mm_dd(
        user_data.get("lastActivityDate", "") or user_data.get("lastActiveDate", "")
    )
    current_streak = int(user_data.get("streakCount", 0) or 0)

    if last_activity is None:
        new_streak = 1
    else:
        day_gap = (today - last_activity).days
        if day_gap <= 0:
            new_streak = current_streak if current_streak > 0 else 1
        elif day_gap == 1:
            new_streak = current_streak + 1 if current_streak > 0 else 1
        else:
            new_streak = 1

    user_data["streakCount"] = new_streak
    user_data["lastActivityDate"] = today.strftime("%Y-%m-%d")
    write_json("user.json", user_data)
    return user_data
