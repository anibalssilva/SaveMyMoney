from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import (
    PredictionRequest,
    PredictionResponse,
    InsightsResponse,
    CategoryInsights
)
from app.database import get_database
from app.ml.linear_predictor import LinearPredictor
from app.ml.lstm_predictor import LSTMPredictor, TENSORFLOW_AVAILABLE
from datetime import datetime
from typing import List, Dict
from bson import ObjectId

router = APIRouter()

async def get_user_transactions(user_id: str, category: str = None) -> List[Dict]:
    """Fetch user transactions from MongoDB"""
    try:
        print(f"[DB] Fetching transactions for user_id={user_id}, category={category}")
        db = get_database()

        if db is None:
            print("[DB ERROR] Database connection is None!")
            return []

        transactions_collection = db.transactions

        # Convert user_id string to ObjectId for MongoDB query
        try:
            user_object_id = ObjectId(user_id)
            query = {"user": user_object_id, "type": "expense"}
        except Exception as e:
            print(f"[DB ERROR] Invalid ObjectId format for user_id={user_id}: {e}")
            # Fallback: try as string in case some records use string
            query = {"user": user_id, "type": "expense"}

        if category:
            query["category"] = category

        print(f"[DB] Query: {query}")
        cursor = transactions_collection.find(query).sort("date", 1)
        transactions = await cursor.to_list(length=1000)
        print(f"[DB] Retrieved {len(transactions)} transactions")

        # Convert MongoDB ObjectId to string
        for trans in transactions:
            trans['_id'] = str(trans['_id'])
            trans['user'] = str(trans['user'])

        return transactions
    except Exception as e:
        print(f"[DB ERROR] Error fetching transactions: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return []

@router.post("/predict", response_model=PredictionResponse)
async def predict_expenses(request: PredictionRequest):
    """
    Predict future expenses using Linear Regression or LSTM
    """
    try:
        print(f"[PREDICT] Request: user_id={request.user_id}, category={request.category}, days_ahead={request.days_ahead}, model={request.model_type}")

        # Fetch user transactions
        transactions = await get_user_transactions(request.user_id, request.category)
        print(f"[PREDICT] Found {len(transactions)} transactions")

        if not transactions:
            raise HTTPException(
                status_code=404,
                detail="No transaction data found for this user"
            )

        # Select model based on request
        if request.model_type == "lstm":
            if not TENSORFLOW_AVAILABLE:
                raise HTTPException(
                    status_code=503,
                    detail="LSTM model not available. TensorFlow is not installed. Using linear regression instead."
                )
            predictor = LSTMPredictor(lookback=7)
        else:
            predictor = LinearPredictor()

        print(f"[PREDICT] Using predictor: {predictor.__class__.__name__}")

        # Make predictions
        result = predictor.predict(transactions, request.days_ahead)
        print(f"[PREDICT] Prediction successful: total={result['total_predicted']}, trend={result['trend']}")

        # Prepare response
        response = PredictionResponse(
            user_id=request.user_id,
            category=request.category,
            predictions=result["predictions"],
            model_type=request.model_type,
            accuracy_score=result.get("accuracy_score"),
            total_predicted=result["total_predicted"],
            avg_daily_spending=result["avg_daily_spending"],
            trend=result["trend"]
        )

        return response

    except HTTPException:
        raise
    except ValueError as e:
        print(f"[PREDICT ERROR] ValueError: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"[PREDICT ERROR] Exception: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.get("/insights/{user_id}", response_model=InsightsResponse)
async def get_spending_insights(user_id: str, days_ahead: int = 30):
    """
    Get spending insights across all categories
    """
    try:
        # Fetch all transactions
        transactions = await get_user_transactions(user_id)

        if not transactions:
            raise HTTPException(
                status_code=404,
                detail="No transaction data found for this user"
            )

        # Get unique categories
        categories = list(set([t['category'] for t in transactions]))

        category_insights = []
        total_predicted = 0.0

        predictor = LinearPredictor()

        for category in categories:
            # Filter transactions by category
            cat_transactions = [t for t in transactions if t['category'] == category]

            if len(cat_transactions) < 2:
                continue

            # Make predictions
            try:
                result = predictor.predict(cat_transactions, days_ahead)

                # Calculate current average
                import pandas as pd
                df = pd.DataFrame(cat_transactions)
                current_avg = df['amount'].mean()

                # Create insight
                insight = CategoryInsights(
                    category=category,
                    current_avg=float(current_avg),
                    predicted_avg=result["avg_daily_spending"],
                    trend=result["trend"],
                    recommendation=_generate_recommendation(
                        result["trend"],
                        result["avg_daily_spending"],
                        float(current_avg)
                    )
                )
                category_insights.append(insight)
                total_predicted += result["total_predicted"]

            except Exception as e:
                print(f"Error predicting for category {category}: {e}")
                continue

        # Determine overall trend
        increasing_count = sum(1 for ci in category_insights if ci.trend == "increasing")
        decreasing_count = sum(1 for ci in category_insights if ci.trend == "decreasing")

        if increasing_count > decreasing_count:
            overall_trend = "increasing"
        elif decreasing_count > increasing_count:
            overall_trend = "decreasing"
        else:
            overall_trend = "stable"

        response = InsightsResponse(
            user_id=user_id,
            total_predicted_spending=total_predicted,
            categories=category_insights,
            overall_trend=overall_trend
        )

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Insights error: {str(e)}")

@router.get("/category/{user_id}/{category}")
async def predict_category(
    user_id: str,
    category: str,
    days_ahead: int = 30,
    model_type: str = "linear"
):
    """
    Predict expenses for a specific category
    """
    request = PredictionRequest(
        user_id=user_id,
        category=category,
        days_ahead=days_ahead,
        model_type=model_type
    )
    return await predict_expenses(request)

@router.get("/compare/{user_id}")
async def compare_models(user_id: str, days_ahead: int = 30):
    """
    Compare predictions from both Linear Regression and LSTM models
    """
    try:
        transactions = await get_user_transactions(user_id)

        if not transactions:
            raise HTTPException(
                status_code=404,
                detail="No transaction data found for this user"
            )

        # Linear prediction
        linear_predictor = LinearPredictor()
        linear_result = linear_predictor.predict(transactions, days_ahead)

        result = {
            "user_id": user_id,
            "days_ahead": days_ahead,
            "linear_regression": {
                "total_predicted": linear_result["total_predicted"],
                "avg_daily_spending": linear_result["avg_daily_spending"],
                "trend": linear_result["trend"],
                "accuracy_score": linear_result.get("accuracy_score", 0.0)
            }
        }

        # LSTM prediction (if available)
        if TENSORFLOW_AVAILABLE and len(transactions) >= 8:
            try:
                lstm_predictor = LSTMPredictor()
                lstm_result = lstm_predictor.predict(transactions, days_ahead)
                result["lstm"] = {
                    "total_predicted": lstm_result["total_predicted"],
                    "avg_daily_spending": lstm_result["avg_daily_spending"],
                    "trend": lstm_result["trend"],
                    "accuracy_score": lstm_result.get("accuracy_score", 0.0)
                }
            except Exception as e:
                result["lstm_error"] = str(e)
        else:
            result["lstm"] = "Not available (requires TensorFlow and at least 8 days of data)"

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison error: {str(e)}")

def _generate_recommendation(trend: str, predicted_avg: float, current_avg: float) -> str:
    """Generate spending recommendation based on trend"""
    if trend == "increasing":
        increase_pct = ((predicted_avg - current_avg) / current_avg * 100) if current_avg > 0 else 0
        return f"Seus gastos nesta categoria estão aumentando (~{increase_pct:.1f}%). Considere estabelecer um limite."
    elif trend == "decreasing":
        decrease_pct = ((current_avg - predicted_avg) / current_avg * 100) if current_avg > 0 else 0
        return f"Ótimo! Seus gastos estão diminuindo (~{decrease_pct:.1f}%). Continue assim!"
    else:
        return "Seus gastos estão estáveis. Mantenha o controle!"
