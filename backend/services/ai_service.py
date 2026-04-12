import os
import json
import httpx
from typing import Dict, Any, List

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

async def call_groq(messages: List[Dict[str, str]], max_tokens: int = 300) -> str:
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "openai/gpt-oss-120b",
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.8
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload, timeout=12.0)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"Groq API Error: {e}")
        return "The market is unpredictable today, mere dost. Let's take a deep breath and keep watching."

async def get_reactive_mentor_insight(action: str, symbol: str, portfolio_context: Dict[str, Any]) -> str:
    system_prompt = """You are Arjun's personal investment mentor — a wise, experienced Indian investor who speaks like a knowledgeable older friend. You notice patterns in Arjun's behavior and speak up proactively. You use Hinglish naturally (not forcefully). You are never preachy. You reference real Indian market events and investors. You keep responses SHORT — max 3 sentences. You always end with one sharp insight or question that makes Arjun think."""

    diversity_score = portfolio_context.get("diversityScore", 10)
    cash = portfolio_context.get("virtualCash", 0.0)
    total_portfolio = portfolio_context.get("totalPortfolioValue", 1)
    cash_pct = (cash / total_portfolio) * 100 if total_portfolio > 0 else 100
    
    situation_notes = ""
    if action == "BUY" and diversity_score < 5:
        situation_notes = "Note: Arjun's diversity score is low (< 5), mention concentration risk gently."
    elif action == "SELL":
        situation_notes = "Note: Ask if he sold strategically or panic-sold. Praise discipline if strategic."
    elif action == "VIEW":
        situation_notes = "Note: He's just viewing this stock. Perhaps suggest how it fits his portfolio gaps."
        
    if cash_pct < 20:
        situation_notes += " Also Note: Cash is running low (<20% of portfolio), proactively mention it."

    user_msg = f"""
Arjun just took the following action: {action} on stock {symbol}
Current Portfolio State:
- Cash remaining: ₹{cash:.2f} ({(cash_pct):.1f}% of total)
- Diversity Score: {diversity_score}/10
- Total PnL: {portfolio_context.get("totalPnlPct", 0.0)}%

{situation_notes}
React naturally to THIS specific action given THIS specific context.
"""
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_msg}
    ]
    
    insight = await call_groq(messages, max_tokens=150)
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
