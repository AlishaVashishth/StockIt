from pydantic import BaseModel
from typing import Optional

class XpUpdateRequest(BaseModel):
    xpPoints: int

class StartSessionRequest(BaseModel):
    name: str
    email: str
    password: str

class BuyTradeRequest(BaseModel):
    stockSymbol: str
    quantity: int
    orderType: str = "MARKET"

class SellTradeRequest(BaseModel):
    stockSymbol: str
    quantity: int

class MentorInsightRequest(BaseModel):
    action: str
    symbol: str
    timeframe: Optional[str] = "1d"
    requestId: Optional[str] = None

class AnalyzePortfolioRequest(BaseModel):
    requestId: Optional[str] = None

class LossDebriefRequest(BaseModel):
    stockSymbol: str
    lossAmount: float

class LessonCompleteRequest(BaseModel):
    lessonId: int
    moduleId: int
    quizScore: int

class MissionCompleteRequest(BaseModel):
    missionKey: str

class TimeMachineAttemptRequest(BaseModel):
    scenarioId: int
    choice: str
