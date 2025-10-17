from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime

class BaseSchema(BaseModel):
    # Allow fields starting with 'model_' (e.g., model_type) without warnings
    model_config = ConfigDict(protected_namespaces=())


class Transaction(BaseSchema):
    description: str
    amount: float
    date: datetime
    category: str
    type: str

class PredictionRequest(BaseSchema):
    user_id: str
    category: Optional[str] = None
    days_ahead: int = Field(default=30, ge=1, le=365)
    model_type: str = Field(default="linear", pattern="^(linear|lstm)$")

class PredictionPoint(BaseSchema):
    date: str
    predicted_amount: float
    confidence_lower: Optional[float] = None
    confidence_upper: Optional[float] = None

class PredictionResponse(BaseSchema):
    user_id: str
    category: Optional[str]
    predictions: List[PredictionPoint]
    model_type: str
    accuracy_score: Optional[float] = None
    total_predicted: float
    avg_daily_spending: float
    trend: str  # "increasing", "decreasing", "stable"
    created_at: datetime = Field(default_factory=datetime.now)

class CategoryInsights(BaseSchema):
    category: str
    current_avg: float
    predicted_avg: float
    trend: str
    recommendation: str

class InsightsResponse(BaseSchema):
    user_id: str
    total_predicted_spending: float
    categories: List[CategoryInsights]
    overall_trend: str
    created_at: datetime = Field(default_factory=datetime.now)
