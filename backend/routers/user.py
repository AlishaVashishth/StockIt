from fastapi import APIRouter, HTTPException
from services.db import read_json, write_json, enforce_streak_on_app_open
from models.schemas import XpUpdateRequest, StartSessionRequest
from datetime import datetime, timezone
import uuid
import re

router = APIRouter()

def _email_to_key(email: str) -> str:
    key = re.sub(r"[^a-z0-9]+", "_", email.strip().lower()).strip("_")
    return key or f"user_{uuid.uuid4().hex[:8]}"

from services.db import active_user_email

@router.post("/start-session")
async def start_session(request: StartSessionRequest):
    trimmed_name = request.name.strip()
    email = request.email.strip().lower()
    password = request.password
    if not trimmed_name or not email or not password:
        raise HTTPException(status_code=400, detail="Name, email, and password are required")

    active_user_email.set(email)
    user_key = _email_to_key(email)

    existing_user = read_json("user.json")
    if isinstance(existing_user, dict) and existing_user.get("id"):
        if existing_user.get("password") != password:
            raise HTTPException(status_code=401, detail="Invalid credentials. If you already have an account, please make sure your password is correct.")
        existing_user = enforce_streak_on_app_open()
        existing_user["isNewUser"] = False
        write_json("user.json", existing_user)
        return existing_user

    initials = "".join([part[0].upper() for part in trimmed_name.split() if part][:2]) or "IN"
    user_id = email
    user_data = {
        "id": user_id,
        "name": trimmed_name,
        "email": email,
        "password": password,
        "avatarInitials": initials,
        "virtualCash": 100000.00,
        "xpPoints": 0,
        "currentTier": 1,
        "daysActive": 0,
        "streakCount": 0,
        "isNewUser": True,
        "createdAt": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "lastActivityDate": None
    }

    default_missions = [
        {"id": "m1", "missionKey": "first_large_cap", "title": "Buy your first Large Cap stock", "xpReward": 50, "completed": False, "completedAt": None},
        {"id": "m2", "missionKey": "hold_3_days", "title": "Hold a stock for 3 days", "xpReward": 75, "completed": False, "progress": 0, "total": 3, "completedAt": None},
        {"id": "m3", "missionKey": "five_stock_portfolio", "title": "Build a 5-stock portfolio", "xpReward": 100, "completed": False, "locked": True, "requiredTier": 2, "completedAt": None}
    ]

    write_json("user.json", user_data)
    write_json("holdings.json", [])
    write_json("transactions.json", [])
    write_json("lessons.json", [])
    write_json("missions.json", default_missions)
    write_json("time_machine_attempts.json", [])
    write_json("loss_debriefs.json", [])
    write_json("ai_mentor_logs.json", [])
    return user_data

@router.get("")
async def get_user():
    user_data = enforce_streak_on_app_open()
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    return user_data

@router.patch("/xp")
async def add_xp(request: XpUpdateRequest):
    user_data = read_json("user.json")
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_data["xpPoints"] = user_data.get("xpPoints", 0) + request.xpPoints
    
    xp = user_data["xpPoints"]
    if xp < 200:
        user_data["currentTier"] = 1
    elif xp < 500:
        user_data["currentTier"] = 2
    else:
        user_data["currentTier"] = 3
        
    write_json("user.json", user_data)
    return user_data

@router.get("/leaderboard")
async def get_leaderboard():
    returns_leaderboard = [
        {"rank": 1, "name": "Priya S.", "initials": "PS", "returnPct": 31.4, "portfolioValue": 131400, "isCurrentUser": False},
        {"rank": 2, "name": "Rahul M.", "initials": "RM", "returnPct": 28.7, "portfolioValue": 128700, "isCurrentUser": False},
        {"rank": 3, "name": "Kavya T.", "initials": "KT", "returnPct": 22.1, "portfolioValue": 122100, "isCurrentUser": False},
        {"rank": 4, "name": "Arjun K.", "initials": "AK", "returnPct": 14.2, "portfolioValue": 114200, "isCurrentUser": True},
        {"rank": 5, "name": "Sneha R.", "initials": "SR", "returnPct": 12.8, "portfolioValue": 112800, "isCurrentUser": False},
        {"rank": 6, "name": "Vikram N.", "initials": "VN", "returnPct": 10.1, "portfolioValue": 110100, "isCurrentUser": False},
        {"rank": 7, "name": "Ananya B.", "initials": "AB", "returnPct": 8.4, "portfolioValue": 108400, "isCurrentUser": False},
        {"rank": 8, "name": "Rohit S.", "initials": "RS", "returnPct": 6.2, "portfolioValue": 106200, "isCurrentUser": False},
        {"rank": 9, "name": "Meera K.", "initials": "MK", "returnPct": 4.7, "portfolioValue": 104700, "isCurrentUser": False},
        {"rank": 10, "name": "Dev P.", "initials": "DP", "returnPct": 2.1, "portfolioValue": 102100, "isCurrentUser": False}
    ]
    
    learning_leaderboard = [
        {"rank": 1, "name": "Kavya T.", "lessonsCompleted": 15, "isCurrentUser": False},
        {"rank": 2, "name": "Priya S.", "lessonsCompleted": 12, "isCurrentUser": False},
        {"rank": 3, "name": "Rahul M.", "lessonsCompleted": 10, "isCurrentUser": False},
        {"rank": 4, "name": "Arjun K.", "lessonsCompleted": 8, "isCurrentUser": True},
        {"rank": 5, "name": "Meera K.", "lessonsCompleted": 7, "isCurrentUser": False},
        {"rank": 6, "name": "Dev P.", "lessonsCompleted": 5, "isCurrentUser": False},
        {"rank": 7, "name": "Sneha R.", "lessonsCompleted": 4, "isCurrentUser": False},
        {"rank": 8, "name": "Vikram N.", "lessonsCompleted": 3, "isCurrentUser": False},
        {"rank": 9, "name": "Ananya B.", "lessonsCompleted": 2, "isCurrentUser": False},
        {"rank": 10, "name": "Rohit S.", "lessonsCompleted": 1, "isCurrentUser": False}
    ]
    
    risk_leaderboard = [
        {"rank": 1, "name": "Sneha R.", "riskScore": "9.4 High", "isCurrentUser": False},
        {"rank": 2, "name": "Arjun K.", "riskScore": "8.1 Solid", "isCurrentUser": True},
        {"rank": 3, "name": "Ananya B.", "riskScore": "7.5 Mod.", "isCurrentUser": False},
        {"rank": 4, "name": "Priya S.", "riskScore": "6.8 Mod.", "isCurrentUser": False},
        {"rank": 5, "name": "Vikram N.", "riskScore": "6.2 Mod.", "isCurrentUser": False},
        {"rank": 6, "name": "Rahul M.", "riskScore": "5.4 Avg", "isCurrentUser": False},
        {"rank": 7, "name": "Kavya T.", "riskScore": "4.9 Avg", "isCurrentUser": False},
        {"rank": 8, "name": "Meera K.", "riskScore": "4.1 Low", "isCurrentUser": False},
        {"rank": 9, "name": "Dev P.", "riskScore": "3.5 Low", "isCurrentUser": False},
        {"rank": 10, "name": "Rohit S.", "riskScore": "2.1 Poor", "isCurrentUser": False}
    ]
    
    return {
        "returns_leaderboard": returns_leaderboard,
        "learning_leaderboard": learning_leaderboard,
        "risk_leaderboard": risk_leaderboard,
        "currentUserRank": 4,
        "totalUsers": 1247
    }
