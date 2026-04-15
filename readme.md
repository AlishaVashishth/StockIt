<div align="center">
<h1>StockIt</h1> <br> — <I>Learn Investing Without Losing Money</I>

A gamified stock market simulator with AI mentorship, real-time data, and risk-free paper trading.
</div>

## Table of Contents

Overview<br>
Problem Statement<br>
Our Solution<br>
User Interface<br>
Key Features<br>
Tech Stack<br>
System Architecture<br>
API Endpoints<br>
Database Design<br>
Performance Analysis<br>
State Management<br>
Security Considerations<br>
Installation & Setup<br>
Project Structure<br>
Impact<br>
Future Improvements<br>
Acknowledgements<br>


## Overview
StockIt is an intelligent paper trading and financial education platform that addresses the critical gap between financial awareness and actual investing participation. By combining live-like market data, AI-powered mentorship, and gamified learning mechanics, the platform gives users a psychologically safe environment to build genuine investing skills — before any real money is on the line.

## Problem Statement
Most young adults are financially aware but investing-inactive. Three core barriers drive this gap:
Fear of financial loss — Even small losses feel devastating to first-time investors, creating paralysis rather than participation.
Lack of practical experience — Financial education is overwhelmingly theoretical. Textbooks explain how markets work; they don't teach how to behave inside one.
Apps built for execution, not learning — Existing brokerage and trading apps are optimised for fast transactions. They surface prices, charts, and order books, but provide almost no scaffolding for someone who is still learning what any of it means.
Despite growing awareness of equities and personal finance — driven by social media, fintech marketing, and post-pandemic interest — actual retail participation among young investors remains disproportionately low.

## Our Solution
StockIt reimagines the investing on-ramp by integrating four pillars into one cohesive platform:

| Pillar | What It Does |
|---|---|
| **Paper Trading** | Buy and sell real stocks with virtual cash using live-like market data from Finnhub |
| **AI Mentorship** | Get context-aware portfolio feedback, loss and risk explanations, behavioural analysis, and stock insights from a Groq-powered assistant |
| **Gamified Learning** | Earn XP, complete missions, maintain daily streaks, and progress through structured lessons and quizzes |
| **Scenario Simulations** | Step into historical market crash scenarios to understand risk management without real consequences |

## User Interface

StockIt features a mobile-first, tab-based interface designed for daily engagement and progressive skill-building.

<div align="center">

### Home Dashboard

   <img width="300" height="600" alt="image" src="https://github.com/user-attachments/assets/fe99ef8e-0c5d-4e4a-b648-26afb08e5137" />
   </br>
The personal command centre — displays your portfolio snapshot, live market indices (Nifty 50, Sensex, global markets), active missions with progress bars, your daily streak, and a recent activity feed. Indices refresh automatically every 10 seconds.

### Trading Screen

<img width="300" height="650" alt="image" src="https://github.com/user-attachments/assets/85e895fe-f57d-4116-b406-21ac23992358" />
</br>
The core trading experience, designed to feel like a real brokerage terminal. Browse a paginated, searchable list of stocks with live prices, and a market status banner indicating whether the exchange is open or closed. Manual refresh and 10-second auto-polling keep data current.

### Stock Detail and Analysis

   <div align="center">
          <img width="300" height="650" alt="image" src="https://github.com/user-attachments/assets/c6a9e54b-7bd1-4303-9ab1-b4b9089c929d" />
          <img width="300" height="650" alt="image" src="https://github.com/user-attachments/assets/c42a9d8b-5fa3-4755-af0c-9c79404ddd00" />
   </div>
 </br>
Deep-dive into any stock before committing. Features an interactive OHLCV chart across multiple time periods (1D, 1W, 1M, 3M, 1Y), AI-generated contextual insights about the stock's recent movement, and an inline buy/sell panel so you never have to navigate away to trade.

### Portfolio Analytics

   <div align="center">
         <img width="300" height="650" alt="image" src="https://github.com/user-attachments/assets/3bdb9b95-01a0-4fc4-ae9f-36bc13bb564f" />
          <img width="300" height="650" alt="image" src="https://github.com/user-attachments/assets/6f8ae47c-88c1-429c-a42f-2aaea42f3f1d" />
         <img width="300" height="650" alt="image" src="https://github.com/user-attachments/assets/79ae1b53-f054-42c9-a1ec-f1c9eb10bb19" />

   </div>
   </br>
A comprehensive performance dashboard showing:

Total portfolio value and unrealised P&L
A diversity score measuring how well-spread your holdings are
Best and worst performers
A donut chart of allocations
A full holdings breakdown per stock

An AI analysis button triggers a Groq-powered deep-dive of your entire portfolio.

### Learning & Gamification

<img width="300" height="650" alt="image" src="https://github.com/user-attachments/assets/f93eeae4-2618-4236-a7a7-550af3836d2e" />
</br>
Structured lessons and multiple-choice quizzes covering investing fundamentals. Each completion awards XP, advances your level tier, and can complete active missions. A streak system rewards daily engagement.

### Loss Simulator (Time Machine)

<img width="300" height="650" alt="image" src="https://github.com/user-attachments/assets/00cc02ce-d647-4a8b-8258-05a77237c4b6" />
</br>
Presents historical market crash scenarios — users make allocation decisions and see how they would have played out. Scores are tracked and explained, turning past market disasters into personalised learning moments.

</div>

## Key Features


1. AI-Powered Investing Assistant
The Groq-backed AI mentor operates across three distinct modes:

2. Portfolio analysis — sends your full holdings, P&L, and diversity score to the model and returns a structured critique with actionable suggestions
Contextual mentor chat — answers natural-language investing questions with awareness of your current portfolio and learning progress
Session continuity — interaction history is persisted per user so the assistant builds context across sessions

3. Real-Time Market Simulation

Finnhub integration as the primary data provider for live quotes, company profiles, and OHLCV candle data
Yahoo Finance (yfinance) fallback — if Finnhub fails or rate-limits, the backend seamlessly falls back to yfinance for quotes and historical data
Static fallback values as a final safety net, ensuring the UI never breaks due to upstream failures
Live indices — Nifty 50, Sensex, and select global indices fetched and normalised every 10 seconds on the home and trading screens
Normalised quote objects returned by the backend mean the frontend never needs to know which data source was used

4. Gamified Learning System

XP & level tiers — every trade, lesson completion, quiz pass, and mission finish awards XP; users level up through named tiers
Daily streaks — the backend tracks consecutive active days; the frontend displays current streak with visual indicators
Missions — time-limited challenges (e.g. "Complete 3 trades this week", "Finish the Diversification lesson") that reward bonus XP on completion
Lessons & quizzes — a structured curriculum stored in static data files, served via the /api/learn router, with per-user completion state persisted in JSON

5. Risk & Scenario Simulator

Pre-built historical scenarios (market crashes, sector collapses, black swan events) available via the /api/loss-simulator router
Users make allocation decisions within the scenario, then see scored outcomes
Scores are explained with AI-generated commentary connecting the simulated loss to real risk management principles

6. Portfolio Intelligence

Diversity score — a proprietary metric calculated by the backend that penalises over-concentration in a single stock or sector
Best/worst performer cards — surfaced automatically from live price enrichment on each portfolio fetch
P&L enrichment — the backend recomputes current holding values against live prices on every /api/portfolio request, so numbers are always fresh
Transaction history — full trade log accessible via /api/portfolio/transactions

## Tech Stack
LayerTechnologyFrontendReact + Vite, TypeScript / JavaScript, Tailwind CSS, Framer MotionBackendFastAPI (Python)Market DataFinnhub API (primary), Yahoo Finance / yfinance (fallback)AI ProcessingGroq API

## System Architecture
 <img width="975" height="532" alt="image" src="https://github.com/user-attachments/assets/2f4f571d-ea21-483a-95b4-8810f4ded7b2" />
 </br>
 
## Data Flow
1. Stock Data Flow

Frontend requests stock data
Backend fetches from Finnhub / Yahoo Finance
Normalised response is returned to the UI

2. Portfolio Flow

Backend computes real-time holding values against live prices
Frontend enhances UI with visual components (charts, cards, P&L indicators)

3. User Flow

Session initiated via email
All user data stored per-user in JSON files on the backend


## API Endpoints
- User
MethodEndpointDescriptionPOST/api/user/start-sessionInitialise or resume a user sessionGET/api/userFetch current user profile and progress
- Stocks
MethodEndpointDescriptionGET/api/stocksPaginated list of available stocks with live pricesGET/api/stocks/{symbol}Full detail for a specific stock including OHLCV data
- Trades
MethodEndpointDescriptionPOST/api/trades/buyExecute a paper buy orderPOST/api/trades/sellExecute a paper sell order
- AI
MethodEndpointDescriptionPOST/api/ai/mentorSend a message to the contextual AI mentorPOST/api/ai/analyze-portfolioTrigger a full AI portfolio analysis

## Database Design
User data is stored in flat JSON files on the backend, scoped per user. The following entities are tracked:

User profile — session info, XP, level tier, streak data<br>
Holdings — current stock positions with average buy price and quantity<br>
Transactions — full history of all buy and sell orders<br>
Learning progress — completed lessons, quiz scores, active and completed missions<br>
AI interaction logs — persisted conversation history for mentor continuity<br>


## Performance Analysis
1. Current Bottlenecks

Frequent polling every 10 seconds creates repeated network load<br>
Duplicate API calls across pages with no shared cache layer<br>
Lack of centralised state management leads to redundant fetches<br>

2. Optimization Opportunities

Implement TTL-based caching on the backend to reduce upstream API calls<br>
Adopt React Query on the frontend for smart caching, deduplication, and background refetching<br>
Introduce a global state management solution (e.g. Zustand or Redux Toolkit) to eliminate data duplication across components<br>


## State Management
Current approach:

Local component state managed via useState and useEffect<br>
Cross-component updates handled through browser window events<br>

Known challenges:

Data duplication across components that fetch the same resource independently<br>
No global synchronisation — updates in one tab or component are not automatically reflected elsewhere<br>


Security Considerations<br>
The current implementation uses a lightweight identity system suitable for a learning/demo context. The following limitations are acknowledged for future hardening:<br>

No token-based authentication (e.g. JWT or OAuth)<br>
Passwords stored in plaintext — hashing with bcrypt or argon2 is recommended before any production deployment<br>
Identity relies on a header-based system rather than signed session tokens<br>


## Installation & Setup
Prerequisites

Node.js (v18 or above recommended)<br>
Python 3.9+

## Environment Variables<br>
Create a `.env` file in the `backend/` directory with the following keys:<br><br>

GROQ_API_KEY=your_groq_api_key<br>
FINNHUB_API_KEY=your_finnhub_api_key<br>
FRONTEND_URL=http://localhost:3000
### Backend Setup<br>
cd backend <br>
pip install -r requirements.txt<br>
uvicorn main:app --reload<br>
### Frontend Setup<br>
cd frontend<br>
npm install<br>
npm run dev<br>

The frontend will be available at<br>
http://localhost:3000
<br><br>

The backend at<br>
https://stockit-production-2ac3.up.railway.app
<br><br>
<div align="center">
   
   ## .apk file link <br>
   https://drive.google.com/file/d/1VkG4sppgUjAlQeu_h6i2qHto-JF8W60C/view?usp=drivesdk

</div>

## Project Structure

```
stockit/
├── backend/
│   ├── main.py
│   ├── routers/
│   ├── services/
│   └── data/
└── frontend/
    ├── pages/
    ├── components/
    └── utils/
```

## Impact

Makes investing accessible for beginners by removing the barrier of real financial risk
Reduces fear of financial loss through realistic simulation in a consequence-free environment
Encourages long-term financial literacy through consistent, habit-forming practice


## Future Improvements

Real-time WebSocket updates to replace polling-based data refresh
Expanded mentorship layer with more personalised learning paths
Advanced AI insights including sentiment analysis and sector trend detection
Social trading features — follow other learners, share portfolios, and compare performance


## Acknowledgements

Finnhub API — real-time stock market data
Yahoo Finance (yfinance) — fallback market data
Groq AI — fast AI inference powering the mentor and portfolio analysis



StockIt combines FinTech, EdTech, AI, and Gamification to create a safe and engaging investing learning experience. Built for the next generation of investors.
