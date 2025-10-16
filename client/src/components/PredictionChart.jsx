import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart
} from 'recharts';
import './PredictionChart.css';

const PredictionChart = ({ predictions, title, showConfidence = true }) => {
  if (!predictions || predictions.length === 0) {
    return (
      <div className="prediction-chart-empty">
        <p>Não há dados suficientes para gerar previsões.</p>
      </div>
    );
  }

  // Format data for chart
  const chartData = predictions.map(pred => ({
    date: new Date(pred.date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    }),
    amount: parseFloat(pred.predicted_amount.toFixed(2)),
    lower: pred.confidence_lower ? parseFloat(pred.confidence_lower.toFixed(2)) : null,
    upper: pred.confidence_upper ? parseFloat(pred.confidence_upper.toFixed(2)) : null,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{payload[0].payload.date}</p>
          <p className="tooltip-amount">
            Previsto: <strong>R$ {payload[0].value.toFixed(2)}</strong>
          </p>
          {showConfidence && payload[0].payload.lower !== null && (
            <p className="tooltip-range">
              Intervalo: R$ {payload[0].payload.lower.toFixed(2)} - R$ {payload[0].payload.upper.toFixed(2)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="prediction-chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4299e1" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#4299e1" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ed8936" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ed8936" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
          <XAxis
            dataKey="date"
            stroke="#a0aec0"
            tick={{ fill: '#a0aec0', fontSize: 12 }}
          />
          <YAxis
            stroke="#a0aec0"
            tick={{ fill: '#a0aec0', fontSize: 12 }}
            tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: '#e2e8f0' }}
            iconType="line"
          />

          {showConfidence && chartData[0].lower !== null && (
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="url(#colorConfidence)"
              fillOpacity={0.3}
              name="Intervalo de Confiança"
            />
          )}

          <Line
            type="monotone"
            dataKey="amount"
            stroke="#4299e1"
            strokeWidth={3}
            dot={{ fill: '#4299e1', r: 4 }}
            activeDot={{ r: 6 }}
            name="Gasto Previsto"
          />

          {showConfidence && chartData[0].lower !== null && (
            <Line
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="none"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PredictionChart;
