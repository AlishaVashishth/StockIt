import os
import json
import httpx
import asyncio
from typing import Dict, Any, List
from dotenv import load_dotenv

_BACKEND_ROOT = os.path.dirname(os.path.dirname(__file__))
load_dotenv(os.path.join(_BACKEND_ROOT, ".env"))

async def call_groq(messages: List[Dict[str, str]], max_tokens: int = 300) -> str:
    groq_api_key = (os.getenv("GROQ_API_KEY", "") or "").strip()
    if not groq_api_key or groq_api_key.lower().startswith("your_"):
        raise RuntimeError("GROQ_API_KEY is missing. Cannot call Groq.")

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "openai/gpt-oss-120b",
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.8
    }
    print(f"[DEBUG] Sending this prompt to Groq: {messages}")
    async with httpx.AsyncClient() as client:
        for attempt in range(3):
            try:
                response = await client.post(url, headers=headers, json=payload, timeout=12.0)
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
            except httpx.HTTPStatusError as e:
                status = e.response.status_code if e.response else None
                if status == 429 and attempt < 2:
                    await asyncio.sleep(0.8 * (attempt + 1))
                    continue
                if status == 429:
                    raise RuntimeError("Groq rate limit reached. Please wait a few seconds and try again.")
                raise RuntimeError(f"Groq API request failed with status {status}.")
            except httpx.HTTPError as e:
                if attempt < 2:
                    await asyncio.sleep(0.8 * (attempt + 1))
                    continue
                raise RuntimeError(f"Groq API network error: {str(e)}")
    raise RuntimeError("Groq API request failed after retries.")

async def get_reactive_mentor_insight(action: str, symbol: str, portfolio_context: Dict[str, Any]) -> str:
    system_prompt = """
You are a precise stock analysis assistant for beginners in India.
Use ONLY the provided OHLCV and snapshot data, and tailor each answer to those numbers.
Never give generic boilerplate. Mention at least two concrete numeric references from the data.
Follow the requested response format exactly.
"""

    stock_snapshot = portfolio_context.get("stockSnapshot", {})
    historical_ohlcv = portfolio_context.get("historicalOhlcv", [])
    timeframe = portfolio_context.get("timeframe", "1d")
    stock_name = stock_snapshot.get("companyName") or stock_snapshot.get("name") or symbol.upper()
    ticker = stock_snapshot.get("symbol") or symbol.upper()

    formatted_rows: List[str] = []
    for row in historical_ohlcv:
        formatted_rows.append(
            "date={date}, open={open}, high={high}, low={low}, close={close}, volume={volume}".format(
                date=row.get("timestamp", ""),
                open=row.get("open", ""),
                high=row.get("high", ""),
                low=row.get("low", ""),
                close=row.get("close", ""),
                volume=row.get("volume", ""),
            )
        )
    history_block = "\n".join(formatted_rows) if formatted_rows else "No historical OHLCV data available."
    closes = [float(row.get("close", 0) or 0) for row in historical_ohlcv if row.get("close") is not None]
    highs = [float(row.get("high", 0) or 0) for row in historical_ohlcv if row.get("high") is not None]
    lows = [float(row.get("low", 0) or 0) for row in historical_ohlcv if row.get("low") is not None]
    volumes = [float(row.get("volume", 0) or 0) for row in historical_ohlcv if row.get("volume") is not None]

    price_change_pct = 0.0
    if len(closes) >= 2 and closes[0] != 0:
        price_change_pct = ((closes[-1] - closes[0]) / closes[0]) * 100

    stats_block = {
        "candlesCount": len(historical_ohlcv),
        "periodCloseChangePct": round(price_change_pct, 2),
        "periodHigh": round(max(highs), 2) if highs else None,
        "periodLow": round(min(lows), 2) if lows else None,
        "latestClose": round(closes[-1], 2) if closes else None,
        "averageVolume": round(sum(volumes) / len(volumes), 2) if volumes else None,
        "recentCloses": [round(v, 2) for v in closes[-5:]] if closes else []
    }

    user_msg = f"""
You are a stock market analyst helping a young beginner investor in India. Here is the recent price data for {stock_name} ({ticker}) in timeframe {timeframe}:
{history_block}

Latest snapshot:
{json.dumps(stock_snapshot, ensure_ascii=True)}

Derived stats for this exact request:
{json.dumps(stats_block, ensure_ascii=True)}

User action trigger: {action}

Analyze this data and give a response in exactly this format:
📊 TREND: Is the stock currently Bullish, Bearish, or Sideways? In one sentence, explain what the price movement shows.
✅ RECOMMENDATION: Should the user Buy, Sell, or Hold right now? State it clearly.
💡 WHY: In 2–3 simple sentences, explain why — reference actual price levels and movement from the data provided.
⚠️ RISK: In plain language, explain what could go wrong if the user follows this recommendation. Mention a rough percentage drop/gain if possible.
🔁 WHY NOT THE OPPOSITE: In 1–2 sentences, explain why the other option (Buy vs Sell) would be the worse choice right now.
Keep the total response under 150 words. Use simple language. No financial jargon. Write like you're explaining to a 20-year-old who is investing for the first time.
"""
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_msg}
    ]
    
    insight = await call_groq(messages, max_tokens=300)
    print(f"[AI_MENTOR] Groq response for {ticker} ({timeframe}): {insight}")
    return insight

async def generate_loss_debrief(loss_amount: float, stock_symbol: str, stock_name: str, holdings: list, portfolio_value: float) -> dict:
    items = []
    if loss_amount >= 500: items.append(f"{int(loss_amount/50)} cups of chai")
    if loss_amount >= 1000: items.append(f"{int(loss_amount/350)} movie tickets")
    if loss_amount >= 3000: items.append(f"{int(loss_amount/1500)} months of Spotify Premium")
    if loss_amount >= 10000: items.append("almost a new budget smartphone")
    if loss_amount >= 50000: items.append("a solid laptop")

    target_holding = next((h for h in holdings if h["stockSymbol"] == stock_symbol), None)
    concentration_pct = 0.0
    if target_holding and portfolio_value > 0:
        val = target_holding.get("currentValue", 0.0)
        concentration_pct = (val / portfolio_value) * 100

    system_prompt = """You are writing a Loss Debrief for a young Indian investor named Arjun (age ~22). He just lost money in the stock market. Write like his wise older friend who has been through market crashes — empathetic but educational. Hinglish is natural here. Reference Rakesh Jhunjhunwala, Vijay Kedia, or Warren Buffett where relevant. Never be preachy or lecture-y. Be warm, real, and end with genuine encouragement."""

    user_msg = f"""
Please generate a JSON response with these EXACT keys (no wrappers, just JSON):
{{
  "openingLine": "one empathetic opening line (not preachy)",
  "whatHappened": "2-3 sentences explaining WHY this stock fell, in simple terms",
  "smartInvestorLesson": "what Rakesh Jhunjhunwala or a seasoned investor would have done differently",
  "actionableLesson": "one specific thing Arjun can do differently next time",
  "encouragingClose": "genuine encouraging closing line that makes him want to try again"
}}

Context:
- Loss Amount: ₹{loss_amount:.2f}
- Stock Name: {stock_name} ({stock_symbol})
- Concentration: {concentration_pct:.1f}% of his portfolio was in this stock
- Real-life value of this loss: {", ".join(items)}
"""
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_msg}
    ]
    
    response_str = await call_groq(messages, max_tokens=600)
    
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
            "openingLine": "Market crashes sting, bhai. I've been there.",
            "whatHappened": "Sometimes stocks take a hit due to market sentiment or unexpected news, even if the business is solid.",
            "smartInvestorLesson": "Warren Buffett says 'Be fearful when others are greedy, and greedy when others are fearful.' Quality stocks bounce back.",
            "actionableLesson": "Next time, maybe we don't put so much in one basket. Keep some cash handy for dips.",
            "encouragingClose": "This is tuition fees for the market. You're learning the real game now. Let's rebuild!"
        }

    return {
        "aiContent": parsed_dict,
        "realLifeEquivalents": items,
        "lossAmount": loss_amount,
        "stockSymbol": stock_symbol,
        "concentrationPct": round(concentration_pct, 2)
    }
