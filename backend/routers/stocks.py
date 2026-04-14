from fastapi import APIRouter, Query
from services.stock_service import (
    get_all_stocks,
    get_stock_price,
    get_historical_data,
    get_market_indices,
    normalize_chart_timeframe,
)
from typing import Optional

router = APIRouter()

@router.get("")
async def get_stocks(limit: Optional[int] = Query(default=None, ge=1, le=100), offset: int = Query(default=0, ge=0)):
    return await get_all_stocks(limit=limit, offset=offset)

@router.get("/{symbol}")
async def get_single_stock(symbol: str):
    data = await get_stock_price(symbol.upper())
    return data

@router.get("/{symbol}/history")
async def get_stock_history(symbol: str, period: str = Query("1d")):
    data = await get_historical_data(symbol.upper(), normalize_chart_timeframe(period))
    return data

@router.get("/indices/live")
async def get_indices_live():
    return await get_market_indices()
