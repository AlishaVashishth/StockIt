from fastapi import APIRouter, Query
from services.stock_service import get_all_stocks, get_stock_price, get_historical_data

router = APIRouter()

@router.get("")
async def get_stocks():
    return await get_all_stocks()

@router.get("/{symbol}")
async def get_single_stock(symbol: str):
    data = await get_stock_price(symbol.upper())
    return data

@router.get("/{symbol}/history")
async def get_stock_history(symbol: str, period: str = Query("1d")):
    data = await get_historical_data(symbol.upper(), period)
    return data
