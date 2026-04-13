from fastapi import APIRouter
from services.db import read_json
from services.stock_service import get_stock_price
import asyncio
import random
from datetime import datetime, timezone

router = APIRouter()

@router.get("")
async def get_dashboard_summary():
    user = read_json("user.json")
    holdings = read_json("holdings.json")
    if not isinstance(holdings, list): holdings = []
    
    tasks = [get_stock_price(h["stockSymbol"]) for h in holdings]
    prices = await asyncio.gather(*tasks, return_exceptions=True)
    price_map = {p["symbol"]: p for p in prices if isinstance(p, dict) and "symbol" in p}
    
    total_invested = 0.0
    total_current_value = 0.0
    best_perf = None
    worst_perf = None
    max_pnl_pct = float('-inf')
    min_pnl_pct = float('inf')
    
    enriched_holdings = []
    
    for h in holdings:
        q = h["quantity"]
        abp = h["avgBuyPrice"]
        c_price = price_map.get(h["stockSymbol"], {}).get("currentPrice", abp)
        
        c_val = q * c_price
        inv = q * abp
        pnl = c_val - inv
        pnl_pct = (pnl / inv) * 100 if inv else 0.0
        
        total_invested += inv
        total_current_value += c_val
        
        enriched_holdings.append({**h, "currentValue": c_val})
        
        if pnl_pct > max_pnl_pct:
            max_pnl_pct = pnl_pct
            best_perf = {"symbol": h["stockSymbol"], "pnlPct": round(pnl_pct, 2)}
            
        if pnl_pct < min_pnl_pct:
            min_pnl_pct = pnl_pct
            worst_perf = {"symbol": h["stockSymbol"], "pnlPct": round(pnl_pct, 2)}
            
    v_cash = user.get("virtualCash", 0.0)
    total_pnl = total_current_value - total_invested
    total_pnl_pct = (total_pnl / total_invested) * 100 if total_invested else 0.0
    
    max_holding_val = max([h["currentValue"] for h in enriched_holdings], default=0.0)
    diversity_score = 10
    if total_current_value > 0:
        largest_pct = (max_holding_val / total_current_value) * 100
        if largest_pct > 50: diversity_score = 3
        elif largest_pct >= 30: diversity_score = 6
        elif largest_pct >= 20: diversity_score = 8
        
    portfolio_summary = {
        "totalValue": round(total_current_value + v_cash, 2),
        "totalPnl": round(total_pnl, 2),
        "totalPnlPct": round(total_pnl_pct, 2),
        "virtualCash": round(v_cash, 2),
        "holdingsCount": len(holdings),
        "bestPerformer": best_perf,
        "worstPerformer": worst_perf,
        "diversityScore": diversity_score
    }
    
    missions = read_json("missions.json")
    if not isinstance(missions, list): missions = []
    
    transactions = read_json("transactions.json")
    if not isinstance(transactions, list): transactions = []
    
    lessons = read_json("lessons.json")
    if not isinstance(lessons, list): lessons = []
    
    recent_activity = []
    txns_sorted = sorted(transactions, key=lambda x: x.get("createdAt", ""), reverse=True)[:5]
    for t in txns_sorted:
        recent_activity.append({
            "type": "TRADE",
            "description": f"{t['type']} {t['quantity']} {t['stockSymbol']}",
            "timestamp": t.get("createdAt", ""),
            "icon": "📈" if t["type"] == "BUY" else "📉"
        })
        
    lessons_completed = [l for l in lessons if l.get("completed")][:2]
    now = datetime.now(timezone.utc)
    from datetime import timedelta
    for i, l in enumerate(lessons_completed):
        mock_time = (now - timedelta(days=i)).strftime("%Y-%m-%dT%H:%M:%SZ")
        recent_activity.append({
            "type": "LESSON",
            "description": f"Completed Lesson {l.get('lessonId')} (Module {l.get('moduleId')})",
            "timestamp": mock_time,
            "icon": "🎓"
        })

    mission_events = [m for m in missions if m.get("completed") and m.get("completedAt")]
    for mission in mission_events:
        recent_activity.append({
            "type": "MISSION",
            "description": f"Mission Completed: {mission.get('title', 'Unknown mission')}",
            "timestamp": mission.get("completedAt", ""),
            "icon": "🎯"
        })
        
    recent_activity.sort(key=lambda x: x["timestamp"], reverse=True)
    
    today_int = int(now.strftime("%Y%m%d"))
    random.seed(today_int)
    daily_pnl_pct = round(random.uniform(-4.0, 4.0), 2)
    random.seed() 
    
    should_trigger_loss_debrief = bool(daily_pnl_pct < -3.0)
    
    return {
        "user": user,
        "portfolioSummary": portfolio_summary,
        "missions": missions,
        "recentActivity": recent_activity,
        "dailyPnlPct": daily_pnl_pct,
        "shouldTriggerLossDebrief": should_trigger_loss_debrief
    }
