from fastapi import APIRouter, HTTPException
from services.db import read_json, write_json
from models.schemas import LessonCompleteRequest, MissionCompleteRequest
from datetime import datetime, timezone
import uuid

router = APIRouter()

MODULES_STATIC = [
    {
        "id": 1, 
        "title": "What is a Stock?", 
        "description": "Understand ownership, shares, and why companies list publicly", 
        "xpReward": 50, 
        "requiredTier": 1, 
        "caseStudy": "Reliance IPO 1977 — When Dhirubhai Ambani opened investing to ordinary Indians", 
        "totalLessons": 5
    },
    {
        "id": 2, 
        "title": "How to Read Charts", 
        "description": "Candlesticks, support/resistance, volume — decoded simply", 
        "xpReward": 75, 
        "requiredTier": 1, 
        "caseStudy": "COVID Crash March 2020 — The biggest red candle in NSE history", 
        "totalLessons": 5
    },
    {
        "id": 3, 
        "title": "Understanding Risk", 
        "description": "Concentration risk, market risk, regulatory risk with real examples", 
        "xpReward": 100, 
        "requiredTier": 1, 
        "caseStudy": "Yes Bank Collapse 2020 — When safe banking stocks weren't safe", 
        "totalLessons": 5
    },
    {
        "id": 4, 
        "title": "Diversification & Portfolio Building", 
        "description": "Why spreading investments is armour, not just advice", 
        "xpReward": 125, 
        "requiredTier": 2, 
        "caseStudy": "Asian Paints vs Yes Bank — Boring vs Exciting over 20 years", 
        "totalLessons": 5
    },
    {
        "id": 5, 
        "title": "Advanced Orders & F&O Basics", 
        "description": "Stop losses, limit orders, futures — the full toolkit", 
        "xpReward": 150, 
        "requiredTier": 3, 
        "caseStudy": "How stop losses saved investors during Adani Group crash 2023", 
        "totalLessons": 5
    }
]

LESSONS_STATIC = {
    2: [
        {
            "id": 1, "moduleId": 2, "lessonNumber": 1, "title": "The Anatomy of a Candlestick", "xpReward": 20,
            "content": [
                {"type": "text", "value": "A candlestick shows you the entire price action of a specific timeframe visually."},
                {"type": "text", "value": "It has four parts: Open, High, Low, and Close (OHLC)."}
            ],
            "quiz": [
                {
                    "question": "What does a green candlestick mean?",
                    "options": ["Price closed lower than it opened", "Price closed higher than it opened", "Nobody traded", "The app crashed"],
                    "correctIndex": 1,
                    "explanation": "Green (or white) signifies bullish action where the closing price beat the opening price."
                }
            ]
        },
        {
            "id": 2, "moduleId": 2, "lessonNumber": 2, "title": "Support and Resistance", "xpReward": 20,
            "content": [
                {"type": "text", "value": "Support is where the price stops falling. Resistance is where it stops rising."},
                {"type": "text", "value": "Think of support as the floor and resistance as the ceiling."}
            ],
            "quiz": [
                {
                    "question": "If a stock continuously bounces up from ₹100, what is ₹100?",
                    "options": ["Resistance", "A breakout", "Support", "A dividend"],
                    "correctIndex": 2,
                    "explanation": "Support acts as a floor stopping the price from falling further down."
                }
            ]
        },
        {
            "id": 3, "moduleId": 2, "lessonNumber": 3, "title": "Reading Volume", "xpReward": 20,
            "content": [
                {"type": "text", "value": "Volume is the fuel behind price movement. High volume means strong conviction."},
                {"type": "text", "value": "A price breakout with low volume is often a trap."}
            ],
            "quiz": [
                {
                    "question": "What is the safest breakout pattern?",
                    "options": ["Breakout with very low volume", "Breakout with zero volume", "Breakout with high volume", "Volume doesn't matter"],
                    "correctIndex": 2,
                    "explanation": "High volume confirms that institutional money is supporting the price trend."
                }
            ]
        }
    ]
}

def update_user_xp(xp_points: int):
    user_data = read_json("user.json")
    user_data["xpPoints"] = user_data.get("xpPoints", 0) + xp_points
    xp = user_data["xpPoints"]
    if xp < 200:
        user_data["currentTier"] = 1
    elif xp < 500:
        user_data["currentTier"] = 2
    else:
        user_data["currentTier"] = 3
    write_json("user.json", user_data)
    return user_data

@router.get("/modules")
async def get_modules():
    user_data = read_json("user.json")
    user_tier = user_data.get("currentTier", 1)
    
    lessons = read_json("lessons.json")
    if not isinstance(lessons, list): lessons = []
    
    completed_counts = {}
    for l in lessons:
        if l.get("completed"):
            mod_id = l.get("moduleId")
            completed_counts[mod_id] = completed_counts.get(mod_id, 0) + 1
            
    enriched = []
    for mod in MODULES_STATIC:
        mod_copy = dict(mod)
        mod_copy["isUnlocked"] = user_tier >= mod["requiredTier"]
        mod_copy["completedLessons"] = completed_counts.get(mod["id"], 0)
        enriched.append(mod_copy)
        
    return enriched

@router.get("/modules/{moduleId}/lessons")
async def get_lessons(moduleId: int):
    lessons_data = read_json("lessons.json")
    if not isinstance(lessons_data, list): lessons_data = []
    completed_map = {l.get("lessonId"): True for l in lessons_data if l.get("completed")}
    
    static_lessons = LESSONS_STATIC.get(moduleId, [])
    enriched_lessons = []
    
    for lesson in static_lessons:
        l_copy = dict(lesson)
        l_copy["completed"] = completed_map.get(lesson.get("id"), False)
        enriched_lessons.append(l_copy)
        
    return enriched_lessons

@router.post("/complete")
async def complete_lesson(request: LessonCompleteRequest):
    lessons_json = read_json("lessons.json")
    if not isinstance(lessons_json, list): lessons_json = []
    
    existing = next((l for l in lessons_json if l.get("lessonId") == request.lessonId and l.get("moduleId") == request.moduleId), None)
    
    if existing and existing.get("completed"):
        return {"alreadyCounted": True}
        
    if existing:
        existing["completed"] = True
        existing["quizScore"] = request.quizScore
    else:
        lessons_json.append({
            "id": f"l_{uuid.uuid4().hex[:8]}",
            "lessonId": request.lessonId,
            "moduleId": request.moduleId,
            "completed": True,
            "quizScore": request.quizScore
        })
        
    xp_gained = 20 + (request.quizScore * 6)
    
    write_json("lessons.json", lessons_json)
    update_user_xp(xp_gained)
    
    mod_target = next((m for m in MODULES_STATIC if m["id"] == request.moduleId), None)
    module_complete = False
    
    if mod_target:
        completed_count = sum(1 for l in lessons_json if l.get("moduleId") == request.moduleId and l.get("completed"))
        if completed_count >= mod_target["totalLessons"]:
            module_complete = True
            update_user_xp(mod_target["xpReward"])
            xp_gained += mod_target["xpReward"]

    return {"xpAwarded": xp_gained, "lessonComplete": True, "moduleComplete": module_complete}

@router.get("/missions")
async def get_missions():
    missions = read_json("missions.json")
    if not isinstance(missions, list): missions = []
    return missions

@router.post("/missions/complete")
async def complete_mission(request: MissionCompleteRequest):
    missions = read_json("missions.json")
    if not isinstance(missions, list): missions = []
    
    target = next((m for m in missions if m.get("missionKey") == request.missionKey), None)
    if not target:
        raise HTTPException(status_code=404, detail="Mission not found")
        
    if target.get("completed"):
        return {"mission": target, "xpAwarded": 0, "alreadyCounted": True}
        
    target["completed"] = True
    target["completedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    
    if "progress" in target and "total" in target:
        target["progress"] = target["total"]
        
    xp_reward = target.get("xpReward", 0)
    update_user_xp(xp_reward)
    write_json("missions.json", missions)
    
    return {"mission": target, "xpAwarded": xp_reward}
