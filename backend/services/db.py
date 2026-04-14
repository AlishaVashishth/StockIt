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


def _get_last_credit_date(user_data: Dict) -> Optional[date]:
    """
    Returns the most recent day the user "kept streak alive".
    We treat either an app open or a completed activity as a streak credit.
    """
    last_open = _parse_yyyy_mm_dd(str(user_data.get("lastOpenDate", "") or ""))
    last_activity = _parse_yyyy_mm_dd(
        str(user_data.get("lastActivityDate", "") or user_data.get("lastActiveDate", "") or "")
    )
    if last_open and last_activity:
        return max(last_open, last_activity)
    return last_open or last_activity


def enforce_streak_on_app_open() -> Dict:
    """
    Enforce streak rules on first API touch of the day.

    Rules:
    - Streak credit counts if user opens the app OR completes a learning/trading activity.
    - If the user skips at least one full calendar day (gap > 1), streak resets to 0.
    - On first open of a new day, streak increments by 1 (or becomes 1 after a reset).
    """
    user_data = read_json("user.json")
    if not isinstance(user_data, dict) or not user_data:
        return user_data if isinstance(user_data, dict) else {}

    today = _today_utc()
    current_streak = int(user_data.get("streakCount", 0) or 0)
    last_credit = _get_last_credit_date(user_data)
    last_open = _parse_yyyy_mm_dd(str(user_data.get("lastOpenDate", "") or ""))

    changed = False
    # Always stamp the open date (used by UI to decide filled vs hollow icon).
    if last_open != today:
        user_data["lastOpenDate"] = today.strftime("%Y-%m-%d")
        changed = True

    if last_credit is None:
        # First ever credit: opening today starts the streak at 1.
        if current_streak != 1:
            user_data["streakCount"] = 1
            changed = True
    else:
        gap = (today - last_credit).days
        if gap > 1:
            # Missed at least one full day; reset to 0, then today's open starts at 1.
            if current_streak != 0:
                user_data["streakCount"] = 0
                changed = True
            user_data["streakCount"] = 1
            changed = True
        elif gap == 1:
            # New calendar day: opening app credits streak +1 (only once per day).
            user_data["streakCount"] = (current_streak + 1) if current_streak > 0 else 1
            changed = True
        else:
            # gap <= 0: already credited today; do nothing.
            pass

    # Back-compat: if older user files only have daysActive.
    if "streakCount" not in user_data:
        user_data["streakCount"] = int(user_data.get("daysActive", 0) or 0)
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
    last_credit = _get_last_credit_date(user_data)
    current_streak = int(user_data.get("streakCount", 0) or 0)

    # Completing an activity counts as a streak credit, but should not double-increment
    # if an app open already credited the same day.
    if last_credit is None:
        new_streak = 1
    else:
        gap = (today - last_credit).days
        if gap <= 0:
            new_streak = current_streak if current_streak > 0 else 1
        elif gap == 1:
            new_streak = current_streak + 1 if current_streak > 0 else 1
        else:
            new_streak = 1

    user_data["streakCount"] = new_streak
    user_data["lastActivityDate"] = today.strftime("%Y-%m-%d")
    write_json("user.json", user_data)
    return user_data
