<div align="center">

<img src="frontend/public/Icons/logo.png" alt="StockIt Logo" width="120" />

<h1>StockIt</h1>

<i>Learn Investing Without Losing Money</i>

<br/>

A gamified stock market simulator with AI mentorship, real-time data, and risk-free paper trading.

<br/>

[![Download APK](https://img.shields.io/badge/Download%20APK-Android-brightgreen?style=for-the-badge&logo=android)](https://drive.google.com/file/d/1MJzoklsLdJSyu8vYBDwTTM_iTArNW6fv/view?usp=sharing)
[![Backend](https://img.shields.io/badge/Backend-Live%20on%20Railway-blueviolet?style=for-the-badge)](https://stockit-production-2ac3.up.railway.app)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Our Solution](#our-solution)
- [User Interface](#user-interface)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [API Endpoints](#api-endpoints)
- [Database Design](#database-design)
- [Performance Analysis](#performance-analysis)
- [State Management](#state-management)
- [Security Considerations](#security-considerations)
- [Installation & Setup](#installation--setup)
- [Project Structure](#project-structure)
- [Impact](#impact)
- [Future Improvements](#future-improvements)
- [Acknowledgements](#acknowledgements)

---

## Overview

StockIt is an intelligent paper trading and financial education platform that addresses the critical gap between financial awareness and actual investing participation. By combining live-like market data, AI-powered mentorship, and gamified learning mechanics, the platform gives users a psychologically safe environment to build genuine investing skills — before any real money is on the line.

---

## Problem Statement

Most young adults are financially aware but investing-inactive. Three core barriers drive this gap:

**Fear of financial loss** — Even small losses feel devastating to first-time investors, creating paralysis rather than participation.

**Lack of practical experience** — Financial education is overwhelmingly theoretical. Textbooks explain how markets work; they don't teach how to behave inside one.

**Apps built for execution, not learning** — Existing brokerage and trading apps are optimised for fast transactions. They surface prices, charts, and order books, but provide almost no scaffolding for someone who is still learning what any of it means.

Despite growing awareness of equities and personal finance — driven by social media, fintech marketing, and post-pandemic interest — actual retail participation among young investors remains disproportionately low.

---

## Our Solution

StockIt reimagines the investing on-ramp by integrating four pillars into one cohesive platform:

| Pillar | What It Does |
|---|---|
| **Paper Trading** | Buy and sell real stocks with virtual cash using live-like market data from Finnhub |
| **AI Mentorship** | Get context-aware portfolio feedback, loss and risk explanations, behavioural analysis, and stock insights from a Groq-powered assistant |
| **Gamified Learning** | Earn XP, complete missions, maintain daily streaks, and progress through structured lessons and quizzes |
| **Scenario Simulations** | Step into historical market crash scenarios to understand risk management without real consequences |

---

## User Interface

StockIt features a mobile-first, tab-based interface designed for daily engagement and progressive skill-building.

<div align="center">

### Home Dashboard

<img width="300" height="600" alt="Home Dashboard" src="https://github.com/user-attachments/assets/fe99ef8e-0c5d-4e4a-b648-26afb08e5137" />

The personal command centre — displays your portfolio snapshot, live market indices (Nifty 50, Sensex, global markets), active missions with progress bars, your daily streak, and a recent activity feed. Indices refresh automatically every 10 seconds.

---

### Trading Screen

<img width="300" height="650" alt="Trading Screen" src="https://github.com/user-attachments/assets/85e895fe-f57d-4116-b406-21ac23992358" />

The core trading experience, designed to feel like a real brokerage terminal. Browse a paginated, searchable list of stocks with live prices, and a market status banner indicating whether the exchange is open or closed. Manual refresh and 10-second auto-polling keep data current.

---

### Stock Detail and Analysis

<img width="300" height="650" alt="Stock Detail" src="https://github.com/user-attachments/assets/c6a9e54b-7bd1-4303-9ab1-b4b9089c929d" />
<img width="300" height="650" alt="Stock Analysis" src="https://github.com/user-attachments/assets/c42a9d8b-5fa3-4755-af0c-9c79404ddd00" />

Deep-dive into any stock before committing. Features an interactive OHLCV chart across multiple time periods (1D, 1W, 1M, 3M, 1Y), AI-generated contextual insights about the stock's recent movement, and an inline buy/sell panel so you never have to navigate away to trade.

---

### Portfolio Analytics

<img width="300" height="650" alt="Portfolio 1" src="https://github.com/user-attachments/assets/3bdb9b95-01a0-4fc4-ae9f-36bc13bb564f" />
<img width="300" height="650" alt="Portfolio 2" src="https://github.com/user-attachments/assets/6f8ae47c-88c1-429c-a42f-2aaea42f3f1d" />
<img width="300" height="650" alt="Portfolio 3" src="https://github.com/user-attachments/assets/79ae1b53-f054-42c9-a1ec-f1c9eb10bb19" />

A comprehensive performance dashboard showing total portfolio value and unrealised P&L, a diversity score measuring how well-spread your holdings are, best and worst performers, a donut chart of allocations, and a full holdings breakdown per stock. An AI analysis button triggers a Groq-powered deep-dive of your entire portfolio.

---

### Learning & Gamification

<img width="300" height="650" alt="Learn Screen" src="https://github.com/user-attachments/assets/f93eeae4-2618-4236-a7a7-550af3836d2e" />

Structured lessons and multiple-choice quizzes covering investing fundamentals. Each completion awards XP, advances your level tier, and can complete active missions. A streak system rewards daily engagement.

---

### Loss Simulator (Time Machine)

<img width="300" height="650" alt="Time Machine" src="https://github.com/user-attachments/assets/00cc02ce-d647-4a8b-8258-05a77237c4b6" />

Presents historical market crash scenarios — users make allocation decisions and see how they would have played out. Scores are tracked and explained, turning past market disasters into personalised learning moments.

</div>

---

## Key Features

### AI-Powered Investing Assistant

The Groq-backed AI mentor operates across three distinct modes:

**Portfolio analysis** — sends your full holdings, P&L, and diversity score to the model and returns a structured critique with actionable suggestions.

**Contextual mentor chat** — answers natural-language investing questions with awareness of your current portfolio and learning progress.

**Session continuity** — interaction history is persisted per user so the assistant builds context across sessions.

### Real-Time Market Simulation

**Finnhub** integration as the primary data provider for live quotes, company profiles, and OHLCV candle data.

**Yahoo Finance (yfinance) fallback** — if Finnhub fails or rate-limits, the backend seamlessly falls back to yfinance for quotes and historical data.

**Static fallback values** as a final safety net, ensuring the UI never breaks due to upstream failures.

**Live indices** — Nifty 50, Sensex, and select global indices fetched and normalised every 10 seconds on the home and trading screens. Normalised quote objects returned by the backend mean the frontend never needs to know which data source was used.

### Gamified Learning System

**XP & level tiers** — every trade, lesson completion, quiz pass, and mission finish awards XP; users level up through named tiers.

**Daily streaks** — the backend tracks consecutive active days; the frontend displays current streak with visual indicators.

**Missions** — time-limited challenges (e.g. "Complete 3 trades this week", "Finish the Diversification lesson") that reward bonus XP on completion.

**Lessons & quizzes** — a structured curriculum stored in static data files, served via the `/api/learn` router, with per-user completion state persisted in JSON.

### Risk & Scenario Simulator

Pre-built historical scenarios (market crashes, sector collapses, black swan events) available via the `/api/loss-simulator` router. Users make allocation decisions within the scenario, then see scored outcomes. Scores are explained with AI-generated commentary connecting the simulated loss to real risk management principles.

### Portfolio Intelligence

**Diversity score** — a proprietary metric calculated by the backend that penalises over-concentration in a single stock or sector.

**Best/worst performer cards** — surfaced automatically from live price enrichment on each portfolio fetch.

**P&L enrichment** — the backend recomputes current holding values against live prices on every `/api/portfolio` request, so numbers are always fresh.

**Transaction history** — full trade log accessible via `/api/portfolio/transactions`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React + Vite, TypeScript / JavaScript, Tailwind CSS, Framer Motion |
| **Mobile** | Capacitor (Android APK export) |
| **Backend** | FastAPI (Python) |
| **Market Data** | Finnhub API (primary), Yahoo Finance / yfinance (fallback) |
| **AI Processing** | Groq API |

---

## System Architecture

<img width="975" height="532" alt="System Architecture" src="https://github.com/user-attachments/assets/2f4f571d-ea21-483a-95b4-8810f4ded7b2" />

### Data Flow

**Stock Data Flow** — Frontend requests stock data → Backend fetches from Finnhub / Yahoo Finance → Normalised response returned to the UI.

**Portfolio Flow** — Backend computes real-time holding values against live prices → Frontend enhances UI with visual components (charts, cards, P&L indicators).

**User Flow** — Session initiated via email → All user data stored per-user in JSON files on the backend.

---

## API Endpoints

### User

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/user/start-session` | Initialise or resume a user session |
| `GET` | `/api/user` | Fetch current user profile and progress |

### Stocks

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/stocks` | Paginated list of available stocks with live prices |
| `GET` | `/api/stocks/{symbol}` | Full detail for a specific stock including OHLCV data |

### Trades

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/trades/buy` | Execute a paper buy order |
| `POST` | `/api/trades/sell` | Execute a paper sell order |

### Portfolio

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/portfolio` | Fetch enriched portfolio with live P&L |
| `GET` | `/api/portfolio/transactions` | Full transaction history |

### AI

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/mentor` | Send a message to the contextual AI mentor |
| `POST` | `/api/ai/analyze-portfolio` | Trigger a full AI portfolio analysis |

---

## Database Design

User data is stored in flat JSON files on the backend, scoped per user. The following entities are tracked:

**User profile** — session info, XP, level tier, streak data.

**Holdings** — current stock positions with average buy price and quantity.

**Transactions** — full history of all buy and sell orders.

**Learning progress** — completed lessons, quiz scores, active and completed missions.

**AI interaction logs** — persisted conversation history for mentor continuity.

Each user gets a dedicated directory under `backend/data/users/{user_id}/` containing all of these files independently.

---

## Performance Analysis

### Current Bottlenecks

- Frequent polling every 10 seconds creates repeated network load
- Duplicate API calls across pages with no shared cache layer
- Lack of centralised state management leads to redundant fetches

### Optimization Opportunities

- Implement TTL-based caching on the backend to reduce upstream API calls
- Adopt React Query on the frontend for smart caching, deduplication, and background refetching
- Introduce a global state management solution (e.g. Zustand or Redux Toolkit) to eliminate data duplication across components

---

## State Management

**Current approach** — local component state managed via `useState` and `useEffect`; cross-component updates handled through browser `window` events.

**Known challenges** — data duplication across components that fetch the same resource independently; no global synchronisation, meaning updates in one component are not automatically reflected elsewhere.

---

## Security Considerations

The current implementation uses a lightweight identity system suitable for a learning and demo context. The following limitations are acknowledged for future hardening:

- No token-based authentication (e.g. JWT or OAuth)
- Passwords stored in plaintext — hashing with `bcrypt` or `argon2` is recommended before any production deployment
- Identity relies on a header-based system rather than signed session tokens

---

## Installation & Setup

### Prerequisites

- Node.js v18 or above
- Python 3.9+

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
GROQ_API_KEY=your_groq_api_key
FINNHUB_API_KEY=your_finnhub_api_key
FRONTEND_URL=http://localhost:3000
```

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.
The backend is live at `https://stockit-production-2ac3.up.railway.app`.

### Android Build (Capacitor)

The app is exported via Capacitor for Android. The pre-built APK is available for direct download:

[![Download APK](https://img.shields.io/badge/Download%20APK-Android-brightgreen?style=for-the-badge&logo=android)](https://drive.google.com/file/d/1VkG4sppgUjAlQeu_h6i2qHto-JF8W60C/view?usp=drivesdk)

---

## Project Structure

```
StockIt/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── requirements.txt
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py           # Pydantic request/response models
│   ├── routers/
│   │   ├── ai.py                # AI mentor and portfolio analysis endpoints
│   │   ├── dashboard.py         # Home feed and index data
│   │   ├── learn.py             # Lessons, quizzes, and progress
│   │   ├── portfolio.py         # Holdings, P&L, and transaction history
│   │   ├── stocks.py            # Stock list and detail endpoints
│   │   ├── time_machine.py      # Historical scenario simulator
│   │   ├── trades.py            # Buy and sell order execution
│   │   └── user.py              # Session management and user profile
│   ├── services/
│   │   ├── ai_service.py        # Groq API integration
│   │   ├── db.py                # JSON file read/write layer
│   │   ├── stock_service.py     # Finnhub + yfinance with fallback logic
│   │   └── ttl_cache.py         # In-memory TTL caching for market data
│   └── data/
│       ├── *.json               # Global fallback data files
│       └── users/
│           └── {user_id}/       # Per-user scoped data directory
│               ├── user.json
│               ├── holdings.json
│               ├── transactions.json
│               ├── lessons.json
│               ├── missions.json
│               ├── loss_debriefs.json
│               ├── time_machine_attempts.json
│               └── ai_mentor_logs.json
│
└── frontend/
    ├── index.html
    ├── vite.config.ts
    ├── tsconfig.json
    ├── src/
    │   ├── main.tsx             # React app entry point
    │   ├── App.tsx              # Root component and routing
    │   ├── api.ts               # Centralised API client
    │   ├── types.ts             # Shared TypeScript types
    │   ├── constants.ts         # App-wide constants
    │   ├── pages/
    │   │   ├── Home.tsx         # Dashboard with indices and missions
    │   │   ├── Trade.tsx        # Stock browser and trading screen
    │   │   ├── StockDetail.tsx  # Individual stock with chart and buy/sell
    │   │   ├── Portfolio.tsx    # Holdings, P&L, and diversity analytics
    │   │   ├── Learn.tsx        # Course and lesson browser
    │   │   ├── LearnLesson.tsx  # Lesson content viewer
    │   │   ├── LessonOrQuizPage.tsx
    │   │   ├── TimeMachine.tsx  # Historical scenario simulator
    │   │   ├── LossDebrief.tsx  # Post-scenario AI debrief
    │   │   ├── Leaderboard.tsx
    │   │   ├── Profile.tsx
    │   │   ├── Onboarding.tsx
    │   │   └── Splash.tsx
    │   ├── components/
    │   │   ├── BottomNav.tsx
    │   │   ├── TopBar.tsx
    │   │   ├── MarketTicker.tsx
    │   │   ├── MarketSkeleton.tsx
    │   │   ├── MarketStatusBanner.jsx
    │   │   ├── PaperBadge.tsx
    │   │   ├── CongratsModal.jsx
    │   │   ├── MissionConfirmModal.jsx
    │   │   ├── UndoSnackbar.jsx
    │   │   └── XPToast.jsx
    │   ├── context/
    │   │   └── LivePricesContext.tsx   # Global live price state
    │   ├── hooks/
    │   │   └── useCachedMarketData.ts
    │   ├── data/
    │   │   ├── courseData.js           # Static lesson and quiz content
    │   │   └── missionsData.js         # Mission definitions
    │   └── utils/
    │       ├── marketStatus.ts         # Exchange open/close logic
    │       ├── missionEngine.js        # Mission progress evaluation
    │       ├── missionUtils.js
    │       ├── progressUtils.js        # XP and level calculations
    │       ├── xpUtils.js
    │       ├── activityUtils.js
    │       ├── priceRefresh.ts         # Polling and refresh scheduling
    │       └── userScopedStorage.js    # Per-user localStorage helpers
    └── public/
        └── Icons/
            └── logo.png
```

---

## Impact

- Makes investing accessible for beginners by removing the barrier of real financial risk
- Reduces fear of financial loss through realistic simulation in a consequence-free environment
- Encourages long-term financial literacy through consistent, habit-forming practice

---

## Future Improvements

- Real-time WebSocket updates to replace polling-based data refresh
- Expanded mentorship layer with more personalised learning paths
- Advanced AI insights including sentiment analysis and sector trend detection
- Social trading features — follow other learners, share portfolios, and compare performance
- Token-based authentication and secure session management

---

## Acknowledgements

- [Finnhub API](https://finnhub.io) — real-time stock market data
- [Yahoo Finance (yfinance)](https://github.com/ranaroussi/yfinance) — fallback market data
- [Groq AI](https://groq.com) — fast AI inference powering the mentor and portfolio analysis
- [Capacitor](https://capacitorjs.com) — Android APK export from the web app

---

<div align="center">

StockIt combines FinTech, EdTech, AI, and Gamification to create a safe and engaging investing learning experience.

Built for the next generation of investors.

</div>
