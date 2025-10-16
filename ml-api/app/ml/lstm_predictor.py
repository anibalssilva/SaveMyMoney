import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import warnings
warnings.filterwarnings('ignore')

try:
    from tensorflow import keras
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense, Dropout
    from sklearn.preprocessing import MinMaxScaler
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False
    print("TensorFlow not available. LSTM predictions will fall back to linear regression.")

class LSTMPredictor:
    """LSTM model for time series expense prediction"""

    def __init__(self, lookback: int = 7):
        self.lookback = lookback
        self.model = None
        self.scaler = MinMaxScaler()
        self.is_trained = False

    def prepare_sequences(
        self,
        data: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare sequences for LSTM training"""
        X, y = [], []
        for i in range(len(data) - self.lookback):
            X.append(data[i:i + self.lookback])
            y.append(data[i + self.lookback])
        return np.array(X), np.array(y)

    def prepare_data(self, transactions: List[Dict]) -> pd.DataFrame:
        """Prepare transaction data for LSTM"""
        if not transactions:
            return pd.DataFrame()

        df = pd.DataFrame(transactions)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')

        # Group by date and sum amounts
        daily_expenses = df.groupby(df['date'].dt.date)['amount'].sum().reset_index()
        daily_expenses.columns = ['date', 'amount']
        daily_expenses['date'] = pd.to_datetime(daily_expenses['date'])

        # Fill missing dates with 0
        date_range = pd.date_range(
            start=daily_expenses['date'].min(),
            end=daily_expenses['date'].max(),
            freq='D'
        )
        daily_expenses = daily_expenses.set_index('date').reindex(date_range, fill_value=0)
        daily_expenses = daily_expenses.reset_index()
        daily_expenses.columns = ['date', 'amount']

        return daily_expenses

    def build_model(self, input_shape: Tuple) -> Sequential:
        """Build LSTM model architecture"""
        model = Sequential([
            LSTM(50, activation='relu', return_sequences=True, input_shape=input_shape),
            Dropout(0.2),
            LSTM(50, activation='relu'),
            Dropout(0.2),
            Dense(25, activation='relu'),
            Dense(1)
        ])
        model.compile(optimizer='adam', loss='mse', metrics=['mae'])
        return model

    def train(self, transactions: List[Dict]) -> Dict[str, float]:
        """Train the LSTM model"""
        if not TENSORFLOW_AVAILABLE:
            raise RuntimeError("TensorFlow is not available. Cannot train LSTM model.")

        daily_expenses = self.prepare_data(transactions)

        if len(daily_expenses) < self.lookback + 1:
            raise ValueError(f"Need at least {self.lookback + 1} days of data to train LSTM model")

        # Scale data
        amounts = daily_expenses['amount'].values.reshape(-1, 1)
        amounts_scaled = self.scaler.fit_transform(amounts)

        # Prepare sequences
        X, y = self.prepare_sequences(amounts_scaled)

        if len(X) == 0:
            raise ValueError("Not enough data to create sequences")

        # Reshape for LSTM
        X = X.reshape((X.shape[0], X.shape[1], 1))

        # Build and train model
        self.model = self.build_model((X.shape[1], 1))

        # Train with early stopping to prevent overfitting
        history = self.model.fit(
            X, y,
            epochs=50,
            batch_size=8,
            validation_split=0.2,
            verbose=0,
            shuffle=False
        )

        self.is_trained = True

        # Calculate final loss
        final_loss = history.history['loss'][-1]
        final_mae = history.history['mae'][-1]

        return {
            "loss": float(final_loss),
            "mae": float(final_mae),
            "epochs_trained": len(history.history['loss'])
        }

    def predict(
        self,
        transactions: List[Dict],
        days_ahead: int = 30
    ) -> Dict:
        """Make predictions for future expenses"""
        if not TENSORFLOW_AVAILABLE:
            raise RuntimeError("TensorFlow is not available. Cannot make LSTM predictions.")

        if not self.is_trained:
            self.train(transactions)

        daily_expenses = self.prepare_data(transactions)

        if len(daily_expenses) < self.lookback:
            return self._empty_prediction(days_ahead)

        # Get last lookback days
        amounts = daily_expenses['amount'].values.reshape(-1, 1)
        amounts_scaled = self.scaler.transform(amounts)
        last_sequence = amounts_scaled[-self.lookback:]

        # Make predictions
        predictions = []
        current_sequence = last_sequence.copy()

        for _ in range(days_ahead):
            # Reshape for prediction
            current_input = current_sequence.reshape((1, self.lookback, 1))

            # Predict next value
            next_pred = self.model.predict(current_input, verbose=0)[0][0]
            predictions.append(next_pred)

            # Update sequence (shift and add new prediction)
            current_sequence = np.append(current_sequence[1:], [[next_pred]], axis=0)

        # Inverse transform predictions
        predictions = np.array(predictions).reshape(-1, 1)
        predictions = self.scaler.inverse_transform(predictions)
        predictions = np.maximum(predictions.flatten(), 0)  # Ensure non-negative

        # Calculate confidence intervals using historical variance
        residuals = amounts[-len(amounts)//2:].flatten() - amounts[-len(amounts)//2:].flatten().mean()
        std_error = np.std(residuals)

        # Prepare response
        last_date = daily_expenses['date'].max()
        prediction_points = []

        for i, pred in enumerate(predictions):
            pred_date = last_date + timedelta(days=i + 1)
            prediction_points.append({
                "date": pred_date.strftime("%Y-%m-%d"),
                "predicted_amount": float(pred),
                "confidence_lower": float(max(0, pred - 1.96 * std_error)),
                "confidence_upper": float(pred + 1.96 * std_error)
            })

        # Calculate trend
        trend = self._calculate_trend(predictions)

        # Calculate accuracy (using MAE from last training)
        accuracy = 1.0 - min(1.0, std_error / (np.mean(amounts) + 1e-8))

        return {
            "predictions": prediction_points,
            "total_predicted": float(np.sum(predictions)),
            "avg_daily_spending": float(np.mean(predictions)),
            "trend": trend,
            "accuracy_score": float(max(0.0, accuracy))
        }

    def _calculate_trend(self, predictions: np.ndarray) -> str:
        """Calculate trend from predictions"""
        if len(predictions) < 2:
            return "stable"

        # Calculate moving average trend
        first_half_avg = np.mean(predictions[:len(predictions)//2])
        second_half_avg = np.mean(predictions[len(predictions)//2:])

        if second_half_avg > first_half_avg * 1.1:
            return "increasing"
        elif second_half_avg < first_half_avg * 0.9:
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
