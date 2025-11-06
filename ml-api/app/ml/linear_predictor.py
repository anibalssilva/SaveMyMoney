import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from datetime import datetime, timedelta
from typing import List, Tuple, Dict

class LinearPredictor:
    """Linear Regression model for expense prediction"""

    def __init__(self):
        self.model = LinearRegression()
        self.scaler = StandardScaler()
        self.is_trained = False

    def prepare_data(self, transactions: List[Dict]) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare transaction data for training"""
        if not transactions:
            return np.array([]), np.array([])

        # Convert to DataFrame
        df = pd.DataFrame(transactions)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')

        # Group by date and sum amounts
        daily_expenses = df.groupby(df['date'].dt.date)['amount'].sum().reset_index()
        daily_expenses.columns = ['date', 'amount']

        # Convert date column back to datetime for calculations
        daily_expenses['date'] = pd.to_datetime(daily_expenses['date'])

        # Create features: days since first transaction
        first_date = daily_expenses['date'].min()
        daily_expenses['days_since_start'] = (
            daily_expenses['date'] - first_date
        ).dt.days

        X = daily_expenses[['days_since_start']].values
        y = daily_expenses['amount'].values

        return X, y

    def train(self, transactions: List[Dict]) -> Dict[str, float]:
        """Train the linear regression model"""
        X, y = self.prepare_data(transactions)

        if len(X) < 2:
            raise ValueError("Need at least 2 data points to train the model")

        # Scale features
        X_scaled = self.scaler.fit_transform(X)

        # Train model
        self.model.fit(X_scaled, y)
        self.is_trained = True

        # Calculate R² score
        score = self.model.score(X_scaled, y)

        return {
            "r2_score": score,
            "intercept": float(self.model.intercept_),
            "coefficient": float(self.model.coef_[0])
        }

    def predict(
        self,
        transactions: List[Dict],
        days_ahead: int = 30
    ) -> Dict:
        """Make predictions for future expenses"""
        if not self.is_trained:
            self.train(transactions)

        X, y = self.prepare_data(transactions)

        if len(X) == 0:
            return self._empty_prediction(days_ahead)

        # Get the last day number
        last_day = X[-1][0] if len(X) > 0 else 0

        # Create future days
        future_days = np.array([
            [last_day + i + 1] for i in range(days_ahead)
        ])

        # Scale and predict
        future_days_scaled = self.scaler.transform(future_days)
        predictions = self.model.predict(future_days_scaled)

        # Ensure predictions are non-negative
        predictions = np.maximum(predictions, 0)

        # Calculate confidence intervals (simple approach using std)
        residuals = y - self.model.predict(self.scaler.transform(X))
        std_error = np.std(residuals)

        # Get first transaction date to calculate actual dates
        df = pd.DataFrame(transactions)
        df['date'] = pd.to_datetime(df['date'])
        first_date = df['date'].min()

        # Prepare response
        prediction_points = []
        for i, pred in enumerate(predictions):
            pred_date = first_date + timedelta(days=int(last_day + i + 1))
            prediction_points.append({
                "date": pred_date.strftime("%Y-%m-%d"),
                "predicted_amount": float(pred),
                "confidence_lower": float(max(0, pred - 1.96 * std_error)),
                "confidence_upper": float(pred + 1.96 * std_error)
            })

        # Calculate trend
        trend = self._calculate_trend(predictions)

        return {
            "predictions": prediction_points,
            "total_predicted": float(np.sum(predictions)),
            "avg_daily_spending": float(np.mean(predictions)),
            "trend": trend,
            "accuracy_score": float(self.model.score(
                self.scaler.transform(X), y
            )) if len(X) > 1 else 0.0
        }

    def _calculate_trend(self, predictions: np.ndarray) -> str:
        """Calculate trend from predictions"""
        if len(predictions) < 2:
            return "stable"

        # Calculate slope of predictions
        x = np.arange(len(predictions))
        slope = np.polyfit(x, predictions, 1)[0]

        # Determine trend based on slope
        if slope > 0.1:
            return "increasing"
        elif slope < -0.1:
            return "decreasing"
        else:
            return "stable"

    def _empty_prediction(self, days_ahead: int) -> Dict:
        """Return empty prediction when no data available"""
        today = datetime.now()
        return {
            "predictions": [
                {
                    "date": (today + timedelta(days=i)).strftime("%Y-%m-%d"),
                    "predicted_amount": 0.0,
                    "confidence_lower": 0.0,
                    "confidence_upper": 0.0
                }
                for i in range(1, days_ahead + 1)
            ],
            "total_predicted": 0.0,
            "avg_daily_spending": 0.0,
            "trend": "stable",
            "accuracy_score": 0.0
        }
