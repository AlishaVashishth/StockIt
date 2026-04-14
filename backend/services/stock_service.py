import asyncio
from datetime import datetime, timedelta
import os
import httpx
import yfinance as yf
from typing import Optional

# UI and some clients send short codes; Finnhub/Yahoo paths use Yahoo-style period keys.
CHART_TIMEFRAME_ALIASES = {"1w": "1wk", "1m": "1mo", "3m": "3mo"}


def normalize_chart_timeframe(timeframe: Optional[str]) -> str:
    t = (timeframe or "1d").lower().strip()
    return CHART_TIMEFRAME_ALIASES.get(t, t)


STOCK_METADATA = {
    "RELIANCE": {
        "companyName": "Reliance Industries Ltd",
        "sector": "Energy & Telecom",
        "marketCap": "Large Cap",
        "riskLevel": "LOW-MEDIUM",
        "about": "Oil, telecom (Jio), and retail conglomerate — think of it as 3 massive companies in one stock"
    },
    "TCS": {
        "companyName": "Tata Consultancy Services",
        "sector": "Technology",
        "marketCap": "Large Cap",
        "riskLevel": "LOW",
        "about": "India's largest IT services company — powers banks, airlines, and governments worldwide"
    },
    "HDFCBANK": {
        "companyName": "HDFC Bank Ltd",
        "sector": "Banking",
        "marketCap": "Large Cap",
        "riskLevel": "LOW",
        "about": "India's largest private sector bank with 8000+ branches"
    },
    "INFY": {
        "companyName": "Infosys Ltd",
        "sector": "Technology",
        "marketCap": "Large Cap",
        "riskLevel": "LOW",
        "about": "Global IT services giant that turned Bangalore into India's Silicon Valley"
    },
    "SBIN": {
        "companyName": "State Bank of India",
        "sector": "Banking",
        "marketCap": "Large Cap",
        "riskLevel": "LOW-MEDIUM",
        "about": "India's largest public sector bank with strong retail and corporate reach"
    },
    "ICICIBANK": {
        "companyName": "ICICI Bank Ltd",
        "sector": "Banking",
        "marketCap": "Large Cap",
        "riskLevel": "LOW",
        "about": "Large private bank with broad loan book and strong digital banking growth"
    },
    "ITC": {
        "companyName": "ITC Ltd",
        "sector": "FMCG",
        "marketCap": "Large Cap",
        "riskLevel": "LOW",
        "about": "Diversified FMCG major with cigarettes, foods, hotels, and paperboards"
    },
    "HINDUNILVR": {
        "companyName": "Hindustan Unilever Ltd",
        "sector": "FMCG",
        "marketCap": "Large Cap",
        "riskLevel": "LOW",
        "about": "Consumer staples leader with strong household brands and stable cash flows"
    },
    "BHARTIARTL": {
        "companyName": "Bharti Airtel Ltd",
        "sector": "Telecom",
        "marketCap": "Large Cap",
        "riskLevel": "MEDIUM",
        "about": "Leading telecom operator with strong 4G/5G subscriber base in India"
    },
    "LT": {
        "companyName": "Larsen & Toubro Ltd",
        "sector": "Infrastructure",
        "marketCap": "Large Cap",
        "riskLevel": "MEDIUM",
        "about": "Engineering and infra heavyweight with long-term project execution pipeline"
    },
    "YESBANK": {
        "companyName": "Yes Bank Ltd",
        "sector": "Banking",
        "marketCap": "Small Cap",
        "riskLevel": "HIGH",
        "about": "Private bank that faced RBI moratorium in 2020 — still in recovery mode"
    },
    "ADANIPORTS": {
        "companyName": "Adani Ports & SEZ",
        "sector": "Infrastructure",
        "marketCap": "Large Cap",
        "riskLevel": "MEDIUM",
        "about": "India's largest port operator handling 30% of all cargo"
    },
    "AXISBANK": {
        "companyName": "Axis Bank Ltd",
        "sector": "Banking",
        "marketCap": "Large Cap",
        "riskLevel": "LOW-MEDIUM",
        "about": "Top private bank with strong retail lending and improving asset quality"
    },
    "KOTAKBANK": {
        "companyName": "Kotak Mahindra Bank Ltd",
        "sector": "Banking",
        "marketCap": "Large Cap",
        "riskLevel": "LOW",
        "about": "Conservative private bank known for solid balance sheet and steady growth"
    },
    "MARUTI": {
        "companyName": "Maruti Suzuki India Ltd",
        "sector": "Automobile",
        "marketCap": "Large Cap",
        "riskLevel": "MEDIUM",
        "about": "India's passenger vehicle leader with dominant market share in cars"
    },
    "ASIANPAINT": {
        "companyName": "Asian Paints Ltd",
        "sector": "Consumer",
        "marketCap": "Large Cap",
        "riskLevel": "LOW",
        "about": "Market leader in decorative paints with strong brand and distribution"
    },
    "BAJFINANCE": {
        "companyName": "Bajaj Finance Ltd",
        "sector": "Financial Services",
        "marketCap": "Large Cap",
        "riskLevel": "MEDIUM",
        "about": "Leading NBFC with broad consumer lending and digital financing products"
    },
    "TITAN": {
        "companyName": "Titan Company Ltd",
        "sector": "Consumer",
        "marketCap": "Large Cap",
        "riskLevel": "MEDIUM",
        "about": "Jewellery and watches major with strong retail brand presence"
    },
    "SUNPHARMA": {
        "companyName": "Sun Pharmaceutical Industries Ltd",
        "sector": "Pharmaceuticals",
        "marketCap": "Large Cap",
        "riskLevel": "LOW-MEDIUM",
        "about": "India's largest pharma company with global specialty portfolio"
    },
    "WIPRO": {
        "companyName": "Wipro Ltd",
        "sector": "Technology",
        "marketCap": "Large Cap",
        "riskLevel": "MEDIUM",
        "about": "Global IT services player focused on cloud, consulting, and enterprise tech"
    },
    "ULTRACEMCO": {
        "companyName": "UltraTech Cement Ltd",
        "sector": "Cement",
        "marketCap": "Large Cap",
        "riskLevel": "MEDIUM",
        "about": "India's largest cement manufacturer with nationwide capacity"
    },
    "POWERGRID": {
        "companyName": "Power Grid Corporation of India Ltd",
        "sector": "Utilities",
        "marketCap": "Large Cap",
        "riskLevel": "LOW",
        "about": "Largest electricity transmission utility in India with stable cash flows"
    },
    "NTPC": {
        "companyName": "NTPC Ltd",
        "sector": "Power",
        "marketCap": "Large Cap",
        "riskLevel": "LOW",
        "about": "India's largest power generation company with growing renewable mix"
    },
    "TATAPOWER": {
        "companyName": "Tata Power Company Ltd",
        "sector": "Power",
        "marketCap": "Large Cap",
        "riskLevel": "MEDIUM",
        "about": "Integrated power company spanning generation, distribution, and renewables"
    },
    "COALINDIA": {
        "companyName": "Coal India Ltd",
        "sector": "Mining",
        "marketCap": "Large Cap",
        "riskLevel": "MEDIUM",
        "about": "World's largest coal producer and a key supplier to India's power sector"
    },
    "ONGC": {
        "companyName": "Oil and Natural Gas Corporation Ltd",
        "sector": "Energy",
        "marketCap": "Large Cap",
        "riskLevel": "MEDIUM",
        "about": "State-run upstream oil and gas major with diversified exploration assets"
    },
    "INDUSINDBK": {
        "companyName": "IndusInd Bank Ltd",
        "sector": "Banking",
        "marketCap": "Large Cap",
        "riskLevel": "MEDIUM",
        "about": "Private sector bank with strong vehicle finance and consumer banking presence"
    },
    "BAJAJFINSV": {
        "companyName": "Bajaj Finserv Ltd",
        "sector": "Financial Services",
        "marketCap": "Large Cap",
        "riskLevel": "MEDIUM",
        "about": "Financial conglomerate with insurance, lending, and wealth businesses"
    },
    "HCLTECH": {
        "companyName": "HCL Technologies Ltd",
        "sector": "Technology",
        "marketCap": "Large Cap",
        "riskLevel": "LOW-MEDIUM",
        "about": "Large IT services exporter with strength in engineering and infrastructure services"
    },
    "TECHM": {
        "companyName": "Tech Mahindra Ltd",
        "sector": "Technology",
        "marketCap": "Large Cap",
        "riskLevel": "LOW-MEDIUM",
        "about": "Major IT services company with enterprise and telecom-focused digital transformation work"
    },
    "NESTLEIND": {
        "companyName": "Nestle India Ltd",
        "sector": "FMCG",
        "marketCap": "Large Cap",
        "riskLevel": "LOW",
        "about": "Premium consumer staples giant with strong food and nutrition brands in India"
    },
    "HEROMOTOCO": {
        "companyName": "Hero MotoCorp Ltd",
        "sector": "Automobile",
        "marketCap": "Large Cap",
        "riskLevel": "MEDIUM",
        "about": "Leading two-wheeler manufacturer with deep domestic distribution reach"
    },
    "BAJAJAUTO": {
        "companyName": "Bajaj Auto Ltd",
        "sector": "Automobile",
        "marketCap": "Large Cap",
        "riskLevel": "MEDIUM",
        "about": "Top motorcycle and three-wheeler exporter with strong margins"
    },
    "JSWSTEEL": {
        "companyName": "JSW Steel Ltd",
        "sector": "Metals",
        "marketCap": "Large Cap",
        "riskLevel": "MEDIUM",
        "about": "One of India's largest private steel producers with integrated operations"
    },
    "DRREDDY": {
        "companyName": "Dr Reddy's Laboratories Ltd",
        "sector": "Pharmaceuticals",
        "marketCap": "Large Cap",
        "riskLevel": "LOW-MEDIUM",
        "about": "Global pharma manufacturer with strong generics and specialty presence"
    },
    "BRITANNIA": {
        "companyName": "Britannia Industries Ltd",
        "sector": "FMCG",
        "marketCap": "Large Cap",
        "riskLevel": "LOW",
        "about": "Leading packaged foods player known for biscuits, dairy, and bakery portfolio"
    },
    "EICHERMOT": {
        "companyName": "Eicher Motors Ltd",
        "sector": "Automobile",
        "marketCap": "Large Cap",
        "riskLevel": "MEDIUM",
        "about": "Parent of Royal Enfield with premium motorcycle leadership and strong branding"
    },
    "PIDILITIND": {
        "companyName": "Pidilite Industries Ltd",
        "sector": "Chemicals",
        "marketCap": "Mid Cap",
        "riskLevel": "LOW-MEDIUM",
        "about": "Adhesives and construction chemicals leader with iconic consumer and industrial brands"
    },
    "DIXON": {
        "companyName": "Dixon Technologies (India) Ltd",
        "sector": "Electronics",
        "marketCap": "Mid Cap",
        "riskLevel": "MEDIUM-HIGH",
        "about": "Fast-growing electronics manufacturing services company in consumer and mobile segments"
    },
    "INDIGO": {
        "companyName": "InterGlobe Aviation Ltd",
        "sector": "Aviation",
        "marketCap": "Mid Cap",
        "riskLevel": "MEDIUM",
        "about": "India's largest airline operator with strong domestic market share"
    },
    "SUZLON": {
        "companyName": "Suzlon Energy Ltd",
        "sector": "Renewable Energy",
        "marketCap": "Small Cap",
        "riskLevel": "HIGH",
        "about": "Wind energy company with high-growth potential and higher volatility profile"
    },
    "RVNL": {
        "companyName": "Rail Vikas Nigam Ltd",
        "sector": "Infrastructure",
        "marketCap": "Small Cap",
        "riskLevel": "HIGH",
        "about": "Railway project execution PSU with cyclical order-flow driven performance"
    },
    "AAPL": {
        "companyName": "Apple Inc",
        "sector": "Technology",
        "marketCap": "Large Cap",
        "riskLevel": "LOW-MEDIUM",
        "about": "Global consumer tech leader known for iPhone, Mac, and services ecosystem"
    },
    "MSFT": {
        "companyName": "Microsoft Corp",
        "sector": "Technology",
        "marketCap": "Large Cap",
        "riskLevel": "LOW",
        "about": "Cloud and software giant behind Azure, Office, and enterprise platforms"
    }
}

FALLBACK_PRICES = {
    "RELIANCE": 2847.30,
    "TCS": 3421.55,
    "HDFCBANK": 1643.20,
    "INFY": 1482.10,
    "SBIN": 812.45,
    "ICICIBANK": 1254.30,
    "ITC": 428.20,
    "HINDUNILVR": 2485.70,
    "BHARTIARTL": 1432.90,
    "LT": 3621.15,
    "YESBANK": 24.15,
    "ADANIPORTS": 1247.80,
    "AXISBANK": 1184.20,
    "KOTAKBANK": 1752.40,
    "MARUTI": 12685.00,
    "ASIANPAINT": 2864.15,
    "BAJFINANCE": 7028.30,
    "TITAN": 3541.25,
    "SUNPHARMA": 1678.55,
    "WIPRO": 524.10,
    "ULTRACEMCO": 11435.70,
    "POWERGRID": 339.45,
    "NTPC": 386.60,
    "TATAPOWER": 438.35,
    "COALINDIA": 484.20,
    "ONGC": 305.80,
    "INDUSINDBK": 1489.10,
    "BAJAJFINSV": 1684.25,
    "HCLTECH": 1598.40,
    "TECHM": 1408.30,
    "NESTLEIND": 2448.55,
    "HEROMOTOCO": 4754.20,
    "BAJAJAUTO": 9528.70,
    "JSWSTEEL": 928.40,
    "DRREDDY": 6712.15,
    "BRITANNIA": 5518.90,
    "EICHERMOT": 4665.60,
    "PIDILITIND": 2995.75,
    "DIXON": 12148.20,
    "INDIGO": 4486.35,
    "SUZLON": 58.40,
    "RVNL": 382.10,
    "AAPL": 215.40,
    "MSFT": 426.15,
    # Legacy symbol fallbacks for old user holdings
    "TATAMOTORS": 924.45,
    "ZOMATO": 182.30
}

FINNHUB_SYMBOL_MAP = {
    "RELIANCE": "RELIANCE.NS",
    "TCS": "TCS.NS",
    "HDFCBANK": "HDFCBANK.NS",
    "INFY": "INFY.NS",
    "SBIN": "SBIN.NS",
    "ICICIBANK": "ICICIBANK.NS",
    "ITC": "ITC.NS",
    "HINDUNILVR": "HINDUNILVR.NS",
    "BHARTIARTL": "BHARTIARTL.NS",
    "LT": "LT.NS",
    "YESBANK": "YESBANK.NS",
    "ADANIPORTS": "ADANIPORTS.NS",
    "AXISBANK": "AXISBANK.NS",
    "KOTAKBANK": "KOTAKBANK.NS",
    "MARUTI": "MARUTI.NS",
    "ASIANPAINT": "ASIANPAINT.NS",
    "BAJFINANCE": "BAJFINANCE.NS",
    "TITAN": "TITAN.NS",
    "SUNPHARMA": "SUNPHARMA.NS",
    "WIPRO": "WIPRO.NS",
    "ULTRACEMCO": "ULTRACEMCO.NS",
    "POWERGRID": "POWERGRID.NS",
    "NTPC": "NTPC.NS",
    "TATAPOWER": "TATAPOWER.NS",
    "COALINDIA": "COALINDIA.NS",
    "ONGC": "ONGC.NS",
    "INDUSINDBK": "INDUSINDBK.NS",
    "BAJAJFINSV": "BAJAJFINSV.NS",
    "HCLTECH": "HCLTECH.NS",
    "TECHM": "TECHM.NS",
    "NESTLEIND": "NESTLEIND.NS",
    "HEROMOTOCO": "HEROMOTOCO.NS",
    "BAJAJAUTO": "BAJAJ-AUTO.NS",
    "JSWSTEEL": "JSWSTEEL.NS",
    "DRREDDY": "DRREDDY.NS",
    "BRITANNIA": "BRITANNIA.NS",
    "EICHERMOT": "EICHERMOT.NS",
    "PIDILITIND": "PIDILITIND.NS",
    "DIXON": "DIXON.NS",
    "INDIGO": "INDIGO.NS",
    "SUZLON": "SUZLON.NS",
    "RVNL": "RVNL.NS",
    "AAPL": "AAPL",
    "MSFT": "MSFT",
    # Legacy support for existing holdings
    "TATAMOTORS": "TATAMOTORS.NS",
    "ZOMATO": "ETERNAL.NS"
}

YAHOO_SYMBOL_CANDIDATES = {
    "SBIN": ["SBIN.NS"],
    "ICICIBANK": ["ICICIBANK.NS"],
    "ITC": ["ITC.NS"],
    "HINDUNILVR": ["HINDUNILVR.NS"],
    "BHARTIARTL": ["BHARTIARTL.NS"],
    "LT": ["LT.NS"],
    "RELIANCE": ["RELIANCE.NS"],
    "TCS": ["TCS.NS"],
    "HDFCBANK": ["HDFCBANK.NS"],
    "INFY": ["INFY.NS"],
    "YESBANK": ["YESBANK.NS"],
    "ADANIPORTS": ["ADANIPORTS.NS"],
    "AXISBANK": ["AXISBANK.NS"],
    "KOTAKBANK": ["KOTAKBANK.NS"],
    "MARUTI": ["MARUTI.NS"],
    "ASIANPAINT": ["ASIANPAINT.NS"],
    "BAJFINANCE": ["BAJFINANCE.NS"],
    "TITAN": ["TITAN.NS"],
    "SUNPHARMA": ["SUNPHARMA.NS"],
    "WIPRO": ["WIPRO.NS"],
    "ULTRACEMCO": ["ULTRACEMCO.NS"],
    "POWERGRID": ["POWERGRID.NS"],
    "NTPC": ["NTPC.NS"],
    "TATAPOWER": ["TATAPOWER.NS"],
    "COALINDIA": ["COALINDIA.NS"],
    "ONGC": ["ONGC.NS"],
    "INDUSINDBK": ["INDUSINDBK.NS"],
    "BAJAJFINSV": ["BAJAJFINSV.NS"],
    "HCLTECH": ["HCLTECH.NS"],
    "TECHM": ["TECHM.NS"],
    "NESTLEIND": ["NESTLEIND.NS"],
    "HEROMOTOCO": ["HEROMOTOCO.NS"],
    "BAJAJAUTO": ["BAJAJ-AUTO.NS"],
    "JSWSTEEL": ["JSWSTEEL.NS"],
    "DRREDDY": ["DRREDDY.NS"],
    "BRITANNIA": ["BRITANNIA.NS"],
    "EICHERMOT": ["EICHERMOT.NS"],
    "PIDILITIND": ["PIDILITIND.NS"],
    "DIXON": ["DIXON.NS"],
    "INDIGO": ["INDIGO.NS"],
    "SUZLON": ["SUZLON.NS"],
    "RVNL": ["RVNL.NS"],
    "AAPL": ["AAPL"],
    "MSFT": ["MSFT"],
    # Legacy support for existing holdings
    "TATAMOTORS": ["TATAMOTORS.NS"],
    "ZOMATO": ["ETERNAL.NS", "ZOMATO.NS"]
}

INDEX_SYMBOLS = {
    "NIFTY": "^NSEI",
    "SENSEX": "^BSESN"
}

GLOBAL_MARKET_SYMBOLS = [
    {"key": "sp500", "name": "S&P 500 (SPY)", "symbols": ["SPY"]},
    {"key": "nasdaq100", "name": "Nasdaq 100 (QQQ)", "symbols": ["QQQ"]},
    {"key": "dow30", "name": "Dow 30 (DIA)", "symbols": ["DIA"]},
    {"key": "russell2000", "name": "Russell 2000 (IWM)", "symbols": ["IWM"]},
    {"key": "apple", "name": "Apple", "symbols": ["AAPL"]},
    {"key": "microsoft", "name": "Microsoft", "symbols": ["MSFT"]},
    {"key": "nvidia", "name": "NVIDIA", "symbols": ["NVDA"]},
    {"key": "tesla", "name": "Tesla", "symbols": ["TSLA"]},
    {"key": "amazon", "name": "Amazon", "symbols": ["AMZN"]},
    {"key": "gold", "name": "Gold (XAU/USD)", "symbols": ["OANDA:XAU_USD"]},
    {"key": "silver", "name": "Silver (XAG/USD)", "symbols": ["OANDA:XAG_USD"]},
    {"key": "bitcoinUsd", "name": "Bitcoin USD", "symbols": ["BINANCE:BTCUSDT"]},
]

# Symbols that should skip Yahoo fallback due to persistent failures.
# Keep this empty unless a symbol is verified to be consistently broken.
YAHOO_UNSTABLE_SYMBOLS = set()

def _candidate_symbols(symbol: str) -> list:
    return YAHOO_SYMBOL_CANDIDATES.get(symbol, [f"{symbol}.NS"])

async def get_stock_price(symbol: str) -> dict:
    meta = STOCK_METADATA.get(symbol, {})
    company_name = meta.get("companyName", symbol)
    sector = meta.get("sector", "Unknown")
    risk_level = meta.get("riskLevel", "Unknown")
    market_cap = meta.get("marketCap", "Unknown")
    about = meta.get("about", "No description available.")
    
    fallback_price = FALLBACK_PRICES.get(symbol, 100.0)
    finnhub_api_key = os.getenv("FINNHUB_API_KEY")

    if finnhub_api_key:
        finnhub_symbol = FINNHUB_SYMBOL_MAP.get(symbol, _candidate_symbols(symbol)[0])
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                quote_res, profile_res = await asyncio.gather(
                    client.get("https://finnhub.io/api/v1/quote", params={"symbol": finnhub_symbol, "token": finnhub_api_key}),
                    client.get("https://finnhub.io/api/v1/stock/profile2", params={"symbol": finnhub_symbol, "token": finnhub_api_key})
                )

            quote = quote_res.json() if quote_res.status_code == 200 else {}
            profile = profile_res.json() if profile_res.status_code == 200 else {}

            current_price = float(quote.get("c") or 0.0)
            prev_close = float(quote.get("pc") or 0.0)
            day_high = float(quote.get("h") or current_price)
            day_low = float(quote.get("l") or current_price)

            if current_price > 0 and prev_close > 0:
                change = current_price - prev_close
                change_pct = (change / prev_close) * 100
                return {
                    "symbol": symbol,
                    "name": profile.get("name") or company_name,
                    "companyName": profile.get("name") or company_name,
                    "currentPrice": round(current_price, 2),
                    "previousClose": round(prev_close, 2),
                    "change": round(change, 2),
                    "changePct": round(change_pct, 2),
                    "changePercent": round(change_pct, 2),
                    "dayHigh": round(day_high, 2),
                    "dayLow": round(day_low, 2),
                    "volume": 0,
                    "marketCap": market_cap,
                    "sector": sector,
                    "riskLevel": risk_level,
                    "about": about
                }
        except Exception:
            pass
    
    # Skip Yahoo fallback for unstable legacy symbols to avoid repeated stderr noise.
    if symbol in YAHOO_UNSTABLE_SYMBOLS:
        prev_close = fallback_price * 0.99
        current_price = fallback_price
        change = current_price - prev_close
        change_pct = ((current_price - prev_close) / prev_close) * 100
        return {
            "symbol": symbol,
            "name": company_name,
            "companyName": company_name,
            "currentPrice": round(current_price, 2),
            "previousClose": round(prev_close, 2),
            "change": round(change, 2),
            "changePct": round(change_pct, 2),
            "changePercent": round(change_pct, 2),
            "dayHigh": round(current_price * 1.01, 2),
            "dayLow": round(current_price * 0.98, 2),
            "volume": 0,
            "marketCap": market_cap,
            "sector": sector,
            "riskLevel": risk_level,
            "about": about
        }

    try:
        def fetch_yf():
            for candidate in _candidate_symbols(symbol):
                ticker = yf.Ticker(candidate)
                hist = ticker.history(period="2d")
                if hist is not None and not hist.empty:
                    return ticker, hist
            return None, None

        ticker, hist = await asyncio.to_thread(fetch_yf)
        if hist is None or hist.empty:
            raise Exception("No historical data returned from yfinance")

        fast_info = {}
        try:
            fast_info = dict(getattr(ticker, "fast_info", {}) or {})
        except Exception:
            fast_info = {}

        current_price = fast_info.get("lastPrice")
        if current_price is None:
            current_price = float(hist['Close'].iloc[-1])

        prev_close = fast_info.get("previousClose")
        if prev_close is None:
            prev_close = float(hist['Close'].iloc[-2]) if len(hist) >= 2 else current_price

        day_high = fast_info.get("dayHigh") or float(hist['High'].iloc[-1])
        day_low = fast_info.get("dayLow") or float(hist['Low'].iloc[-1])
        volume = fast_info.get("lastVolume") or int(hist['Volume'].iloc[-1])
        
        change = current_price - prev_close
        if prev_close != 0:
            change_pct = (change / prev_close) * 100
        else:
            change_pct = 0.0

        return {
            "symbol": symbol,
            "name": company_name,
            "companyName": company_name,
            "currentPrice": round(current_price, 2),
            "previousClose": round(prev_close, 2),
            "change": round(change, 2),
            "changePct": round(change_pct, 2),
            "changePercent": round(change_pct, 2),
            "dayHigh": round(day_high, 2),
            "dayLow": round(day_low, 2),
            "volume": int(volume),
            "marketCap": market_cap,
            "sector": sector,
            "riskLevel": risk_level,
            "about": about
        }
    except Exception:
        # Final fallback is stable (non-random) so UI never crashes.
        prev_close = fallback_price * 0.99
        current_price = fallback_price
        change = current_price - prev_close
        change_pct = ((current_price - prev_close) / prev_close) * 100
        return {
            "symbol": symbol,
            "name": company_name,
            "companyName": company_name,
            "currentPrice": round(current_price, 2),
            "previousClose": round(prev_close, 2),
            "change": round(change, 2),
            "changePct": round(change_pct, 2),
            "changePercent": round(change_pct, 2),
            "dayHigh": round(current_price * 1.01, 2),
            "dayLow": round(current_price * 0.98, 2),
            "volume": 0,
            "marketCap": market_cap,
            "sector": sector,
            "riskLevel": risk_level,
            "about": about
        }

async def get_all_stocks(limit: Optional[int] = None, offset: int = 0) -> list:
    symbols = list(STOCK_METADATA.keys())
    safe_offset = max(0, int(offset or 0))
    if limit is not None:
        safe_limit = max(0, int(limit))
        symbols = symbols[safe_offset:safe_offset + safe_limit]
    else:
        symbols = symbols[safe_offset:]
    tasks = [get_stock_price(sym) for sym in symbols]
    return list(await asyncio.gather(*tasks))

async def get_historical_data(symbol: str, period: str) -> list:
    period = normalize_chart_timeframe(period)

    interval_mapping = {
        "1d": "5m",
        "1wk": "1h",
        "1mo": "1d",
        "3mo": "1d",
        "1y": "1wk"
    }
    interval = interval_mapping.get(period, "1d")
    finnhub_api_key = os.getenv("FINNHUB_API_KEY")

    if finnhub_api_key:
        now = int(datetime.now().timestamp())
        lookback_seconds = {
            "1d": 60 * 60 * 24,
            "1wk": 60 * 60 * 24 * 7,
            "1mo": 60 * 60 * 24 * 30,
            "3mo": 60 * 60 * 24 * 90,
            "1y": 60 * 60 * 24 * 365
        }
        resolution_map = {
            # Optimization: fewer candles for intraday to reduce payload/latency.
            "1d": "15",
            "1wk": "60",
            "1mo": "D",
            "3mo": "D",
            "1y": "W"
        }
        finnhub_symbol = FINNHUB_SYMBOL_MAP.get(symbol, _candidate_symbols(symbol)[0])
        start_time = now - lookback_seconds.get(period, 60 * 60 * 24 * 30)

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(
                    "https://finnhub.io/api/v1/stock/candle",
                    params={
                        "symbol": finnhub_symbol,
                        "resolution": resolution_map.get(period, "D"),
                        "from": start_time,
                        "to": now,
                        "token": finnhub_api_key
                    }
                )
            data = res.json() if res.status_code == 200 else {}
            if data.get("s") == "ok":
                candles = []
                for i, ts in enumerate(data.get("t", [])):
                    candles.append({
                        "timestamp": datetime.fromtimestamp(ts).isoformat(),
                        "open": round(float(data["o"][i]), 2),
                        "high": round(float(data["h"][i]), 2),
                        "low": round(float(data["l"][i]), 2),
                        "close": round(float(data["c"][i]), 2),
                        "volume": int(data["v"][i])
                    })
                if candles:
                    return candles[-20:] if period == "1d" else candles
        except Exception:
            pass
    
    if symbol in YAHOO_UNSTABLE_SYMBOLS:
        fallback_price = FALLBACK_PRICES.get(symbol, 100.0)
        candles = []
        now = datetime.now()

        time_delta = timedelta(days=1)
        if interval == "5m":
            time_delta = timedelta(minutes=5)
        elif interval == "1h":
            time_delta = timedelta(hours=1)
        elif interval == "1wk":
            time_delta = timedelta(weeks=1)

        start_time = now - (time_delta * 30)
        for i in range(30):
            timestamp = start_time + (time_delta * i)
            candles.append({
                "timestamp": timestamp.isoformat(),
                "open": round(fallback_price, 2),
                "high": round(fallback_price, 2),
                "low": round(fallback_price, 2),
                "close": round(fallback_price, 2),
                "volume": 0
            })
        return candles[-20:] if period == "1d" else candles

    try:
        def fetch_hist():
            for candidate in _candidate_symbols(symbol):
                ticker = yf.Ticker(candidate)
                hist = ticker.history(period=period, interval=interval)
                if hist is not None and not hist.empty:
                    return hist
            return None
            
        hist = await asyncio.to_thread(fetch_hist)
        
        if hist is None or hist.empty:
            raise Exception("No data")
            
        candles = []
        for index, row in hist.iterrows():
            candles.append({
                "timestamp": index.isoformat(),
                "open": round(row['Open'], 2),
                "high": round(row['High'], 2),
                "low": round(row['Low'], 2),
                "close": round(row['Close'], 2),
                "volume": int(row['Volume'])
            })
        return candles[-20:] if period == "1d" else candles
    except Exception:
        # Final fallback: stable flat candles (not random/simulated trend)
        fallback_price = FALLBACK_PRICES.get(symbol, 100.0)
        
        candles = []
        now = datetime.now()
        
        time_delta = timedelta(days=1)
        if interval == "5m": time_delta = timedelta(minutes=5)
        elif interval == "1h": time_delta = timedelta(hours=1)
        elif interval == "1wk": time_delta = timedelta(weeks=1)
        
        start_time = now - (time_delta * 30)
        
        for i in range(30):
            timestamp = start_time + (time_delta * i)
            open_p = fallback_price
            close_p = fallback_price
            high_p = fallback_price
            low_p = fallback_price
            
            candles.append({
                "timestamp": timestamp.isoformat(),
                "open": round(open_p, 2),
                "high": round(high_p, 2),
                "low": round(low_p, 2),
                "close": round(close_p, 2),
                "volume": 0
            })
            
        return candles[-20:] if period == "1d" else candles

async def get_market_indices() -> dict:
    finnhub_api_key = os.getenv("FINNHUB_API_KEY")

    async def fetch_from_finnhub(name: str, candidates: list[str]):
        if not finnhub_api_key:
            return {"name": name, "value": 0.0, "change": 0.0, "changePct": 0.0}

        async with httpx.AsyncClient(timeout=8.0) as client:
            for symbol in candidates:
                try:
                    res = await client.get(
                        "https://finnhub.io/api/v1/quote",
                        params={"symbol": symbol, "token": finnhub_api_key}
                    )
                    if res.status_code != 200:
                        continue
                    quote = res.json() or {}
                    current = float(quote.get("c") or 0.0)
                    prev = float(quote.get("pc") or 0.0)
                    # Finnhub /quote: d = absolute change, dp = percent change (use when present)
                    raw_d = quote.get("d")
                    raw_dp = quote.get("dp")
                    if current <= 0:
                        continue
                    if raw_d is not None and raw_d != "":
                        change = float(raw_d)
                    elif prev > 0:
                        change = current - prev
                    else:
                        continue
                    if raw_dp is not None and raw_dp != "":
                        change_pct = float(raw_dp)
                    elif prev > 0:
                        change_pct = (change / prev) * 100
                    else:
                        change_pct = 0.0
                    return {
                        "name": name,
                        "value": round(current, 2),
                        "change": round(change, 2),
                        "changePct": round(change_pct, 2)
                    }
                except Exception:
                    continue

        return {"name": name, "value": 0.0, "change": 0.0, "changePct": 0.0}

    async def fetch_market_item(name: str, finnhub_symbols: list[str]):
        return await fetch_from_finnhub(name, finnhub_symbols)

    async def fetch_from_yahoo(name: str, yahoo_symbols: list[str]):
        try:
            def fetch():
                for symbol in yahoo_symbols:
                    hist = yf.Ticker(symbol).history(period="2d")
                    if hist is not None and not hist.empty:
                        current = float(hist["Close"].iloc[-1])
                        prev = float(hist["Close"].iloc[-2]) if len(hist) >= 2 else current
                        if current > 0 and prev > 0:
                            return current, prev
                return None
            result = await asyncio.to_thread(fetch)
            if not result:
                return {"name": name, "value": 0.0, "change": 0.0, "changePct": 0.0}
            current, prev = result
            change = current - prev
            change_pct = (change / prev) * 100 if prev else 0.0
            return {
                "name": name,
                "value": round(current, 2),
                "change": round(change, 2),
                "changePct": round(change_pct, 2)
            }
        except Exception:
            return {"name": name, "value": 0.0, "change": 0.0, "changePct": 0.0}

    nifty, sensex, *global_items = await asyncio.gather(
        fetch_market_item("NIFTY 50", ["^NSEI", "NSE:NIFTY", "NSE:NIFTY50-INDEX"]),
        fetch_market_item("SENSEX", ["^BSESN", "BSE:SENSEX"]),
        *[
            fetch_market_item(item["name"], item["symbols"])
            for item in GLOBAL_MARKET_SYMBOLS
        ]
    )

    nifty = nifty if nifty.get("value", 0) > 0 else None
    sensex = sensex if sensex.get("value", 0) > 0 else None
    global_items = [item for item in global_items if item.get("value", 0) > 0]

    # Accuracy fallback: if Finnhub cannot provide these core instruments,
    # use Yahoo for reliable index/metal values.
    if nifty is None:
        fallback_nifty = await fetch_from_yahoo("NIFTY 50", ["^NSEI"])
        nifty = fallback_nifty if fallback_nifty.get("value", 0) > 0 else None
    if sensex is None:
        fallback_sensex = await fetch_from_yahoo("SENSEX", ["^BSESN"])
        sensex = fallback_sensex if fallback_sensex.get("value", 0) > 0 else None

    has_gold = any("gold" in str(item.get("name", "")).lower() for item in global_items)
    has_silver = any("silver" in str(item.get("name", "")).lower() for item in global_items)

    if not has_gold:
        fallback_gold = await fetch_from_yahoo("Gold (XAU/USD)", ["GC=F", "XAUUSD=X"])
        if fallback_gold.get("value", 0) > 0:
            global_items.append(fallback_gold)
    if not has_silver:
        fallback_silver = await fetch_from_yahoo("Silver (XAG/USD)", ["SI=F", "XAGUSD=X"])
        if fallback_silver.get("value", 0) > 0:
            global_items.append(fallback_silver)

    return {
        "nifty": nifty,
        "sensex": sensex,
        "global": global_items
    }
