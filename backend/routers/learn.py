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
    },
    {
        "id": 6,
        "title": "Behavioral Finance & Trading Psychology",
        "description": "Master fear, greed, and discipline to avoid emotional mistakes",
        "xpReward": 120,
        "requiredTier": 2,
        "caseStudy": "How panic selling during COVID hurt retail investors",
        "totalLessons": 4
    }
]

LESSONS_STATIC = {
    1: [
        {
            "id": 1, "moduleId": 1, "lessonNumber": 1, "title": "Why Stocks Exist", "xpReward": 20,
            "content": [{"type": "text", "value": "Stocks represent ownership in a company. Companies sell shares to raise money for growth."}],
            "quiz": [{"question": "Buying a stock means you own:", "options": ["Debt only", "A small part of the company", "Only voting rights", "Nothing legal"], "correctIndex": 1, "explanation": "Shareholders own a fractional stake in the business."}]
        },
        {
            "id": 2, "moduleId": 1, "lessonNumber": 2, "title": "Primary vs Secondary Market", "xpReward": 20,
            "content": [{"type": "text", "value": "IPO is the primary market where company raises funds. Stock exchanges are secondary markets where investors trade among themselves."}],
            "quiz": [{"question": "Where does a company raise fresh capital?", "options": ["Secondary market", "IPO/primary market", "Only mutual funds", "Derivatives market"], "correctIndex": 1, "explanation": "Fresh capital is raised in the primary market."}]
        }
    ],
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
    ],
    3: [
        {
            "id": 1, "moduleId": 3, "lessonNumber": 1, "title": "Types of Risk", "xpReward": 20,
            "content": [{"type": "text", "value": "Market risk impacts all stocks. Company risk is specific to one business. Liquidity risk appears when buyers are limited."}],
            "quiz": [{"question": "A sector-wide crash is mostly:", "options": ["Company risk", "Market risk", "Liquidity risk", "Broker risk"], "correctIndex": 1, "explanation": "A broad decline across many stocks is market risk."}]
        },
        {
            "id": 2, "moduleId": 3, "lessonNumber": 2, "title": "Position Sizing Basics", "xpReward": 20,
            "content": [{"type": "text", "value": "Don't put too much money in one stock. Position sizing protects your capital when a trade goes wrong."}],
            "quiz": [{"question": "Good risk practice is to:", "options": ["All-in one stock", "Diversify and size positions", "Ignore downside", "Average down always"], "correctIndex": 1, "explanation": "Sizing and diversification limit large losses."}]
        }
    ],
    4: [
        {
            "id": 1, "moduleId": 4, "lessonNumber": 1, "title": "What Diversification Really Means", "xpReward": 25,
            "content": [{"type": "text", "value": "True diversification means spreading across sectors and business models, not just owning many names from one sector."}],
            "quiz": [{"question": "Owning 5 IT stocks is:", "options": ["Highly diversified", "Partially diversified", "Not sector-diversified", "Risk-free"], "correctIndex": 2, "explanation": "Sector concentration still remains high."}]
        },
        {
            "id": 2, "moduleId": 4, "lessonNumber": 2, "title": "Building Core-Satellite Portfolios", "xpReward": 25,
            "content": [{"type": "text", "value": "Core holdings are stable leaders. Satellite positions are smaller tactical bets for higher growth."}],
            "quiz": [{"question": "Core portfolio should usually be:", "options": ["Most volatile stocks", "Stable long-term businesses", "Only penny stocks", "Daily momentum picks"], "correctIndex": 1, "explanation": "Core is meant to provide stability over time."}]
        }
    ],
    5: [
        {
            "id": 1, "moduleId": 5, "lessonNumber": 1, "title": "Limit vs Market Orders", "xpReward": 30,
            "content": [{"type": "text", "value": "Market order executes immediately at current price. Limit order executes only at your chosen price or better."}],
            "quiz": [{"question": "If price control is priority, use:", "options": ["Market order", "Limit order", "Random order", "No order type"], "correctIndex": 1, "explanation": "Limit orders let you define acceptable price."}]
        },
        {
            "id": 2, "moduleId": 5, "lessonNumber": 2, "title": "Futures Basics", "xpReward": 30,
            "content": [{"type": "text", "value": "Futures are leveraged contracts. Small moves can create large gains or losses, so risk control is critical."}],
            "quiz": [{"question": "Futures trading usually has:", "options": ["No leverage", "Leverage and higher risk", "Guaranteed returns", "No margin"], "correctIndex": 1, "explanation": "Futures are leveraged instruments."}]
        }
    ],
    6: [
        {
            "id": 1, "moduleId": 6, "lessonNumber": 1, "title": "Avoiding FOMO", "xpReward": 25,
            "content": [{"type": "text", "value": "FOMO makes traders chase extended moves without a plan. Use rules before entering any momentum trade."}],
            "quiz": [{"question": "FOMO usually leads to:", "options": ["Disciplined entries", "Impulsive trades", "Lower risk", "Better journaling"], "correctIndex": 1, "explanation": "Impulsive entries often come from fear of missing out."}]
        },
        {
            "id": 2, "moduleId": 6, "lessonNumber": 2, "title": "Trading Journal Habit", "xpReward": 25,
            "content": [{"type": "text", "value": "A simple journal of entry, exit, and emotion helps identify repeat mistakes and improve decision quality."}],
            "quiz": [{"question": "A trading journal helps you:", "options": ["Hide mistakes", "Track patterns and improve", "Predict market exactly", "Avoid all losses"], "correctIndex": 1, "explanation": "Reviewing your decisions improves consistency over time."}]
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
