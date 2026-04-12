from fastapi import APIRouter
from services.db import read_json, write_json
from services.ai_service import get_reactive_mentor_insight, call_groq, generate_loss_debrief
from models.schemas import MentorInsightRequest, LossDebriefRequest
import json
from datetime import datetime, timezone
import asyncio
from services.stock_service import get_stock_price

router = APIRouter()

@router.post("/mentor")
async def ai_mentor(request: MentorInsightRequest):
    user_data = read_json("user.json")
    holdings = read_json("holdings.json")
    if not isinstance(holdings, list): holdings = []
    
    virtual_cash = user_data.get("virtualCash", 0.0)
    total_invested = sum([h.get("quantity", 0) * h.get("avgBuyPrice", 0) for h in holdings])
    
    portfolio_context = {
        "holdings": holdings,
        "virtualCash": virtual_cash,
        "totalPortfolioValue": total_invested + virtual_cash,
        "diversityScore": 10 
    }
    
    insight = await get_reactive_mentor_insight(request.action, request.symbol, portfolio_context)
    
    logs = read_json("ai_mentor_logs.json")
    if not isinstance(logs, list): logs = []
    
    logs.append({
        "trigger": request.action,
        "symbol": request.symbol,
        "response": insight,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    write_json("ai_mentor_logs.json", logs)
    
    return {
        "insight": insight,
        "action": request.action,
        "symbol": request.symbol
    }

@router.post("/loss-debrief")
async def loss_debrief(request: LossDebriefRequest):
    user_data = read_json("user.json")
    holdings = read_json("holdings.json")
    if not isinstance(holdings, list): holdings = []
    
    stock_sym = request.stockSymbol
    target_h = next((h for h in holdings if h["stockSymbol"] == stock_sym.upper()), None)
    stock_name = target_h["companyName"] if target_h else stock_sym
    
    total_invested = sum([h.get("quantity", 0) * h.get("avgBuyPrice", 0) for h in holdings])
    portfolio_value = total_invested + user_data.get("virtualCash", 0.0)
    
    debrief = await generate_loss_debrief(
        request.lossAmount, 
        stock_sym.upper(),
        stock_name,
        holdings,
        portfolio_value
    )
    
    debriefs = read_json("loss_debriefs.json")
    if not isinstance(debriefs, list): debriefs = []
    
    debriefs_with_ts = {**debrief, "timestamp": datetime.now(timezone.utc).isoformat()}
    debriefs.append(debriefs_with_ts)
    write_json("loss_debriefs.json", debriefs)
    
    return debrief

@router.post("/analyze-portfolio")
async def analyze_portfolio():
    user_data = read_json("user.json")
    holdings = read_json("holdings.json")
    if not isinstance(holdings, list): holdings = []
    
    tasks = [get_stock_price(h["stockSymbol"]) for h in holdings]
    prices = await asyncio.gather(*tasks, return_exceptions=True)
    price_map = {p["symbol"]: p for p in prices if isinstance(p, dict) and "symbol" in p}
    
    total_invested = 0
    total_current = 0
    sector_counts = {}
    biggest_winner = None
    biggest_loser = None
    max_pnl = float('-inf')
    min_pnl = float('inf')
    
    for h in holdings:
        c_price = price_map.get(h["stockSymbol"], {}).get("currentPrice", h["avgBuyPrice"])
        val = h["quantity"] * c_price
        inv = h["quantity"] * h["avgBuyPrice"]
        pnl = val - inv
        
        total_invested += inv
        total_current += val
        
        sec = h.get("sector", "Unknown")
        sector_counts[sec] = sector_counts.get(sec, 0) + 1
        
        if pnl > max_pnl:
            max_pnl = pnl
            biggest_winner = h["stockSymbol"]
        if pnl < min_pnl:
            min_pnl = pnl
            biggest_loser = h["stockSymbol"]
            
    cash = user_data.get("virtualCash", 0.0)
    
    system_prompt = """You are a portfolio analyst speaking to a young Indian beginner investor. Be encouraging but honest. Hinglish welcome. Under 150 words total."""
    
    user_msg = f"""
Evaluate this portfolio and return ONLY a JSON response:
{{
  "overallVerdict": "one line summary of the portfolio health",
  "diversificationFeedback": "comment on spread across sectors",
  "riskFeedback": "is this portfolio appropriate for a beginner?",
  "topSuggestion": "one specific actionable improvement",
  "encouragement": "genuine closing note"
}}

Portfolio Context:
- Cash Remaining: ₹{cash:.2f}
- Total Current Value: ₹{total_current:.2f}
- Sectors present: {list(sector_counts.keys())}
- Biggest Winner: {biggest_winner}
- Biggest Loser: {biggest_loser}
"""
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_msg}
    ]
    
    response_str = await call_groq(messages, max_tokens=300)
    
    try:
        clean_json = response_str.strip()
        if clean_json.startswith("```"):
            lines = clean_json.splitlines()
            if lines[0].startswith("```"): lines = lines[1:]
            if lines and lines[-1].startswith("```"): lines = lines[:-1]
            clean_json = "\n".join(lines).strip()
            
        parsed_dict = json.loads(clean_json)
    except Exception as e:
        parsed_dict = {
            "overallVerdict": "The portfolio looks like a solid starting point.",
            "diversificationFeedback": "Try to spread across a few more sectors to mitigate risk.",
            "riskFeedback": "A bit volatile, but okay for a young investor learning the ropes.",
            "topSuggestion": "Keep learning the basics and don't YOLO all your cash.",
            "encouragement": "Stay patient — Rome wasn't built in a day!"
        }
        
    return parsed_dict

@router.get("/mentor-history")
async def mentor_history():
    logs = read_json("ai_mentor_logs.json")
    if not isinstance(logs, list): return []
    logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return logs[:10]
