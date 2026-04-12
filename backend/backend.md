# InvestSim — Complete Backend Build Guide
# FastAPI + yfinance + Groq AI + JSON Mock DB
# Execute each prompt one by one in Cursor / Antigravity

---

## MASTER CONTEXT (Read this before every prompt session)

```
App: InvestSim — Indian paper trading simulator (hackathon demo)
Backend: FastAPI (Python)
Frontend: React + Vite running on localhost:3000
AI: Groq API, model = openai/gpt-oss-120b
Market Data: yfinance
Database: JSON files in a /data folder (mock DB, no real DB)
Auth: None — single demo user hardcoded (Arjun Kumar)
Goal: Demo only — make it impressive, not production-safe

AI Features:
1. Reactive AI Mentor — watches every user action (buy, sell, loss, concentration)
   and returns a proactive contextual insight without being asked
2. Loss Debrief — when portfolio drops >3%, generates a deeply personal
   narrative with real-life rupee equivalents and what a smart investor would do

Color/Brand context for any text generation:
- App is Indian-focused, users are 18-25 year olds
- Tone: wise older friend, Hinglish is fine, never textbooky
- Accent color: saffron/gold. Green = profit. Red = loss.
```

---

## PROMPT 1 — Project Setup & Folder Structure

```
You are setting up a FastAPI backend for a React + Vite app called InvestSim.

MASTER CONTEXT:
App: InvestSim — Indian paper trading simulator (hackathon demo)
Backend: FastAPI (Python)
Frontend: React + Vite running on localhost:3000
AI: Groq API, model = qwen/qwen3-32b
Market Data: yfinance
Database: JSON files in a /data folder (mock DB)
Auth: None — single demo user (Arjun Kumar, id: "a1b2c3d4")

Do the following:

1. Create this exact folder structure:
   investsim-backend/
   ├── main.py
   ├── .env
   ├── .env.example
   ├── requirements.txt
   ├── data/
   │   ├── user.json
   │   ├── holdings.json
   │   ├── transactions.json
   │   ├── missions.json
   │   ├── lessons.json
   │   ├── time_machine_attempts.json
   │   └── loss_debriefs.json
   ├── routers/
   │   ├── __init__.py
   │   ├── user.py
   │   ├── portfolio.py
   │   ├── stocks.py
   │   ├── trades.py
   │   ├── ai.py
   │   ├── learn.py
   │   └── time_machine.py
   ├── services/
   │   ├── __init__.py
   │   ├── db.py         (JSON read/write helpers)
   │   ├── stock_service.py  (yfinance wrapper)
   │   └── ai_service.py     (Groq API wrapper)
   └── models/
       ├── __init__.py
       └── schemas.py    (Pydantic models)

2. Create requirements.txt with:
   fastapi
   uvicorn
   python-dotenv
   yfinance
   httpx
   pydantic

3. Create .env with:
   GROQ_API_KEY=your_groq_api_key_here
   FRONTEND_URL=http://localhost:3000

4. Create .env.example with the same keys but empty values.

5. Create main.py that:
   - Initializes FastAPI app with title "InvestSim API"
   - Loads .env using python-dotenv
   - Configures CORS middleware to allow:
       origins: ["http://localhost:3000"]
       allow_credentials: True
       allow_methods: ["*"]
       allow_headers: ["*"]
   - Includes all routers with their prefixes:
       /api/user
       /api/portfolio
       /api/stocks
       /api/trades
       /api/ai
       /api/learn
       /api/time-machine
   - Has a root GET / endpoint returning {"status": "InvestSim API running"}
   - Runs on port 8000 via uvicorn when executed directly

6. Create services/db.py with two helper functions:
   - read_json(filename: str) -> dict/list
     Reads from the data/ folder, returns parsed JSON
   - write_json(filename: str, data) -> None
     Writes data back to the data/ folder as formatted JSON

7. Seed all JSON files with this exact data:

data/user.json:
{
  "id": "a1b2c3d4",
  "name": "Arjun Kumar",
  "email": "arjun@demo.com",
  "avatarInitials": "AK",
  "virtualCash": 37450.00,
  "xpPoints": 340,
  "currentTier": 2,
  "daysActive": 12,
  "createdAt": "2025-03-01"
}

data/holdings.json:
[
  {"id": "h1", "stockSymbol": "RELIANCE", "companyName": "Reliance Industries Ltd", "quantity": 8, "avgBuyPrice": 2801.20, "sector": "Energy & Telecom"},
  {"id": "h2", "stockSymbol": "TCS", "companyName": "Tata Consultancy Services", "quantity": 5, "avgBuyPrice": 3200.00, "sector": "Technology"},
  {"id": "h3", "stockSymbol": "TATAMOTORS", "companyName": "Tata Motors Ltd", "quantity": 15, "avgBuyPrice": 820.00, "sector": "Automobile"},
  {"id": "h4", "stockSymbol": "YESBANK", "companyName": "Yes Bank Ltd", "quantity": 100, "avgBuyPrice": 36.00, "sector": "Banking"},
  {"id": "h5", "stockSymbol": "ZOMATO", "companyName": "Zomato Ltd", "quantity": 50, "avgBuyPrice": 195.00, "sector": "Food Tech"}
]

data/transactions.json:
[
  {"id": "t1", "stockSymbol": "TCS", "companyName": "Tata Consultancy Services", "type": "BUY", "quantity": 5, "price": 3421.55, "totalAmount": 17107.75, "createdAt": "2025-04-13T10:30:00Z"},
  {"id": "t2", "stockSymbol": "ZOMATO", "companyName": "Zomato Ltd", "type": "SELL", "quantity": 10, "price": 182.30, "totalAmount": 1823.00, "createdAt": "2025-04-12T14:20:00Z"},
  {"id": "t3", "stockSymbol": "RELIANCE", "companyName": "Reliance Industries Ltd", "type": "BUY", "quantity": 2, "price": 2847.30, "totalAmount": 5694.60, "createdAt": "2025-04-11T11:00:00Z"},
  {"id": "t4", "stockSymbol": "YESBANK", "companyName": "Yes Bank Ltd", "type": "BUY", "quantity": 100, "price": 36.00, "totalAmount": 3600.00, "createdAt": "2025-04-10T09:15:00Z"},
  {"id": "t5", "stockSymbol": "TATAMOTORS", "companyName": "Tata Motors Ltd", "type": "BUY", "quantity": 15, "price": 820.00, "totalAmount": 12300.00, "createdAt": "2025-04-09T13:45:00Z"}
]

data/missions.json:
[
  {"id": "m1", "missionKey": "first_large_cap", "title": "Buy your first Large Cap stock", "xpReward": 50, "completed": true, "completedAt": "2025-04-10T09:20:00Z"},
  {"id": "m2", "missionKey": "hold_3_days", "title": "Hold a stock for 3 days", "xpReward": 75, "completed": false, "progress": 2, "total": 3, "completedAt": null},
  {"id": "m3", "missionKey": "five_stock_portfolio", "title": "Build a 5-stock portfolio", "xpReward": 100, "completed": false, "locked": true, "requiredTier": 2, "completedAt": null}
]

data/lessons.json:
[
  {"id": "l1", "lessonId": 1, "moduleId": 1, "title": "What is a Stock?", "completed": true, "quizScore": 5},
  {"id": "l2", "lessonId": 2, "moduleId": 2, "title": "Candlestick Basics", "completed": true, "quizScore": 4},
  {"id": "l3", "lessonId": 3, "moduleId": 2, "title": "Reading Candlestick Charts", "completed": true, "quizScore": 5},
  {"id": "l4", "lessonId": 4, "moduleId": 2, "title": "Support and Resistance", "completed": false, "quizScore": 0},
  {"id": "l5", "lessonId": 5, "moduleId": 2, "title": "Volume Analysis", "completed": false, "quizScore": 0}
]

data/time_machine_attempts.json:
[]

data/loss_debriefs.json:
[]

Do not write any router logic yet. Just set up the structure, requirements, main.py, db service, and seed all JSON files exactly as above.
```

---

## PROMPT 2 — Stock Service (yfinance)

```
You are continuing to build the FastAPI backend for InvestSim.
The folder structure and data/ files already exist from the previous step.

MASTER CONTEXT:
Backend: FastAPI (Python)
Market Data: yfinance
These Indian stocks are in the app: RELIANCE, TCS, HDFCBANK, INFY, TATAMOTORS, ZOMATO, YESBANK, ADANIPORTS
NSE suffix for yfinance is .NS (e.g., RELIANCE.NS)

Build services/stock_service.py that does the following:

1. STOCK METADATA dictionary hardcoded in the file:
   Map each symbol to: companyName, sector, marketCap, riskLevel, about
   Use this data:
   RELIANCE: "Reliance Industries Ltd", "Energy & Telecom", "Large Cap", "LOW-MEDIUM", "Oil, telecom (Jio), and retail conglomerate — think of it as 3 massive companies in one stock"
   TCS: "Tata Consultancy Services", "Technology", "Large Cap", "LOW", "India's largest IT services company — powers banks, airlines, and governments worldwide"
   HDFCBANK: "HDFC Bank Ltd", "Banking", "Large Cap", "LOW", "India's largest private sector bank with 8000+ branches"
   INFY: "Infosys Ltd", "Technology", "Large Cap", "LOW", "Global IT services giant that turned Bangalore into India's Silicon Valley"
   TATAMOTORS: "Tata Motors Ltd", "Automobile", "Large Cap", "MEDIUM", "India's largest auto manufacturer — also owns Jaguar Land Rover"
   ZOMATO: "Zomato Ltd", "Food Tech", "Mid Cap", "HIGH", "India's leading food delivery app — profitable since 2023 but growth story still unfolding"
   YESBANK: "Yes Bank Ltd", "Banking", "Small Cap", "HIGH", "Private bank that faced RBI moratorium in 2020 — still in recovery mode"
   ADANIPORTS: "Adani Ports & SEZ", "Infrastructure", "Large Cap", "MEDIUM", "India's largest port operator handling 30% of all cargo"

2. async function get_stock_price(symbol: str) -> dict
   - Appends .NS to symbol
   - Uses yfinance Ticker to fetch info
   - Returns: symbol, companyName, currentPrice, previousClose, change, changePct, dayHigh, dayLow, volume, marketCap, sector, riskLevel, about
   - If yfinance fails or returns None, fall back to realistic hardcoded prices:
     RELIANCE: 2847.30, TCS: 3421.55, HDFCBANK: 1643.20, INFY: 1482.10,
     TATAMOTORS: 924.45, ZOMATO: 182.30, YESBANK: 24.15, ADANIPORTS: 1247.80
   - changePct should be calculated as ((currentPrice - previousClose) / previousClose) * 100
   - Round all prices to 2 decimal places

3. async function get_all_stocks() -> list
   - Calls get_stock_price for all 8 symbols
   - Returns list of all stock dicts
   - Use asyncio.gather for parallel fetching

4. async function get_historical_data(symbol: str, period: str) -> list
   - period can be: "1d", "1wk", "1mo", "3mo", "1y"
   - Uses yfinance Ticker.history(period=period, interval=interval)
   - interval mapping: 1d -> "5m", 1wk -> "1h", 1mo -> "1d", 3mo -> "1d", 1y -> "1wk"
   - Returns list of OHLCV candles: [{timestamp, open, high, low, close, volume}]
   - If yfinance fails, generate 30 realistic mock candles based on the fallback price
     with small random variations (±2% max) generally trending upward
   - Round all prices to 2 decimal places

Now build routers/stocks.py with these endpoints:

GET /api/stocks
  - Returns all 8 stocks with live prices via get_all_stocks()

GET /api/stocks/{symbol}
  - Returns single stock data via get_stock_price(symbol)

GET /api/stocks/{symbol}/history?period=1d
  - Returns OHLCV candle data via get_historical_data(symbol, period)
  - Default period is "1d" if not provided

All endpoints return proper JSON responses.
Handle errors gracefully — if yfinance is down, always return fallback data, never crash.
```

---

## PROMPT 3 — User & Portfolio Endpoints

```
You are continuing to build the FastAPI backend for InvestSim.
The folder structure, data/ files, and stock service already exist.

MASTER CONTEXT:
Database: JSON files in data/ folder, read/write via services/db.py
Demo user ID: "a1b2c3d4" (Arjun Kumar)
Holdings file: data/holdings.json
Transactions file: data/transactions.json
User file: data/user.json
Stock prices come from services/stock_service.get_stock_price()

Build routers/user.py with these endpoints:

GET /api/user
  - Reads data/user.json
  - Returns the full user object

PATCH /api/user/xp
  - Body: {"xpPoints": int}
  - Adds the given XP to the user's current xpPoints
  - Updates tier automatically:
    Tier 1: 0-199 XP
    Tier 2: 200-499 XP
    Tier 3: 500+ XP
  - Writes updated user back to data/user.json
  - Returns updated user object

Build routers/portfolio.py with these endpoints:

GET /api/portfolio
  - Reads holdings from data/holdings.json
  - For each holding, fetches current price via get_stock_price()
  - Calculates for each holding:
      currentValue = quantity * currentPrice
      pnl = currentValue - (quantity * avgBuyPrice)
      pnlPct = (pnl / (quantity * avgBuyPrice)) * 100
  - Reads user.json for virtualCash
  - Calculates:
      totalInvested = sum of (quantity * avgBuyPrice) for all holdings
      totalCurrentValue = sum of all currentValues
      totalPortfolioValue = totalCurrentValue + virtualCash
      totalPnl = totalCurrentValue - totalInvested
      totalPnlPct = (totalPnl / totalInvested) * 100
  - Calculates diversityScore (0-10):
      Find the largest holding as % of totalCurrentValue
      If largest > 50%: score = 3
      If largest 30-50%: score = 6
      If largest 20-30%: score = 8
      If largest < 20%: score = 10
  - Returns: {user, holdings (enriched), totalPortfolioValue, totalPnl, totalPnlPct, virtualCash, diversityScore}

GET /api/portfolio/transactions
  - Reads data/transactions.json
  - Returns sorted by createdAt descending (newest first)

Build routers/trades.py with these endpoints:

POST /api/trades/buy
  Body: {"stockSymbol": str, "quantity": int, "orderType": str}
  - Fetch current price via get_stock_price()
  - Calculate totalCost = quantity * currentPrice
  - Read user.json, check if virtualCash >= totalCost
  - If not enough cash: return 400 error {"error": "Insufficient virtual cash"}
  - Deduct totalCost from user.virtualCash, write back
  - Check if stock already in holdings:
      If yes: update quantity and recalculate avgBuyPrice
      If no: add new holding entry
  - Write updated holdings back
  - Add transaction to transactions.json with type "BUY"
  - Return: {"success": true, "message": "Bought {quantity} shares of {symbol} at ₹{price}", "transaction": {...}, "newCash": float}

POST /api/trades/sell
  Body: {"stockSymbol": str, "quantity": int}
  - Check if holding exists and has enough quantity
  - If not: return 400 error {"error": "Insufficient shares"}
  - Fetch current price
  - Calculate totalProceeds = quantity * currentPrice
  - Add proceeds to user.virtualCash
  - Reduce holding quantity (remove holding if quantity reaches 0)
  - Add transaction with type "SELL"
  - Return: {"success": true, "message": "Sold {quantity} shares of {symbol} at ₹{price}", "transaction": {...}, "newCash": float}

All file reads/writes use services/db.py helpers.
Generate UUID-style IDs for new records using Python's uuid4().
All monetary values rounded to 2 decimal places.
```

---

## PROMPT 4 — AI Service (Groq + Reactive Mentor + Loss Debrief)

```
You are continuing to build the FastAPI backend for InvestSim.
This is the most important prompt — the entire AI layer.

MASTER CONTEXT:
AI Provider: Groq API
Model: openai/gpt-oss-120b
Groq base URL: https://api.groq.com/openai/v1/chat/completions
API Key: from environment variable GROQ_API_KEY
Use httpx for async HTTP calls to Groq

AI FEATURE 1 — REACTIVE AI MENTOR:
This fires automatically after every user action (buy, sell, view stock).
It reads the full context of the user's portfolio and the specific action
they just took, and returns a SHORT proactive insight — like a wise friend
reacting in real time. It should feel like the AI noticed something and
is speaking up, not like the user asked a question.

AI FEATURE 2 — LOSS DEBRIEF:
Triggers when portfolio drops >3% in a day.
Generates a deeply personal, emotionally resonant narrative.
Includes real-life rupee equivalents of the loss.
References what a smart investor (like Rakesh Jhunjhunwala) would do.
Never preachy. Always empathetic.

Build services/ai_service.py:

1. async function call_groq(messages: list, max_tokens: int = 300) -> str
   - Makes POST request to https://api.groq.com/openai/v1/chat/completions
   - Headers: Authorization: Bearer {GROQ_API_KEY}, Content-Type: application/json
   - Body: {"model": "openai/gpt-oss-120b", "messages": messages, "max_tokens": max_tokens, "temperature": 0.8}
   - Returns the content string from choices[0].message.content
   - On any error, return a sensible fallback string (never crash)

2. async function get_reactive_mentor_insight(action: str, symbol: str, portfolio_context: dict) -> str

   action can be: "BUY", "SELL", "VIEW"
   portfolio_context includes: holdings, totalPnlPct, virtualCash, diversityScore, recentTransactions (last 3)

   Build a rich system prompt:
   "You are Arjun's personal investment mentor — a wise, experienced Indian investor
   who speaks like a knowledgeable older friend. You notice patterns in Arjun's
   behavior and speak up proactively. You use Hinglish naturally (not forcefully).
   You are never preachy. You reference real Indian market events and investors.
   You keep responses SHORT — max 3 sentences. You always end with one sharp insight
   or question that makes Arjun think."

   Build a user message that includes:
   - What action Arjun just took (bought/sold/viewed X)
   - His current portfolio state (concentration, cash remaining, diversity score)
   - Any patterns you notice (e.g., he keeps buying tech stocks, or he sold during a dip)
   - Ask the AI to react naturally to THIS specific action given THIS specific context

   Different prompt angles based on action + context:
   - If BUY and diversityScore < 5: mention concentration risk
   - If BUY and stock is HIGH risk: warn gently about risk level
   - If SELL and stock was down: ask if panic-selling or strategic
   - If SELL and stock was up: praise the discipline or ask if they're locking profits
   - If VIEW and user has never bought this sector: suggest it might fill a portfolio gap
   - If cash is running low (<20% of portfolio): proactively mention it

   Return the AI's response string.

3. async function generate_loss_debrief(loss_amount: float, stock_symbol: str, stock_name: str, holdings: list, portfolio_value: float) -> dict

   First calculate real_life_equivalents:
   items = []
   if loss_amount >= 500: items.append(f"{int(loss_amount/50)} cups of chai")
   if loss_amount >= 1000: items.append(f"{int(loss_amount/350)} movie tickets")
   if loss_amount >= 3000: items.append(f"{int(loss_amount/1500)} months of Spotify Premium")
   if loss_amount >= 10000: items.append("almost a new budget smartphone")
   if loss_amount >= 50000: items.append("a solid laptop")

   Find concentration: what % of portfolio was in the losing stock

   Build a rich system prompt:
   "You are writing a Loss Debrief for a young Indian investor named Arjun (age ~22).
   He just lost money in the stock market. Write like his wise older friend who has
   been through market crashes — empathetic but educational. Hinglish is natural here.
   Reference Rakesh Jhunjhunwala, Vijay Kedia, or Warren Buffett where relevant.
   Never be preachy or lecture-y. Be warm, real, and end with genuine encouragement."

   Build a user message asking the AI to generate a JSON response with these exact keys:
   {
     "openingLine": "one empathetic opening line (not preachy)",
     "whatHappened": "2-3 sentences explaining WHY this stock fell, in simple terms",
     "smartInvestorLesson": "what Rakesh Jhunjhunwala or a seasoned investor would have done differently",
     "actionableLesson": "one specific thing Arjun can do differently next time",
     "encouragingClose": "genuine encouraging closing line that makes him want to try again"
   }

   Include in the prompt: loss_amount, stock_name, concentration percentage, real_life_equivalents

   Parse the JSON from AI response (strip any markdown fences first).
   Return: {"aiContent": parsed_dict, "realLifeEquivalents": items, "lossAmount": loss_amount, "stockSymbol": stock_symbol, "concentrationPct": concentration}

Now build routers/ai.py with these endpoints:

POST /api/ai/mentor
  Body: {"action": str, "symbol": str}
  - Reads portfolio data (calls portfolio logic internally or reads JSON directly)
  - Calls get_reactive_mentor_insight()
  - Saves log to data/ai_mentor_logs.json (append: {trigger: action, symbol, response, timestamp})
  - Returns: {"insight": str, "action": str, "symbol": str}

POST /api/ai/loss-debrief
  Body: {"stockSymbol": str, "lossAmount": float}
  - Reads holdings from data/holdings.json
  - Reads user.json for portfolio context
  - Calls generate_loss_debrief()
  - Saves result to data/loss_debriefs.json
  - Returns the full debrief dict

POST /api/ai/analyze-portfolio
  Body: {} (empty — uses demo user's data)
  - Reads full portfolio (holdings + current prices + user cash)
  - Builds a comprehensive portfolio analysis prompt:
    System: "You are a portfolio analyst speaking to a young Indian beginner investor.
    Be encouraging but honest. Hinglish welcome. Under 150 words total."
    User message includes: all holdings with P&L, diversity score, sector breakdown,
    cash remaining, biggest winner, biggest loser
  - Ask AI to return JSON:
    {
      "overallVerdict": "one line summary of the portfolio health",
      "diversificationFeedback": "comment on spread across sectors",
      "riskFeedback": "is this portfolio appropriate for a beginner?",
      "topSuggestion": "one specific actionable improvement",
      "encouragement": "genuine closing note"
    }
  - Returns the parsed AI response

GET /api/ai/mentor-history
  - Reads data/ai_mentor_logs.json
  - Returns last 10 entries sorted by timestamp descending

Make sure all Groq API calls are async using httpx.AsyncClient.
All endpoints have proper error handling — AI errors return a graceful fallback, never a 500.
```

---

## PROMPT 5 — Learn & Time Machine Endpoints

```
You are continuing to build the FastAPI backend for InvestSim.
The user, portfolio, trades, and AI routers are already built.

MASTER CONTEXT:
Database: JSON files in data/ folder
Lessons file: data/lessons.json
Missions file: data/missions.json
Time Machine attempts file: data/time_machine_attempts.json
XP updates go through PATCH /api/user/xp (call internally or replicate logic)

Build routers/learn.py with these endpoints:

GET /api/learn/modules
  - Returns the full module structure — this is STATIC data defined in the router itself
  - 5 modules hardcoded:
    Module 1: {id:1, title:"What is a Stock?", description:"Understand ownership, shares, and why companies list publicly", xpReward:50, requiredTier:1, caseStudy:"Reliance IPO 1977 — When Dhirubhai Ambani opened investing to ordinary Indians", totalLessons:5}
    Module 2: {id:2, title:"How to Read Charts", description:"Candlesticks, support/resistance, volume — decoded simply", xpReward:75, requiredTier:1, caseStudy:"COVID Crash March 2020 — The biggest red candle in NSE history", totalLessons:5}
    Module 3: {id:3, title:"Understanding Risk", description:"Concentration risk, market risk, regulatory risk with real examples", xpReward:100, requiredTier:1, caseStudy:"Yes Bank Collapse 2020 — When safe banking stocks weren't safe", totalLessons:5}
    Module 4: {id:4, title:"Diversification & Portfolio Building", description:"Why spreading investments is armour, not just advice", xpReward:125, requiredTier:2, caseStudy:"Asian Paints vs Yes Bank — Boring vs Exciting over 20 years", totalLessons:5}
    Module 5: {id:5, title:"Advanced Orders & F&O Basics", description:"Stop losses, limit orders, futures — the full toolkit", xpReward:150, requiredTier:3, caseStudy:"How stop losses saved investors during Adani Group crash 2023", totalLessons:5}
  - Cross-reference with data/lessons.json to add: completedLessons count, isUnlocked (based on user tier from data/user.json)

GET /api/learn/modules/{moduleId}/lessons
  - Returns lesson content for that module — STATIC data defined in the router
  - Each lesson has: id, moduleId, lessonNumber, title, content (array of sections), quiz (array of MCQ questions), xpReward
  - Build at least 3 real lessons for Module 2 (How to Read Charts) with actual educational content about candlesticks
  - Each quiz question has: question, options (4 choices), correctIndex, explanation
  - Cross-reference with data/lessons.json to mark which ones are completed

POST /api/learn/complete
  Body: {"lessonId": int, "moduleId": int, "quizScore": int}
  - Checks if lesson already completed in data/lessons.json
  - If already completed: return {"alreadyCounted": true}
  - If new completion:
    - Update lesson record in data/lessons.json (completed: true, quizScore)
    - Award XP: base 20 XP + (quizScore * 6) XP
    - Update user XP via db write
    - Check if all lessons in a module are done — if yes, award module bonus XP
    - Return: {"xpAwarded": int, "lessonComplete": true, "moduleComplete": bool}

GET /api/learn/missions
  - Reads data/missions.json
  - Returns all missions with current status

POST /api/learn/missions/complete
  Body: {"missionKey": str}
  - Marks mission as complete in data/missions.json
  - Awards XP
  - Returns updated mission + xpAwarded

Now build routers/time_machine.py:

GET /api/time-machine/scenarios
  - Returns all scenarios as STATIC data hardcoded in the router:

  Scenario 1: {
    id:1, title:"The COVID Crash", date:"March 23, 2020",
    era:"2020", description:"Markets crashed 40% in 3 weeks. Panic everywhere. What would you do with 10,000 rupees?",
    stock:"NIFTY50", startPrice:7610, endPrice:18600, endDate:"October 2021",
    choices:[
      {id:"buy", label:"I would BUY", emoji:"😤"},
      {id:"sell", label:"I would SELL", emoji:"😰"},
      {id:"wait", label:"I would WAIT", emoji:"🤔"}
    ],
    outcomes:{
      buy:{result:"Your 10,000 became 24,440", finalAmount:24440, isWin:true, lesson:"Buying during maximum fear creates maximum returns. Buffett calls this being greedy when others are fearful."},
      sell:{result:"You locked in a 40% loss. Your 10,000 became 6,000", finalAmount:6000, isWin:false, lesson:"Panic selling during a crash is the most expensive mistake in investing. The market recovered 2.5x within 18 months."},
      wait:{result:"Smart! You avoided the crash but also missed buying at the bottom. Your 10,000 stayed 10,000.", finalAmount:10000, isWin:false, lesson:"Waiting is better than panic selling — but the real wealth was made by those who bought during fear."}
    },
    concept:"Contrarian Investing", xpReward:75
  }

  Scenario 2: {
    id:2, title:"The Paytm IPO Disaster", date:"November 18, 2021",
    era:"2021", description:"Paytm IPO — the biggest in Indian history. Everyone was subscribing. FOMO was real.",
    stock:"PAYTM", startPrice:2150, endPrice:560, endDate:"June 2022",
    choices:[
      {id:"subscribe", label:"Subscribe — FOMO is real", emoji:"🤑"},
      {id:"skip", label:"Skip — something feels off", emoji:"🤔"}
    ],
    outcomes:{
      subscribe:{result:"Paytm crashed 74% in 6 months. Your 10,000 became 2,604", finalAmount:2604, isWin:false, lesson:"IPO hype and business quality are completely different things. Paytm had no clear path to profits at IPO price."},
      skip:{result:"Great instinct! You avoided one of India's worst IPO disasters.", finalAmount:10000, isWin:true, lesson:"When you cannot explain how a company makes money sustainably, that is your signal to wait."}
    },
    concept:"IPO Risk and Valuation", xpReward:75
  }

  Scenario 3: {
    id:3, title:"Yes Bank Bargain Hunt", date:"January 2019",
    era:"2019", description:"Yes Bank at 200 rupees, down 60% from its peak. Everyone says it looks cheap. Is it a bargain?",
    stock:"YESBANK", startPrice:200, endPrice:12, endDate:"March 2020",
    choices:[
      {id:"buy", label:"Buy — looks cheap!", emoji:"🛒"},
      {id:"skip", label:"Skip — something feels wrong", emoji:"🤔"}
    ],
    outcomes:{
      buy:{result:"RBI placed Yes Bank under moratorium. Your 10,000 became 600", finalAmount:600, isWin:false, lesson:"A stock is not cheap just because it has fallen a lot. Check promoter pledging, NPA ratios, and RBI notices."},
      skip:{result:"You dodged a bullet. Yes Bank fell 94% and is still in recovery 5 years later.", finalAmount:10000, isWin:true, lesson:"Cheap stocks can always get cheaper. Falling price is a symptom — always diagnose the disease."}
    },
    concept:"Value Trap", xpReward:75
  }

  Scenario 4: {
    id:4, title:"Asian Paints — The Boring Millionaire", date:"January 2004",
    era:"2004", description:"Asian Paints at 38 rupees. Boring paint company. Not exciting. Not in the news. Buy?",
    stock:"ASIANPAINT", startPrice:38, endPrice:2800, endDate:"2024",
    choices:[
      {id:"buy", label:"Buy and HOLD", emoji:"💪"},
      {id:"skip", label:"Skip — too boring", emoji:"😴"}
    ],
    outcomes:{
      buy:{result:"10,000 became 7,36,842 over 20 years", finalAmount:736842, isWin:true, lesson:"The most boring businesses with pricing power and strong moats create extraordinary wealth."},
      skip:{result:"You missed a 73x return over 20 years looking for excitement elsewhere.", finalAmount:10000, isWin:false, lesson:"Exciting stocks make for exciting stories. Boring stocks make for wealthy investors."}
    },
    concept:"Long-term Compounding and Moats", xpReward:100
  }

  - Cross-reference with data/time_machine_attempts.json to mark which ones the user has already completed

POST /api/time-machine/attempt
  Body: {"scenarioId": int, "choice": str}
  - Check if already attempted this scenario — if yes, return existing result
  - Save attempt to data/time_machine_attempts.json
  - Award XP via user update
  - Return: {scenario outcome for that choice, xpAwarded, alreadyAttempted: false}

GET /api/time-machine/score
  - Reads data/time_machine_attempts.json
  - Returns: {totalAttempts, totalXpEarned, attempts: [...]}
```

---

## PROMPT 6 — Leaderboard, Dashboard & Final Wiring

```
You are doing the final wiring of the InvestSim FastAPI backend.
All routers are already built. This is the last step.

MASTER CONTEXT:
Everything runs as a demo. Single user: Arjun Kumar (id: a1b2c3d4)
Frontend runs on localhost:3000
Backend runs on localhost:8000

1. Add a leaderboard endpoint to routers/user.py:

GET /api/user/leaderboard
  - Returns STATIC mock leaderboard data hardcoded in the router
  - Three leaderboard types, return all three:

  returns_leaderboard:
  Rank 1: Priya S. (PS), returnPct 31.4, portfolioValue 131400, isCurrentUser false
  Rank 2: Rahul M. (RM), returnPct 28.7, portfolioValue 128700, isCurrentUser false
  Rank 3: Kavya T. (KT), returnPct 22.1, portfolioValue 122100, isCurrentUser false
  Rank 4: Arjun K. (AK), returnPct 14.2, portfolioValue 114200, isCurrentUser TRUE
  Rank 5: Sneha R. (SR), returnPct 12.8, portfolioValue 112800, isCurrentUser false
  Rank 6: Vikram N. (VN), returnPct 10.1, portfolioValue 110100, isCurrentUser false
  Rank 7: Ananya B. (AB), returnPct 8.4, portfolioValue 108400, isCurrentUser false
  Rank 8: Rohit S. (RS), returnPct 6.2, portfolioValue 106200, isCurrentUser false
  Rank 9: Meera K. (MK), returnPct 4.7, portfolioValue 104700, isCurrentUser false
  Rank 10: Dev P. (DP), returnPct 2.1, portfolioValue 102100, isCurrentUser false

  learning_leaderboard: same 10 users ranked by lessonsCompleted (Arjun has 8, give others realistic numbers)
  risk_leaderboard: same 10 users ranked by riskScore = returnPct divided by maxSingleDayLoss

  Also return: {currentUserRank: 4, totalUsers: 1247}

2. Add a dashboard summary endpoint — create routers/dashboard.py:

GET /api/dashboard
  - Aggregates data from all sources and returns everything the Home screen needs in ONE call
  - Reads: user.json, holdings.json, transactions.json, missions.json, lessons.json
  - Fetches current stock prices for all holdings
  - Calculates and returns:
      user: full user object
      portfolioSummary: {totalValue, totalPnl, totalPnlPct, virtualCash, bestPerformer (symbol + pnlPct), worstPerformer (symbol + pnlPct), diversityScore}
      missions: all 3 missions with status
      recentActivity: last 5 transactions + last 2 lesson completions merged and sorted by date, each item has {type: "TRADE" or "LESSON", description, timestamp, icon}
      dailyPnlPct: simulate today's P&L % — use Python's random.seed(today's date as int) then random.uniform(-4, 4), round to 2 decimal places. This makes it consistent for the same day.
      shouldTriggerLossDebrief: true if dailyPnlPct < -3.0
  - Include routers/dashboard.py in main.py with prefix /api/dashboard

3. Create data/ai_mentor_logs.json file containing an empty array []

4. Add a health check endpoint to main.py:

GET /api/health
  Returns:
  {
    "status": "healthy",
    "groqConfigured": true if GROQ_API_KEY env var is set and non-empty,
    "dataFilesPresent": true if all 7 data JSON files exist,
    "timestamp": current datetime as ISO string
  }

5. Final check — make sure main.py imports and includes ALL routers:
   user, portfolio, stocks, trades, ai, learn, time_machine, dashboard
   Each with correct /api prefix

6. Create README.md in the backend root with:
   - Project name and one-line description
   - Setup instructions: pip install -r requirements.txt, add GROQ_API_KEY to .env
   - Run instruction: python main.py
   - API base: http://localhost:8000
   - Health check: http://localhost:8000/api/health
   - Full list of all endpoints with one-line descriptions

After running this prompt, the backend is fully complete.
Test it by hitting http://localhost:8000/api/health first.
Then http://localhost:8000/api/dashboard to verify all data flows work.
```

---

## EXECUTION ORDER

| Step | Prompt | What Gets Built |
|------|--------|-----------------|
| 1 | Prompt 1 | Folder structure, JSON seed data, main.py, db service |
| 2 | Prompt 2 | yfinance stock service + /api/stocks endpoints |
| 3 | Prompt 3 | User, portfolio, and trades endpoints |
| 4 | Prompt 4 | Groq AI layer — Reactive Mentor + Loss Debrief + Portfolio Analyzer |
| 5 | Prompt 5 | Learn modules, lessons, missions, Time Machine scenarios |
| 6 | Prompt 6 | Leaderboard, dashboard aggregator, health check, final wiring |

---

## FRONTEND CONNECTION REFERENCE

After the backend is running on localhost:8000, replace hardcoded mock data in your React frontend with these fetch calls:

| Screen | Endpoint |
|--------|----------|
| Home Dashboard | GET /api/dashboard |
| Watchlist / Trade | GET /api/stocks |
| Stock Detail | GET /api/stocks/{symbol} |
| Chart Data | GET /api/stocks/{symbol}/history?period=1d |
| Portfolio | GET /api/portfolio |
| Transaction History | GET /api/portfolio/transactions |
| Buy Stock | POST /api/trades/buy |
| Sell Stock | POST /api/trades/sell |
| AI Mentor (after trade) | POST /api/ai/mentor |
| Loss Debrief | POST /api/ai/loss-debrief |
| Analyze Portfolio | POST /api/ai/analyze-portfolio |
| Learn Modules | GET /api/learn/modules |
| Lesson Content | GET /api/learn/modules/{moduleId}/lessons |
| Complete Lesson | POST /api/learn/complete |
| Missions | GET /api/learn/missions |
| Time Machine | GET /api/time-machine/scenarios |
| Submit Choice | POST /api/time-machine/attempt |
| Leaderboard | GET /api/user/leaderboard |
| Profile | GET /api/user |