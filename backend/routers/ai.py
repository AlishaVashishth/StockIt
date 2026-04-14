from fastapi import APIRouter, HTTPException
from services.db import read_json, write_json
from services.ai_service import (
    get_reactive_mentor_insight,
    call_groq,
    generate_loss_debrief,
    is_mentor_placeholder,
)
from models.schemas import MentorInsightRequest, LossDebriefRequest, AnalyzePortfolioRequest
import json
from datetime import datetime, timezone
import asyncio
from services.stock_service import get_stock_price, get_historical_data, normalize_chart_timeframe
import time
from typing import Dict

router = APIRouter()

# Hard rate-limit guard for burst requests.
# Key: SYMBOL|TIMEFRAME -> {ts, response}
_mentor_recent: Dict[str, Dict[str, object]] = {}

@router.post("/mentor")
async def ai_mentor(request: MentorInsightRequest):
    action_upper = (request.action or "").strip().upper()
    print(
        f"[AI_MENTOR_ROUTE] request received symbol={request.symbol} "
        f"timeframe={request.timeframe} request_type={action_upper} requestId={request.requestId}"
    )
    user_data = read_json("user.json")
    holdings = read_json("holdings.json")
    if not isinstance(holdings, list): holdings = []
    
    virtual_cash = user_data.get("virtualCash", 0.0)
    total_invested = sum([h.get("quantity", 0) * h.get("avgBuyPrice", 0) for h in holdings])
    
    stock_snapshot = await get_stock_price(request.symbol.upper())
    selected_period = normalize_chart_timeframe(request.timeframe)
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

    # Sub-second debounce: VIEW only, and only when the last stored insight was real (never the placeholder).
    guard_key = f"{request.symbol.upper()}|{selected_period}"
    now_ts = time.time()
    if action_upper == "VIEW":
        prev = _mentor_recent.get(guard_key) or {}
        prev_ts = float(prev.get("ts", 0.0) or 0.0)
        if prev_ts > 0 and (now_ts - prev_ts) < 1.0:
            cached_resp = str(prev.get("response") or "").strip()
            if cached_resp and not is_mentor_placeholder(cached_resp):
                print(f"[AI_MENTOR_ROUTE] VIEW debounce hit guard_key={guard_key} (non-placeholder cache)")
                return {
                    "insight": cached_resp,
                    "error": None,
                    "action": request.action,
                    "symbol": request.symbol,
                }

    result = await get_reactive_mentor_insight(request.action, request.symbol, portfolio_context)
    insight = str(result.get("insight") or "")
    err = result.get("error")

    if not err and insight and not is_mentor_placeholder(insight):
        _mentor_recent[guard_key] = {"ts": now_ts, "response": insight}
        print(
            f"[AI_MENTOR_ROUTE] success request_type={action_upper} "
            f"insight_len={len(insight)} guard_key={guard_key}"
        )
    else:
        print(
            f"[AI_MENTOR_ROUTE] no short-term cache update request_type={action_upper} "
            f"error={bool(err)} insight_len={len(insight)} detail={err!r}"
        )

    logs = read_json("ai_mentor_logs.json")
    if not isinstance(logs, list): logs = []

    logs.append({
        "trigger": request.action,
        "symbol": request.symbol,
        "response": insight,
        "error": err,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    write_json("ai_mentor_logs.json", logs)

    return {
        "insight": insight,
        "error": err,
        "action": request.action,
        "symbol": request.symbol,
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
async def analyze_portfolio(request: AnalyzePortfolioRequest):
    print(f"[AI_PORTFOLIO_ROUTE] request received requestId={request.requestId}")
    user_data = read_json("user.json")
    holdings = read_json("holdings.json")
    if not isinstance(holdings, list): holdings = []
    transactions = read_json("transactions.json")
    if not isinstance(transactions, list): transactions = []
    
    symbols_from_holdings = {h.get("stockSymbol") for h in holdings if h.get("stockSymbol")}
    symbols_from_transactions = {t.get("stockSymbol") for t in transactions if t.get("stockSymbol")}
    all_symbols = sorted(list(symbols_from_holdings.union(symbols_from_transactions)))

    tasks = [get_stock_price(sym) for sym in all_symbols]
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
    
    tx_sorted = sorted(transactions, key=lambda x: x.get("createdAt", ""))
    trade_rows = []
    for tx in tx_sorted:
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

    behavior_events = []
    running_pos = {}
    for tx in tx_sorted:
        symbol = tx.get("stockSymbol")
        if not symbol:
            continue
        qty = float(tx.get("quantity") or 0.0)
        price = float(tx.get("executionPrice") or tx.get("price") or 0.0)
        tx_type = tx.get("type")
        created_at = tx.get("createdAt", "")
        if qty <= 0 or price <= 0:
            continue

        if symbol not in running_pos:
            running_pos[symbol] = {"qty": 0.0, "avgCost": 0.0}

        pos = running_pos[symbol]
        if tx_type == "BUY":
            new_qty = pos["qty"] + qty
            pos["avgCost"] = ((pos["qty"] * pos["avgCost"]) + (qty * price)) / new_qty if new_qty > 0 else price
            pos["qty"] = new_qty
        elif tx_type == "SELL":
            sold_qty = min(qty, pos["qty"]) if pos["qty"] > 0 else qty
            realized = (price - pos["avgCost"]) * sold_qty
            current_price = float(price_map.get(symbol, {}).get("currentPrice") or price)
            missed_if_held = (current_price - price) * sold_qty
            behavior_events.append({
                "date": created_at,
                "symbol": symbol,
                "soldQty": round(sold_qty, 2),
                "sellPrice": round(price, 2),
                "avgCost": round(pos["avgCost"], 2),
                "realizedPnl": round(realized, 2),
                "currentPriceNow": round(current_price, 2),
                "missedPnlIfHeldToNow": round(missed_if_held, 2)
            })
            pos["qty"] = max(pos["qty"] - sold_qty, 0.0)
            if pos["qty"] == 0:
                pos["avgCost"] = 0.0

    user_msg = f"""
You are an institutional-grade portfolio analyst helping a beginner investor.

Return EXACTLY in this structure:

CONCISE BULLETS:
- Snapshot: <1 line using concrete numbers from portfolio/trades>
- Key behavior: <1 line about user behavior pattern>
- Biggest risk: <1 line>
- Action plan: <3 short actionable bullets personalized to this user>
- Overall verdict: <1 line>

DETAILED:
<A deeper 4-paragraph explanation using trade dates, symbols, quantities, prices, behavior, risk, opportunity cost, and practical alternatives. Keep it clear and constructive.>

Rules:
- Concise bullets must be short and to the point.
- Use exact numbers and symbols from provided data.
- Mention at least one date from trade history if available.
- No jargon-heavy language.
- Detailed section target: ~170-240 words.
- Do not add extra headings beyond "CONCISE BULLETS:" and "DETAILED:".

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

Computed sell-behavior events:
{json.dumps(behavior_events, ensure_ascii=True)}
"""
    
    messages = [
        {"role": "system", "content": "You are a precise trading performance analyst. Use user data, not generic advice. Match the exact requested structure."},
        {"role": "user", "content": user_msg}
    ]

    try:
        response_str = await call_groq(messages, max_tokens=950)
    except RuntimeError as e:
        message = str(e)
        if "rate limit" in message.lower():
            raise HTTPException(status_code=429, detail=message)
        raise HTTPException(status_code=503, detail=message)

    insight_text = response_str.strip()
    if insight_text.startswith("```"):
        lines = insight_text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        insight_text = "\n".join(lines).strip()

    if not insight_text:
        insight_text = "No analysis generated. Please try again in a few seconds."

    return {
        "insight": insight_text,
        "requestId": request.requestId,
        "tradeCount": len(trade_rows)
    }

@router.get("/mentor-history")
async def mentor_history():
    logs = read_json("ai_mentor_logs.json")
    if not isinstance(logs, list): return []
    logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return logs[:10]
