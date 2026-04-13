from fastapi import APIRouter
from services.db import read_json
from services.stock_service import get_stock_price
import asyncio

router = APIRouter()

@router.get("")
async def get_portfolio():
    user_data = read_json("user.json")
    holdings_data = read_json("holdings.json")
    transactions = read_json("transactions.json")
    
    if not isinstance(holdings_data, list):
        holdings_data = []
    if not isinstance(transactions, list):
        transactions = []

    virtual_cash = user_data.get("virtualCash", 0.0)
    
    tasks = [get_stock_price(h["stockSymbol"]) for h in holdings_data]
    prices = await asyncio.gather(*tasks, return_exceptions=True)
    
    price_map = {}
    for pb in prices:
        if isinstance(pb, dict) and "symbol" in pb:
            price_map[pb["symbol"]] = pb
            
    total_invested = 0.0
    total_current_value = 0.0
    
    enriched_holdings = []
    for h in holdings_data:
        sym = h["stockSymbol"]
        q = h["quantity"]
        abp = h["avgBuyPrice"]
        
        live_data = price_map.get(sym, {})
        current_price = live_data.get("currentPrice", abp)
        
        current_value = q * current_price
        pnl = current_value - (q * abp)
        if (q * abp) != 0:
            pnl_pct = (pnl / (q * abp)) * 100
        else:
            pnl_pct = 0.0
            
        total_invested += (q * abp)
        total_current_value += current_value
        
        enriched_holdings.append({
            **h,
            "currentPrice": round(current_price, 2),
            "currentValue": round(current_value, 2),
            "pnl": round(pnl, 2),
            "pnlPct": round(pnl_pct, 2)
        })
        
    total_portfolio_value = total_current_value + virtual_cash
    total_pnl = total_current_value - total_invested
    if total_invested != 0:
        total_pnl_pct = (total_pnl / total_invested) * 100
    else:
        total_pnl_pct = 0.0
        
    diversity_score = 10
    if total_current_value > 0:
        max_holding_val = max([h["currentValue"] for h in enriched_holdings], default=0.0)
        largest_pct = (max_holding_val / total_current_value) * 100
        
        if largest_pct > 50:
            diversity_score = 3
        elif largest_pct >= 30:
            diversity_score = 6
        elif largest_pct >= 20:
            diversity_score = 8
        else:
            diversity_score = 10
            
    return {
        "user": user_data,
        "holdings": enriched_holdings,
        "transactions": sorted(transactions, key=lambda x: x.get("createdAt", ""), reverse=True),
        "totalPortfolioValue": round(total_portfolio_value, 2),
        "totalPnl": round(total_pnl, 2),
        "totalPnlPct": round(total_pnl_pct, 2),
        "virtualCash": round(virtual_cash, 2),
        "diversityScore": diversity_score
    }

@router.get("/transactions")
async def get_transactions():
    transactions = read_json("transactions.json")
    if not isinstance(transactions, list):
        transactions = []
        
    transactions.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return transactions
