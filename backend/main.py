from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from datetime import datetime, timezone

load_dotenv()

from routers import user, portfolio, stocks, trades, ai, learn, time_machine, dashboard

app = FastAPI(title="InvestSim API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from starlette.types import ASGIApp, Receive, Scope, Send
from services.db import active_user_email

class UserEmailASGIMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] == "http":
            email = ""
            for name, value in scope.get("headers", []):
                if name.lower() == b"x-user-email":
                    email = value.decode("latin1")
                    break
            
            if email:
                token = active_user_email.set(email)
                try:
                    await self.app(scope, receive, send)
                finally:
                    active_user_email.reset(token)
                return
        await self.app(scope, receive, send)

app.add_middleware(UserEmailASGIMiddleware)

app.include_router(user.router, prefix="/api/user")
app.include_router(portfolio.router, prefix="/api/portfolio")
app.include_router(stocks.router, prefix="/api/stocks")
app.include_router(trades.router, prefix="/api/trades")
app.include_router(ai.router, prefix="/api/ai")
app.include_router(learn.router, prefix="/api/learn")
app.include_router(time_machine.router, prefix="/api/loss-simulator")
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
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
