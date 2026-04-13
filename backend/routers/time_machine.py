from fastapi import APIRouter
from services.db import read_json, write_json, record_activity_and_update_streak
from models.schemas import TimeMachineAttemptRequest
from routers.learn import update_user_xp

router = APIRouter()

SCENARIOS_STATIC = [
    {
        "id": 1, "title": "The COVID Crash", "date": "March 23, 2020",
        "era": "2020", "description": "Markets crashed 40% in 3 weeks. Panic everywhere. What would you do with 10,000 rupees?",
        "stock": "NIFTY50", "startPrice": 7610, "endPrice": 18600, "endDate": "October 2021",
        "choices": [
            {"id": "buy", "label": "I would BUY", "emoji": "😤"},
            {"id": "sell", "label": "I would SELL", "emoji": "😰"},
            {"id": "wait", "label": "I would WAIT", "emoji": "🤔"}
        ],
        "outcomes": {
            "buy": {"result": "Your 10,000 became 24,440", "finalAmount": 24440, "isWin": True, "lesson": "Buying during maximum fear creates maximum returns. Buffett calls this being greedy when others are fearful."},
            "sell": {"result": "You locked in a 40% loss. Your 10,000 became 6,000", "finalAmount": 6000, "isWin": False, "lesson": "Panic selling during a crash is the most expensive mistake in investing. The market recovered 2.5x within 18 months."},
            "wait": {"result": "Smart! You avoided the crash but also missed buying at the bottom. Your 10,000 stayed 10,000.", "finalAmount": 10000, "isWin": False, "lesson": "Waiting is better than panic selling — but the real wealth was made by those who bought during fear."}
        },
        "concept": "Contrarian Investing", "xpReward": 75
    },
    {
        "id": 2, "title": "The Paytm IPO Disaster", "date": "November 18, 2021",
        "era": "2021", "description": "Paytm IPO — the biggest in Indian history. Everyone was subscribing. FOMO was real.",
        "stock": "PAYTM", "startPrice": 2150, "endPrice": 560, "endDate": "June 2022",
        "choices": [
            {"id": "subscribe", "label": "Subscribe — FOMO is real", "emoji": "🤑"},
            {"id": "skip", "label": "Skip — something feels off", "emoji": "🤔"}
        ],
        "outcomes": {
            "subscribe": {"result": "Paytm crashed 74% in 6 months. Your 10,000 became 2,604", "finalAmount": 2604, "isWin": False, "lesson": "IPO hype and business quality are completely different things. Paytm had no clear path to profits at IPO price."},
            "skip": {"result": "Great instinct! You avoided one of India's worst IPO disasters.", "finalAmount": 10000, "isWin": True, "lesson": "When you cannot explain how a company makes money sustainably, that is your signal to wait."}
        },
        "concept": "IPO Risk and Valuation", "xpReward": 75
    },
    {
        "id": 3, "title": "Yes Bank Bargain Hunt", "date": "January 2019",
        "era": "2019", "description": "Yes Bank at 200 rupees, down 60% from its peak. Everyone says it looks cheap. Is it a bargain?",
        "stock": "YESBANK", "startPrice": 200, "endPrice": 12, "endDate": "March 2020",
        "choices": [
            {"id": "buy", "label": "Buy — looks cheap!", "emoji": "🛒"},
            {"id": "skip", "label": "Skip — something feels wrong", "emoji": "🤔"}
        ],
        "outcomes": {
            "buy": {"result": "RBI placed Yes Bank under moratorium. Your 10,000 became 600", "finalAmount": 600, "isWin": False, "lesson": "A stock is not cheap just because it has fallen a lot. Check promoter pledging, NPA ratios, and RBI notices."},
            "skip": {"result": "You dodged a bullet. Yes Bank fell 94% and is still in recovery 5 years later.", "finalAmount": 10000, "isWin": True, "lesson": "Cheap stocks can always get cheaper. Falling price is a symptom — always diagnose the disease."}
        },
        "concept": "Value Trap", "xpReward": 75
    },
    {
        "id": 4, "title": "Asian Paints — The Boring Millionaire", "date": "January 2004",
        "era": "2004", "description": "Asian Paints at 38 rupees. Boring paint company. Not exciting. Not in the news. Buy?",
        "stock": "ASIANPAINT", "startPrice": 38, "endPrice": 2800, "endDate": "2024",
        "choices": [
            {"id": "buy", "label": "Buy and HOLD", "emoji": "💪"},
            {"id": "skip", "label": "Skip — too boring", "emoji": "😴"}
        ],
        "outcomes": {
            "buy": {"result": "10,000 became 7,36,842 over 20 years", "finalAmount": 736842, "isWin": True, "lesson": "The most boring businesses with pricing power and strong moats create extraordinary wealth."},
            "skip": {"result": "You missed a 73x return over 20 years looking for excitement elsewhere.", "finalAmount": 10000, "isWin": False, "lesson": "Exciting stocks make for exciting stories. Boring stocks make for wealthy investors."}
        },
        "concept": "Long-term Compounding and Moats", "xpReward": 100
    }
]

@router.get("/scenarios")
async def get_scenarios():
    attempts = read_json("time_machine_attempts.json")
    if not isinstance(attempts, list): attempts = []
    
    completed_scenarios = {a["scenarioId"]: True for a in attempts}
    
    enriched = []
    for s in SCENARIOS_STATIC:
        s_copy = dict(s)
        s_copy["completed"] = completed_scenarios.get(s["id"], False)
        enriched.append(s_copy)
        
    return enriched

@router.post("/attempt")
async def register_attempt(request: TimeMachineAttemptRequest):
    attempts = read_json("time_machine_attempts.json")
    if not isinstance(attempts, list): attempts = []
    
    existing = next((a for a in attempts if a["scenarioId"] == request.scenarioId), None)
    
    scenario = next((s for s in SCENARIOS_STATIC if s["id"] == request.scenarioId), None)
    if not scenario:
        return {"error": "Scenario not found"}
        
    outcome = scenario["outcomes"].get(request.choice)
    if not outcome:
        return {"error": "Invalid choice"}
        
    if existing:
        return {
            "outcome": outcome,
            "xpAwarded": 0,
            "alreadyAttempted": True
        }
        
    new_attempt = {
        "scenarioId": request.scenarioId,
        "choice": request.choice,
        "isWin": outcome["isWin"],
        "xpAwarded": scenario["xpReward"]
    }
    attempts.append(new_attempt)
    write_json("time_machine_attempts.json", attempts)
    
    update_user_xp(scenario["xpReward"])
    record_activity_and_update_streak()
    
    return {
        "outcome": outcome,
        "xpAwarded": scenario["xpReward"],
        "alreadyAttempted": False
    }

@router.get("/score")
async def get_score():
    attempts = read_json("time_machine_attempts.json")
    if not isinstance(attempts, list): attempts = []
    
    total_xp = sum(a.get("xpAwarded", 0) for a in attempts)
    
    return {
        "totalAttempts": len(attempts),
        "totalXpEarned": total_xp,
        "attempts": attempts
    }
