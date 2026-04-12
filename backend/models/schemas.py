from pydantic import BaseModel
from typing import Optional

class XpUpdateRequest(BaseModel):
    xpPoints: int

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
