import os
import json
import httpx
import asyncio
import time
from typing import Dict, Any, List, Optional, Tuple
from dotenv import load_dotenv

load_dotenv()

_GROQ_FALLBACK_TEXT = "Market data is loading. Please try again."


def is_mentor_placeholder(text: str) -> bool:
    """True for empty text or the legacy generic placeholder (never treat as a cache hit)."""
    s = (text or "").strip()
    return not s or s == _GROQ_FALLBACK_TEXT


MENTOR_CACHE_TTL_SECONDS = 120
_mentor_cache: Dict[str, Dict[str, Any]] = {}
_in_flight_mentor_requests: Dict[str, asyncio.Task] = {}
_mentor_request_lock = asyncio.Lock()

def _mentor_request_key(action: str, symbol: str, timeframe: str) -> str:
    return f"{(symbol or '').upper()}|{(timeframe or '').lower()}|{(action or '').upper()}"

def _get_cached_mentor_response(key: str) -> str:
    entry = _mentor_cache.get(key)
    if not entry:
        return ""
    timestamp = float(entry.get("timestamp", 0.0) or 0.0)
    if (time.time() - timestamp) > MENTOR_CACHE_TTL_SECONDS:
        _mentor_cache.pop(key, None)
        return ""
    resp = str(entry.get("response") or "").strip()
    if is_mentor_placeholder(resp):
        _mentor_cache.pop(key, None)
        return ""
    return resp

async def call_groq(messages: List[Dict[str, str]], max_tokens: int = 300) -> str:
    groq_api_key = (os.getenv("GROQ_API_KEY", "") or "").strip()
    if not groq_api_key or groq_api_key.lower().startswith("your_"):
        return _GROQ_FALLBACK_TEXT

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        # Use a Groq-supported chat model identifier.
        "model": os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.7,
    }
    print(f"[DEBUG] Sending this prompt to Groq: {messages}")
    async with httpx.AsyncClient() as client:
        for attempt in range(3):
            try:
                response = await client.post(url, headers=headers, json=payload, timeout=12.0)
                response.raise_for_status()
                data = response.json()
                content = (
                    (((data or {}).get("choices") or [{}])[0].get("message") or {}).get("content")
                    if isinstance(data, dict)
                    else None
                )
                content_str = (content or "").strip()
                # Some transient provider responses can be empty even with 200 OK.
                if not content_str:
                    if attempt < 2:
                        await asyncio.sleep(0.4 * (attempt + 1))
                        continue
                    return _GROQ_FALLBACK_TEXT
                return content_str
            except httpx.HTTPStatusError as e:
                status = e.response.status_code if e.response else None
                try:
                    body_preview = (e.response.text or "")[:500] if e.response else ""
                    print(f"[GROQ_ERROR] status={status} body_preview={body_preview}")
                except Exception:
                    pass
                if status == 429 and attempt < 2:
                    await asyncio.sleep(0.8 * (attempt + 1))
                    continue
                return _GROQ_FALLBACK_TEXT
            except httpx.HTTPError as e:
                if attempt < 2:
                    await asyncio.sleep(0.8 * (attempt + 1))
                    continue
                return _GROQ_FALLBACK_TEXT
            except Exception:
                if attempt < 2:
                    await asyncio.sleep(0.4 * (attempt + 1))
                    continue
                return _GROQ_FALLBACK_TEXT
    return _GROQ_FALLBACK_TEXT


async def call_groq_mentor(
    messages: List[Dict[str, str]], max_tokens: int = 950
) -> Tuple[Optional[str], Optional[str]]:
    """
    Mentor-specific Groq call: returns (content, error_message).
    Surfaces configuration and API failures to the caller instead of a silent placeholder.
    """
    groq_api_key = (os.getenv("GROQ_API_KEY", "") or "").strip()
    if not groq_api_key or groq_api_key.lower().startswith("your_"):
        print("[GROQ_MENTOR] FALLBACK_TRIGGER: GROQ_API_KEY missing or placeholder value")
        return None, "AI is not configured: set a valid GROQ_API_KEY in backend/.env."

    model = (os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile") or "").strip()
    if not model:
        print("[GROQ_MENTOR] FALLBACK_TRIGGER: GROQ_MODEL is empty")
        return None, "GROQ_MODEL is not set. Use a supported model id from Groq's documentation."

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.7,
    }
    print(f"[GROQ_MENTOR] request model={model!r} max_tokens={max_tokens} temperature=0.7")

    async def _post_once(client: httpx.AsyncClient) -> str:
        response = await client.post(url, headers=headers, json=payload, timeout=30.0)
        response.raise_for_status()
        data = response.json()
        content = (
            (((data or {}).get("choices") or [{}])[0].get("message") or {}).get("content")
            if isinstance(data, dict)
            else None
        )
        return (content or "").strip()

    last_err: Optional[str] = None
    async with httpx.AsyncClient() as client:
        for attempt in range(3):
            try:
                content_str = await _post_once(client)
                print(
                    f"[GROQ_MENTOR] raw response attempt={attempt + 1} chars={len(content_str)} "
                    f"preview={content_str[:700]!r}"
                )
                if content_str:
                    return content_str, None
                print(f"[GROQ_MENTOR] empty completion from Groq (attempt {attempt + 1}/3)")
                if attempt < 2:
                    await asyncio.sleep(0.45 * (attempt + 1))
                    continue
            except httpx.HTTPStatusError as e:
                status = e.response.status_code if e.response else None
                try:
                    body_preview = (e.response.text or "")[:400] if e.response else ""
                except Exception:
                    body_preview = ""
                last_err = f"HTTP {status}: {body_preview or str(e)}"
                print(f"[GROQ_MENTOR] FALLBACK_TRIGGER: {last_err!r}")
                if status == 429 and attempt < 2:
                    await asyncio.sleep(0.85 * (attempt + 1))
                    continue
                return None, (
                    "Groq API rejected the request. Check GROQ_API_KEY and that GROQ_MODEL is a "
                    f"currently supported model. ({last_err})"
                )
            except httpx.HTTPError as e:
                last_err = str(e)
                print(f"[GROQ_MENTOR] FALLBACK_TRIGGER: network {last_err!r}")
                if attempt < 2:
                    await asyncio.sleep(0.85 * (attempt + 1))
                    continue
                return None, f"Could not reach Groq: {last_err}"
            except Exception as e:
                last_err = str(e)
                print(f"[GROQ_MENTOR] FALLBACK_TRIGGER: unexpected {last_err!r}")
                if attempt < 2:
                    await asyncio.sleep(0.4 * (attempt + 1))
                    continue
                return None, f"Unexpected error calling Groq: {last_err}"

        try:
            await asyncio.sleep(0.6)
            content_str = await _post_once(client)
            print(
                f"[GROQ_MENTOR] raw response extra_retry chars={len(content_str)} "
                f"preview={content_str[:700]!r}"
            )
            if content_str:
                return content_str, None
        except httpx.HTTPStatusError as e:
            status = e.response.status_code if e.response else None
            try:
                body_preview = (e.response.text or "")[:400] if e.response else ""
            except Exception:
                body_preview = ""
            print(f"[GROQ_MENTOR] FALLBACK_TRIGGER extra_retry HTTP {status} {body_preview!r}")
            return None, f"Groq API error on retry (HTTP {status}). {body_preview or ''}"
        except Exception as e:
            print(f"[GROQ_MENTOR] FALLBACK_TRIGGER extra_retry {e!r}")
            return None, f"Groq error on final retry: {e}"

        print("[GROQ_MENTOR] FALLBACK_TRIGGER: empty response after all attempts")
        return None, "Groq returned an empty response after retries. Try again shortly."


async def _generate_reactive_mentor_insight(
    action: str, symbol: str, portfolio_context: Dict[str, Any]
) -> Tuple[str, Optional[str]]:
    system_prompt = """
You are a precise stock analysis assistant for beginners in India.
Use ONLY the provided OHLCV and snapshot data, and tailor each answer to those numbers.
Never give generic boilerplate. Mention at least two concrete numeric references from the data.
Follow the requested response format exactly.
If the data shows a different trend (up/down/flat), your recommendation and reasons must change accordingly.
"""

    stock_snapshot = portfolio_context.get("stockSnapshot", {})
    historical_ohlcv = portfolio_context.get("historicalOhlcv", []) or []
    timeframe = portfolio_context.get("timeframe", "1d")
    stock_name = stock_snapshot.get("companyName") or stock_snapshot.get("name") or symbol.upper()
    ticker = stock_snapshot.get("symbol") or symbol.upper()

    # Optimization: drastically reduce prompt size by using only the last 10 candles and summary stats.
    historical_ohlcv = historical_ohlcv[-10:]
    closes = [float(row.get("close", 0) or 0) for row in historical_ohlcv if row.get("close") is not None]
    highs = [float(row.get("high", 0) or 0) for row in historical_ohlcv if row.get("high") is not None]
    lows = [float(row.get("low", 0) or 0) for row in historical_ohlcv if row.get("low") is not None]

    price_change_pct = 0.0
    if len(closes) >= 2 and closes[0] != 0:
        price_change_pct = ((closes[-1] - closes[0]) / closes[0]) * 100

    summary_data = {
        "trend": f"{round(price_change_pct, 2)}%",
        "high": round(max(highs), 2) if highs else None,
        "low": round(min(lows), 2) if lows else None,
        "latestClose": round(closes[-1], 2) if closes else None,
        "recentCloses": [round(v, 2) for v in closes[-5:]] if closes else []
    }

    user_msg = f"""
You are a stock market analyst helping a young beginner investor in India.

Latest snapshot:
{json.dumps(stock_snapshot, ensure_ascii=True)}

Summary Data:
{json.dumps(summary_data, ensure_ascii=True)}

User action trigger: {action}

Analyze this data and return EXACTLY in this structure:

CONCISE BULLETS:
- Trend: <bullish/bearish/sideways in one short line with one numeric reference>
- Recommendation: <Buy/Sell/Hold only>
- Why: <one short line with numeric evidence>
- Risk: <one short line with approximate % risk>
- Why not opposite: <one short line>

DETAILED:
<A deeper explanation in 120-170 words, plain language, with numeric references from the provided data.>

Rules:
- Keep concise bullets very short and to the point.
- Use simple language. No jargon.
- Mention at least two concrete numbers from Summary Data (e.g., latestClose, high, low, trend%, recentCloses).
- Use the direction of trend% to drive your trend label and recommendation (don’t say “sideways” if trend is clearly positive/negative).
- Do not add extra headings beyond "CONCISE BULLETS:" and "DETAILED:".
"""
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_msg}
    ]

    insight, err = await call_groq_mentor(messages, max_tokens=950)
    if err:
        print(f"[AI_MENTOR] Groq failed ticker={ticker} timeframe={timeframe} action={action}: {err}")
        return "", err
    text = (insight or "").strip()
    print(f"[AI_MENTOR] Groq success ticker={ticker} timeframe={timeframe} action={action} len={len(text)}")
    return text, None


async def get_reactive_mentor_insight(
    action: str, symbol: str, portfolio_context: Dict[str, Any]
) -> Dict[str, Any]:
    timeframe = str(portfolio_context.get("timeframe", "1d") or "1d")
    req_key = _mentor_request_key(action, symbol, timeframe)
    action_upper = (action or "").strip().upper()

    # Manual refresh and trade hooks must bypass TTL cache; VIEW may reuse a recent good response.
    force_refresh = action_upper in {"REFRESH", "MANUAL", "BUY", "SELL"}
    if not force_refresh:
        cached = _get_cached_mentor_response(req_key)
        if cached:
            print(f"[AI_MENTOR] cache hit key={req_key} request_type=VIEW")
            return {"insight": cached, "error": None}

    async with _mentor_request_lock:
        if not force_refresh:
            cached_again = _get_cached_mentor_response(req_key)
            if cached_again:
                return {"insight": cached_again, "error": None}

        existing_task = _in_flight_mentor_requests.get(req_key)
        if existing_task:
            task_to_await = existing_task
        else:
            print(f"[AI_MENTOR] starting Groq task key={req_key} request_type={action_upper}")
            task_to_await = asyncio.create_task(
                _generate_reactive_mentor_insight(action, symbol, portfolio_context)
            )
            _in_flight_mentor_requests[req_key] = task_to_await

    try:
        insight_text, err = await task_to_await
        if err:
            print(f"[GROQ_MENTOR] FALLBACK_TRIGGER: pipeline key={req_key} type={action_upper} detail={err}")
            return {"insight": "", "error": err}
        if is_mentor_placeholder(insight_text):
            msg = "Insight text was empty after generation."
            print(f"[GROQ_MENTOR] FALLBACK_TRIGGER: placeholder-like result key={req_key}")
            return {"insight": "", "error": msg}
        _mentor_cache[req_key] = {"response": insight_text, "timestamp": time.time()}
        return {"insight": insight_text, "error": None}
    finally:
        async with _mentor_request_lock:
            current = _in_flight_mentor_requests.get(req_key)
            if current is task_to_await:
                _in_flight_mentor_requests.pop(req_key, None)

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
