# InvestSim Backend

An interactive, AI-powered paper trading simulator designed for young Indian investors to safely learn the ropes of the market without real capital risk.

## Setup Instructions

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Set up environment variables:
   Copy `.env.example` to `.env` and configure your `GROQ_API_KEY`:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   FRONTEND_URL=http://localhost:3000
   ```

## Running the Server

Start the FastAPI application natively with Uvicorn:
```bash
python main.py
```
The application will run on **http://localhost:8000**.

## Health Check

Verify all services and JSON DB connections are functioning:
- **`GET /api/health`** (http://localhost:8000/api/health)

## Endpoints Summary

### User & Architecture
- `GET /api/user`: Returns the state of the active Mock user.
- `PATCH /api/user/xp`: Manual hook to push points into XP leveling pool.
- `GET /api/user/leaderboard`: Renders returning/learning peer leaderboards.

### Dashboard
- `GET /api/dashboard`: Hydrates entire UI splash aggregating portfolio state, missions, recent activities.

### Portfolio & Trades
- `GET /api/portfolio`: Calculates entire diverse metrics array and P&L against active prices.
- `GET /api/portfolio/transactions`: Transaction history.
- `POST /api/trades/buy`: Safely execute market stock purchases with existing funds.
- `POST /api/trades/sell`: Clear virtual holdings to recognize cash assets.

### Markets (yfinance)
- `GET /api/stocks`: 8 real-market stocks data payload.
- `GET /api/stocks/{symbol}`: Deep-dive live metrics for a particular symbol.
- `GET /api/stocks/{symbol}/history?period=1d`: Grabs standard candlestick format historical data.

### Learn & Leveling
- `GET /api/learn/modules`: Static learning structures with interactive checks.
- `GET /api/learn/modules/{moduleId}/lessons`: Retrieves precise chapter contents and quizzes.
- `POST /api/learn/complete`: Record quiz logic safely locking completions.
- `GET /api/learn/missions`: Fetches tasks and progress states.
- `POST /api/learn/missions/complete`: Trigger completions safely.

### The AI Engine (Groq Wrapper natively)
- `POST /api/ai/mentor`: Invokes context-rich AI coaching via Hinglish.
- `POST /api/ai/loss-debrief`: Triggers 3%+ crash narrative analysis for grounding.
- `POST /api/ai/analyze-portfolio`: Generates fully-aware user specific diversification summaries.
- `GET /api/ai/mentor-history`: Reads conversation history from logging data store.

### Time Machine (Historical Decisions)
- `GET /api/time-machine/scenarios`: Replayable era-defining market moments.
- `POST /api/time-machine/attempt`: Submits outcome-decisions and checks historical context.
- `GET /api/time-machine/score`: User summary logic across historical plays.
