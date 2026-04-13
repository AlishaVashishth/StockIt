from fastapi import APIRouter, HTTPException
from services.db import read_json, write_json
from services.stock_service import get_stock_price
from models.schemas import BuyTradeRequest, SellTradeRequest
import uuid
from datetime import datetime, timezone

router = APIRouter()

def _update_missions_after_trade() -> None:
    missions = read_json("missions.json")
    if not isinstance(missions, list):
        missions = []

    holdings = read_json("holdings.json")
    if not isinstance(holdings, list):
        holdings = []

    transactions = read_json("transactions.json")
    if not isinstance(transactions, list):
        transactions = []

    now = datetime.now(timezone.utc)
    changed = False

    first_mission = next((m for m in missions if m.get("missionKey") == "first_large_cap"), None)
    if first_mission and not first_mission.get("completed"):
        has_large_cap_buy = any(
            t.get("type") == "BUY" and t.get("marketCap") == "Large Cap"
            for t in transactions
        )
        if has_large_cap_buy:
            first_mission["completed"] = True
            first_mission["completedAt"] = now.strftime("%Y-%m-%dT%H:%M:%SZ")
            changed = True

    hold_mission = next((m for m in missions if m.get("missionKey") == "hold_3_days"), None)
    if hold_mission and not hold_mission.get("completed"):
        held_symbols = {h.get("stockSymbol") for h in holdings if h.get("quantity", 0) > 0}
        earliest_buy = None
        for t in transactions:
            if t.get("type") != "BUY" or t.get("stockSymbol") not in held_symbols:
                continue
            created_at = t.get("createdAt")
            if not created_at:
                continue
            try:
                tx_time = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                if earliest_buy is None or tx_time < earliest_buy:
                    earliest_buy = tx_time
            except ValueError:
                continue

        progress_days = 0
        if earliest_buy is not None:
            progress_days = max((now.date() - earliest_buy.date()).days, 0)

        total_days = int(hold_mission.get("total", 3))
        new_progress = min(progress_days, total_days)
        if hold_mission.get("progress") != new_progress:
            hold_mission["progress"] = new_progress
            changed = True

        if new_progress >= total_days:
            hold_mission["completed"] = True
            hold_mission["completedAt"] = now.strftime("%Y-%m-%dT%H:%M:%SZ")
            changed = True

    portfolio_mission = next((m for m in missions if m.get("missionKey") == "five_stock_portfolio"), None)
    if portfolio_mission:
        unlocked = bool(portfolio_mission.get("locked"))
        if unlocked and len(holdings) >= 1:
            portfolio_mission["locked"] = False
            changed = True

        if not portfolio_mission.get("completed"):
            if len(holdings) >= 5:
                portfolio_mission["completed"] = True
                portfolio_mission["completedAt"] = now.strftime("%Y-%m-%dT%H:%M:%SZ")
                portfolio_mission["progress"] = 5
                changed = True
            else:
                progress = len(holdings)
                if portfolio_mission.get("progress") != progress:
                    portfolio_mission["progress"] = progress
                    portfolio_mission["total"] = 5
                    changed = True

    if changed:
        write_json("missions.json", missions)

@router.post("/buy")
async def execute_buy(request: BuyTradeRequest):
    sym = request.stockSymbol.upper()
    qty = request.quantity
    
    if qty <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")
        
    live_data = await get_stock_price(sym)
    if not live_data or "currentPrice" not in live_data:
        raise HTTPException(status_code=400, detail="Stock data could not be retrieved")
        
    current_price = live_data["currentPrice"]
    company_name = live_data.get("companyName", sym)
    sector = live_data.get("sector", "")
    
    total_cost = qty * current_price
    
    user_data = read_json("user.json")
    if user_data.get("virtualCash", 0) < total_cost:
        raise HTTPException(status_code=400, detail="Insufficient virtual cash")
        
    user_data["virtualCash"] -= total_cost
    user_data["virtualCash"] = round(user_data["virtualCash"], 2)
    write_json("user.json", user_data)
    
    holdings = read_json("holdings.json")
    if not isinstance(holdings, list): holdings = []
    
    holding_found = False
    for h in holdings:
        if h["stockSymbol"] == sym:
            old_qty = h["quantity"]
            old_abp = h["avgBuyPrice"]
            total_invested = (old_qty * old_abp) + total_cost
            new_qty = old_qty + qty
            h["quantity"] = new_qty
            h["avgBuyPrice"] = round(total_invested / new_qty, 2)
            holding_found = True
            break
            
    if not holding_found:
        holdings.append({
            "id": str(uuid.uuid4()),
            "stockSymbol": sym,
            "companyName": company_name,
            "quantity": qty,
            "avgBuyPrice": round(current_price, 2),
            "sector": sector
        })
    write_json("holdings.json", holdings)
    
    transactions = read_json("transactions.json")
    if not isinstance(transactions, list): transactions = []
    
    new_txn = {
        "id": str(uuid.uuid4()),
        "stockSymbol": sym,
        "companyName": company_name,
        "marketCap": live_data.get("marketCap"),
        "type": "BUY",
        "quantity": qty,
        "price": current_price,
        "totalAmount": round(total_cost, 2),
        "createdAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    }
    transactions.append(new_txn)
    write_json("transactions.json", transactions)
    _update_missions_after_trade()
    
    return {
        "success": True,
        "message": f"Bought {qty} shares of {sym} at ₹{current_price:.2f}",
        "transaction": new_txn,
        "newCash": user_data["virtualCash"]
    }

@router.post("/sell")
async def execute_sell(request: SellTradeRequest):
    sym = request.stockSymbol.upper()
    qty = request.quantity
    
    if qty <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")
        
    holdings = read_json("holdings.json")
    if not isinstance(holdings, list): holdings = []
    
    target_holding = next((h for h in holdings if h["stockSymbol"] == sym), None)
    if not target_holding or target_holding["quantity"] < qty:
        raise HTTPException(status_code=400, detail="Insufficient shares")
        
    live_data = await get_stock_price(sym)
    if not live_data or "currentPrice" not in live_data:
        raise HTTPException(status_code=400, detail="Stock data could not be retrieved")
        
    current_price = live_data["currentPrice"]
    company_name = live_data.get("companyName", sym)
    
    total_proceeds = qty * current_price
    
    user_data = read_json("user.json")
    user_data["virtualCash"] += total_proceeds
    user_data["virtualCash"] = round(user_data["virtualCash"], 2)
    write_json("user.json", user_data)
    
    target_holding["quantity"] -= qty
    if target_holding["quantity"] == 0:
        holdings.remove(target_holding)
    write_json("holdings.json", holdings)
    
    transactions = read_json("transactions.json")
    if not isinstance(transactions, list): transactions = []
    
    new_txn = {
        "id": str(uuid.uuid4()),
        "stockSymbol": sym,
        "companyName": company_name,
        "marketCap": live_data.get("marketCap"),
        "type": "SELL",
        "quantity": qty,
        "price": current_price,
        "totalAmount": round(total_proceeds, 2),
        "createdAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    }
    transactions.append(new_txn)
    write_json("transactions.json", transactions)
    _update_missions_after_trade()
    
    return {
        "success": True,
        "message": f"Sold {qty} shares of {sym} at ₹{current_price:.2f}",
        "transaction": new_txn,
        "newCash": user_data["virtualCash"]
    }
