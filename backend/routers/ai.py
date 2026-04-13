from fastapi import APIRouter
from services.db import read_json, write_json
from services.ai_service import get_reactive_mentor_insight, call_groq, generate_loss_debrief
from models.schemas import MentorInsightRequest, LossDebriefRequest
import json
from datetime import datetime, timezone
import asyncio
from services.stock_service import get_stock_price, get_historical_data

router = APIRouter()

@router.post("/mentor")
async def ai_mentor(request: MentorInsightRequest):
    print(
        f"[AI_MENTOR_ROUTE] request received symbol={request.symbol} "
        f"timeframe={request.timeframe} action={request.action} requestId={request.requestId}"
    )
    user_data = read_json("user.json")
    holdings = read_json("holdings.json")
    if not isinstance(holdings, list): holdings = []
    
    virtual_cash = user_data.get("virtualCash", 0.0)
    total_invested = sum([h.get("quantity", 0) * h.get("avgBuyPrice", 0) for h in holdings])
    
    stock_snapshot = await get_stock_price(request.symbol.upper())
    selected_period = (request.timeframe or "1d").lower()
    historical_ohlcv = await get_historical_data(request.symbol.upper(), selected_period)

    portfolio_context = {
        "holdings": holdings,
        "virtualCash": virtual_cash,
        "totalPortfolioValue": total_invested + virtual_cash,
        "diversityScore": 10,
        "stockSnapshot": stock_snapshot,
        "historicalOhlcv": historical_ohlcv,
        "timeframe": selected_period
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
    transactions = read_json("transactions.json")
    if not isinstance(transactions, list): transactions = []
    
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
    
    trade_rows = []
    for tx in sorted(transactions, key=lambda x: x.get("createdAt", "")):
        tx_type = tx.get("type", "UNKNOWN")
        symbol = tx.get("stockSymbol", "UNKNOWN")
        qty = tx.get("quantity", 0)
        price = float(tx.get("executionPrice") or tx.get("price") or 0.0)
        date = tx.get("createdAt", "")
        trade_rows.append({
            "type": tx_type,
            "symbol": symbol,
            "quantity": qty,
            "price": round(price, 2),
            "date": date,
            "totalAmount": round(float(tx.get("totalAmount") or 0.0), 2)
        })

    system_prompt = """You are an expert portfolio behavior coach for beginner stock traders in India.
Analyze the user's REAL transaction history and return ONLY JSON.
You must compare what the user did vs what an ideal disciplined trader would do.
Keep observations specific and data-grounded, not generic.
"""

    user_msg = f"""
Return ONLY valid JSON with these exact keys:
{{
  "observations": [
    "Specific behavior observation with symbol/date and consequence"
  ],
  "idealTraderComparison": [
    "What user did vs what ideal trader would do"
  ],
  "actionableTips": [
    "3 to 5 personalized action steps"
  ],
  "performanceSummary": "1 concise overall summary of the user's performance",
  "insight": "A readable plain-language paragraph that combines key observations + next best actions"
}}

Required analysis:
1) Identify concrete behavioral patterns from buys/sells and timing.
2) Include at least one 'panic sell / missed gain' style calculation WHEN data allows.
3) Compare actual actions vs ideal trader behavior.
4) Give 3-5 personalized actionable tips.
5) Include overall performance summary.

Portfolio context:
- Cash Remaining: ₹{cash:.2f}
- Total Current Value: ₹{total_current:.2f}
- Total Invested Cost Basis: ₹{total_invested:.2f}
- Total Unrealized PnL: ₹{(total_current - total_invested):.2f}
- Sector Split: {json.dumps(sector_counts, ensure_ascii=True)}
- Biggest Winner: {biggest_winner}
- Biggest Loser: {biggest_loser}

Full trade history (chronological):
{json.dumps(trade_rows, ensure_ascii=True)}
"""
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_msg}
    ]
    
    response_str = await call_groq(messages, max_tokens=900)
    
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
            "observations": [
                "Your transaction history is limited, so pattern confidence is low right now."
            ],
            "idealTraderComparison": [
                "You are still building your process; an ideal trader would define entry, exit, and risk before each order."
            ],
            "actionableTips": [
                "Set a max loss per trade before entering.",
                "Write one-line reason for every buy and review after 7 days.",
                "Avoid all-in exposure to a single stock early on."
            ],
            "performanceSummary": "Early-stage portfolio with room to improve process discipline.",
            "insight": "You are in the learning phase. Build a repeatable plan for entries, exits, and risk per trade, then review outcomes weekly to improve consistency."
        }
    if "insight" not in parsed_dict:
        observations = parsed_dict.get("observations", [])
        actionable = parsed_dict.get("actionableTips", [])
        summary = parsed_dict.get("performanceSummary", "")
        parsed_dict["insight"] = (
            f"{summary} "
            f"Key observation: {(observations[0] if observations else 'No clear behavior pattern detected yet.')}"
            f" Next step: {(actionable[0] if actionable else 'Define risk before every trade.')}"
        ).strip()
        
    return parsed_dict

@router.get("/mentor-history")
async def mentor_history():
    logs = read_json("ai_mentor_logs.json")
    if not isinstance(logs, list): return []
    logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return logs[:10]
