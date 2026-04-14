<div align="center">
<h1> StockIt </h1> <I> – Learn Investing Without Losing Money </I> <br>
A gamified stock market simulator with AI mentorship, real-time data, and risk-free paper trading. <br>
</div>
<br>

## Overview <br>
StockIt is an intelligent paper trading and financial education platform that addresses the critical gap between financial awareness and actual investing participation. By combining live-like market data, AI-powered mentorship, and gamified learning mechanics, the platform gives users a psychologically safe environment to build genuine investing skills — before any real money is on the line.

### Problem Statement <br>
Most young adults are financially aware but investing-inactive. Three core barriers drive this gap:<br>
Fear of financial loss — Even small losses feel devastating to first-time investors, creating paralysis rather than participation.<br>
Lack of practical experience — Financial education is overwhelmingly theoretical. Textbooks explain how markets work; they don't teach how to behave inside one.<br>
Apps built for execution, not learning — Existing brokerage and trading apps are optimised for fast transactions. They surface prices, charts, and order books, but provide almost no scaffolding for someone who is still learning what any of it means.
Despite growing awareness of equities and personal finance — driven by social media, fintech marketing, and post-pandemic interest — actual retail participation among young investors remains disproportionately low.

### Our Solution<br>
StockIt reimagines the investing on-ramp by integrating four pillars into one cohesive platform:
 
| Pillar | What It Does |
|---|---|
| **Paper Trading** | Buy and sell real stocks with virtual cash using live-like market data from Finnhub |
| **AI Mentorship** | Get context-aware portfolio feedback, loss and risk explanations, behavioural analysis, stock analysis from a Groq-powered assistant |
| **Gamified Learning** | Earn XP, complete missions, maintain daily streaks, and progress through structured lessons and quizzes |
| **Scenario Simulations** | Step into historical market crash scenarios to understand risk management without real consequences |
 
---
 
## User Interface
 
StockIt features a mobile-first, tab-based interface designed for daily engagement and progressive skill-building.
________________________________________

### User Experience

<div align="center">

1. ### Home Dashboard
   
   <img width="300" height="600" alt="image" src="https://github.com/user-attachments/assets/fe99ef8e-0c5d-4e4a-b648-26afb08e5137" />

The personal command centre — displays your portfolio snapshot, live market indices (Nifty 50, Sensex, global markets), active missions with progress bars, your daily streak, and a recent activity feed. Indices refresh automatically every 10 seconds.
________________________________________

2. ### Trading Screen
   
  <img width="332" height="848" alt="image" src="https://github.com/user-attachments/assets/85e895fe-f57d-4116-b406-21ac23992358" />

The core trading experience, designed to feel like a real brokerage terminal. Browse a paginated, searchable list of stocks with live prices, and a market status banner indicating whether the exchange is open or closed. Manual refresh and 10-second auto-polling keep data current.
________________________________________

3.  ### Stock Detail and Analysis

   <div align="center">
      <img width="332" height="848" alt="image" src="https://github.com/user-attachments/assets/c6a9e54b-7bd1-4303-9ab1-b4b9089c929d" />
      <img width="332" height="848" alt="image" src="https://github.com/user-attachments/assets/c42a9d8b-5fa3-4755-af0c-9c79404ddd00" />
   </div>

Deep-dive into any stock before committing. Features an interactive OHLCV chart across multiple time periods (1D, 1W, 1M, 3M, 1Y), AI-generated contextual insights about the stock's recent movement, and an inline buy/sell panel so you never have to navigate away to trade.
________________________________________

4.  ### Portfolio Analytics

   
   <div align="center">
      <img width="332" height="848" alt="image" src="https://github.com/user-attachments/assets/3bdb9b95-01a0-4fc4-ae9f-36bc13bb564f" />
    <img width="332" height="848" alt="image" src="https://github.com/user-attachments/assets/6f8ae47c-88c1-429c-a42f-2aaea42f3f1d" />
      <img width="332" height="848" alt="image" src="https://github.com/user-attachments/assets/79ae1b53-f054-42c9-a1ec-f1c9eb10bb19" />

   </div>
<br>

A comprehensive performance dashboard showing total portfolio value, unrealised P&L, a diversity score measuring how well-spread your holdings are, best and worst performers, a donut chart of allocations, and a full holdings breakdown per stock. An AI analysis button triggers a Groq-powered deep-dive of your entire portfolio.
________________________________________

5.  ### Learning & Gamification

  <img width="332" height="848" alt="image" src="https://github.com/user-attachments/assets/f93eeae4-2618-4236-a7a7-550af3836d2e" />

Structured lessons and multiple-choice quizzes covering investing fundamentals. Each completion awards XP, advances your level tier, and can complete active missions. A streak system rewards daily engagement.
________________________________________
6.  ### Loss Simulator (Time Machine)
   
 <img width="332" height="848" alt="image" src="https://github.com/user-attachments/assets/00cc02ce-d647-4a8b-8258-05a77237c4b6" />

Presents historical market crash scenarios — users make allocation decisions and see how they would have played out. Scores are tracked and explained, turning past market disasters into personalised learning moments.

</div>

________________________________________
 Key Features
 AI-Powered Investing Assistant
•	Portfolio analysis
•	Loss Simulator
•	Context-aware explanations
Real-Time Market Simulation
•	Finnhub integration
•	Live-like pricing system
•	Index tracking
 Gamified Learning System
•	XP & levels
•	Missions & streaks
•	Quiz-based progression
 Risk & Scenario Simulator
•	Time-machine simulation
•	Learn from past market crashes
 Portfolio Intelligence
•	Diversity scoring
•	Performance insights
________________________________________
 Tech Stack
Frontend
•	React + Vite
•	TypeScript / JavaScript
•	Tailwind-style UI
•	Framer Motion
Backend
•	FastAPI (Python)
APIs
•	Finnhub (market data)
•	Frontend URL 
•	Groq (AI processing)
GROQ_API_KEY=yourkey
FRONTEND_URL=https://localhost:3000
FINNHUB_API_KEY=yourkey
_________________
 System Architecture
 <img width="975" height="532" alt="image" src="https://github.com/user-attachments/assets/2f4f571d-ea21-483a-95b4-8810f4ded7b2" />

________________________________________
 Data Flow
 Stock Data Flow
•	Frontend requests stock data
•	Backend fetches from Finnhub / Yahoo
•	Normalized response sent to UI
 Portfolio Flow
•	Backend computes real-time values
•	Frontend enhances UI with visuals
 User Flow
•	Session via email
•	Data stored per-user in JSON files
________________________________________
API Endpoints
User
•	POST /api/user/start-session
•	GET /api/user
Stocks
•	GET /api/stocks
•	GET /api/stocks/{symbol}
Trades
•	POST /api/trades/buy
•	POST /api/trades/sell
AI
•	POST /api/ai/mentor
•	POST /api/ai/analyze-portfolio
________________________________________
 Database Design
•	User data
•	Holdings
•	Transactions
•	Learning progress
•	AI interaction logs
________________________________________
 Performance Analysis
 Current Bottlenecks
•	Frequent polling (every 10s)
•	Duplicate API calls across pages
•	Lack of centralized caching
 Optimization Opportunities
•	Implement TTL caching (backend)
•	Use React Query (frontend)
•	Introduce global state management
________________________________________
 State Management
Current:
•	Local component state (useState, useEffect)
•	Event-based updates (window events)
Challenges:
•	Data duplication
•	Lack of global synchronization
________________________________________
 Security Considerations
 Current limitations:
•	No token-based authentication
•	Plaintext password storage
•	Header-based identity system
________________________________________
Impact
•	Makes investing accessible for beginners
•	Removes fear of financial loss
•	Encourages financial literacy through practice
________________________________________
 Future Improvements
•	Real-time WebSocket updates
•	Mentorship layer
•	Advanced AI insights
•	Social trading features
________________________________________
Installation & Setup
Prerequisites
•	Node.js
•	Python 3.9+
Backend Setup
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
Frontend Setup
cd frontend
npm install
npm run dev
________________________________________
📁 Project Structure
backend/
  routers/
  services/
  data/
frontend/
  pages/
  components/
  utils/
________________________________________
 Acknowledgements
•	Finnhub API
•	Yahoo Finance
•	Groq AI
________________________________________
 Final Note
This project combines FinTech, EdTech, AI and Gamification to create a safe and engaging investing learning experience.
