StockIt – Learn Investing Without Losing Money
A gamified stock market simulator with AI mentorship, real-time data, and risk-free trading.

________________________________________
 Problem Statement
Most young investors:
•	Fear losing real money
•	Lack practical market experience
•	Use trading apps that focus on execution, not learning
Despite high awareness, actual participation remains low.
________________________________________
 Our Solution
InvestSim bridges the gap by combining:
•	Realistic paper trading with live-like market data
•	 AI-powered mentor for guidance
•	 Gamified learning system (XP, missions, streaks)
•	 Scenario-based simulations (loss & crash analysis)
________________________________________
User Experience
1. Home Dashboard
  <img width="293" height="747" alt="image" src="https://github.com/user-attachments/assets/086bcc9a-38df-4eba-9cb4-97f69511f79a" />

•	Portfolio overview
•	Market indices
•	Missions & streaks
________________________________________
2. Trading Screen
  
•	Live stock prices
•	Buy/Sell simulation
•	Market indicators
________________________________________
3.  Portfolio Analytics
  
•	Profit & Loss tracking
•	Diversity score
•	Best/Worst performers
________________________________________
4.  Learning & Gamification
  

•	Lessons & quizzes
•	XP system
•	Missions & streaks
________________________________________
6.  Loss Simulator (Time Machine)
  
•	Simulate market crashes
•	Learn risk management
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
________________________________________
 System Architecture
 
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
