from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from datetime import datetime, timezone

from routers import user, portfolio, stocks, trades, ai, learn, time_machine, dashboard

load_dotenv()

app = FastAPI(title="InvestSim API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router, prefix="/api/user")
app.include_router(portfolio.router, prefix="/api/portfolio")
app.include_router(stocks.router, prefix="/api/stocks")
app.include_router(trades.router, prefix="/api/trades")
app.include_router(ai.router, prefix="/api/ai")
app.include_router(learn.router, prefix="/api/learn")
app.include_router(time_machine.router, prefix="/api/time-machine")
app.include_router(dashboard.router, prefix="/api/dashboard")

@app.get("/api/health")
def read_health():
    from services.db import DATA_DIR
    groq_configured = bool(os.getenv("GROQ_API_KEY"))
    files = ["user.json", "holdings.json", "transactions.json", "missions.json", 
             "lessons.json", "time_machine_attempts.json", "loss_debriefs.json"]
    data_files_present = all(os.path.exists(os.path.join(DATA_DIR, f)) for f in files)
    
    return {
        "status": "healthy",
        "groqConfigured": groq_configured,
        "dataFilesPresent": data_files_present,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/")
def read_root():
    return {"status": "InvestSim API running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
