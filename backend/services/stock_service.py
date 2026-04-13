import asyncio
from datetime import datetime, timedelta
import os
import httpx
import yfinance as yf

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
    # Legacy support for existing holdings
    "TATAMOTORS": ["TATAMOTORS.NS"],
    "ZOMATO": ["ETERNAL.NS", "ZOMATO.NS"]
}

INDEX_SYMBOLS = {
    "NIFTY": "^NSEI",
    "SENSEX": "^BSESN"
}

# Some legacy symbols can intermittently fail on Yahoo in certain regions/setups.
# For these, prefer Finnhub or stable fallback pricing to avoid noisy repeated 404 logs.
YAHOO_UNSTABLE_SYMBOLS = {"TATAMOTORS"}

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

async def get_all_stocks() -> list:
    symbols = list(STOCK_METADATA.keys())
    tasks = [get_stock_price(sym) for sym in symbols]
    return list(await asyncio.gather(*tasks))

async def get_historical_data(symbol: str, period: str) -> list:
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
            "1d": "5",
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
                    return candles
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
        return candles

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
        return candles
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
            
        return candles

async def get_market_indices() -> dict:
    async def fetch_index(name: str, yf_symbol: str):
        try:
            def fetch():
                ticker = yf.Ticker(yf_symbol)
                hist = ticker.history(period="2d")
                return hist
            hist = await asyncio.to_thread(fetch)
            if hist is None or hist.empty:
                raise Exception("No data")
            current = float(hist["Close"].iloc[-1])
            prev = float(hist["Close"].iloc[-2]) if len(hist) >= 2 else current
            change = current - prev
            change_pct = (change / prev) * 100 if prev else 0.0
            return {
                "name": name,
                "value": round(current, 2),
                "change": round(change, 2),
                "changePct": round(change_pct, 2)
            }
        except Exception:
            return {
                "name": name,
                "value": 0.0,
                "change": 0.0,
                "changePct": 0.0
            }

    nifty, sensex = await asyncio.gather(
        fetch_index("NIFTY 50", INDEX_SYMBOLS["NIFTY"]),
        fetch_index("SENSEX", INDEX_SYMBOLS["SENSEX"])
    )
    return {"nifty": nifty, "sensex": sensex}
