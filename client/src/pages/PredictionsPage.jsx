import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PredictionChart from '../components/PredictionChart';
import Toast from '../components/Toast';
import './PredictionsPage.css';

const PredictionsPage = () => {
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [insights, setInsights] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const formatCap = (s) => (typeof s === 'string' && s.length > 0)
    ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
    : s;
  const [daysAhead, setDaysAhead] = useState(30);
  const [modelType, setModelType] = useState('linear');
  const [categories, setCategories] = useState([]);
  const [mlApiStatus, setMlApiStatus] = useState('unknown');

  useEffect(() => {
    checkMLApiStatus();
    fetchCategories();
    fetchInsights();
  }, []);

  const checkMLApiStatus = async () => {
    try {
      const res = await api.get('/predictions/health');
      setMlApiStatus(res.data.status === 'connected' ? 'connected' : 'disconnected');
    } catch (err) {
      setMlApiStatus('disconnected');
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/transactions');
      const uniqueCategories = [...new Set(res.data.map(t => t.category))];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await api.get('/predictions/insights', {
        params: { days_ahead: daysAhead }
      });
      setInsights(res.data);
    } catch (err) {
      console.error('Error fetching insights:', err);
      if (err.response?.status === 503) {
        setToast({
          message: 'Serviço de previsões indisponível. Certifique-se de que a API ML está rodando.',
          type: 'error',
          duration: 6000
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    if (mlApiStatus !== 'connected') {
      setToast({
        message: 'Serviço de ML não disponível. Inicie a API FastAPI primeiro.',
        type: 'error',
        duration: 5000
      });
      return;
    }

    setLoading(true);
    setPredictions(null);

    try {
      const payload = {
        category: selectedCategory === 'all' ? null : selectedCategory,
        days_ahead: parseInt(daysAhead),
        model_type: modelType
      };

      const res = await api.post('/predictions/predict', payload);
      setPredictions(res.data);

      setToast({
        message: `Previsão gerada com sucesso! Modelo: ${modelType.toUpperCase()}`,
        type: 'success',
        duration: 3000
      });
    } catch (err) {
      console.error('Prediction error:', err);
      const errorMsg = err.response?.data?.msg || 'Erro ao gerar previsão';
      setToast({
        message: errorMsg,
        type: 'error',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing':
        return '📈';
      case 'decreasing':
        return '📉';
      default:
        return '➡️';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'increasing':
        return '#f56565';
      case 'decreasing':
        return '#48bb78';
      default:
        return '#4299e1';
    }
  };

  const getTrendText = (trend) => {
    switch (trend) {
      case 'increasing':
        return 'Aumentando';
      case 'decreasing':
        return 'Diminuindo';
      default:
        return 'Estável';
    }
  };

  return (
    <div className="predictions-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => setToast(null)}
        />
      )}

      <div className="predictions-header">
        <h1>Previsões de Gastos</h1>
        <p className="subtitle">
          Use Machine Learning para prever seus gastos futuros e tome decisões mais informadas
        </p>
        <div className={`ml-status ml-status-${mlApiStatus}`}>
          <span className="status-dot"></span>
          API ML: {mlApiStatus === 'connected' ? 'Conectada' : 'Desconectada'}
        </div>
      </div>

      {/* Prediction Form */}
      <div className="prediction-form-card">
        <h2>Configurar Previsão</h2>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="category">Categoria</label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">Todas as categorias</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {formatCap(cat)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="daysAhead">Dias à Frente</label>
            <input
              type="number"
              id="daysAhead"
              value={daysAhead}
              onChange={(e) => setDaysAhead(e.target.value)}
              min="7"
              max="365"
            />
          </div>

          <div className="form-group">
            <label htmlFor="modelType">Modelo de ML</label>
            <select
              id="modelType"
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
            >
              <option value="linear">Regressão Linear</option>
              <option value="lstm">LSTM (Deep Learning)</option>
            </select>
          </div>

          <div className="form-actions">
            <button
              className="btn btn-primary"
              onClick={handlePredict}
              disabled={loading || mlApiStatus !== 'connected'}
            >
              {loading ? 'Gerando...' : 'Gerar Previsão'}
            </button>
          </div>
        </div>

        <div className="model-info">
          <div className="info-card">
            <h4>Regressão Linear</h4>
            <p>Modelo simples e rápido. Ideal para tendências lineares.</p>
          </div>
          <div className="info-card">
            <h4>LSTM</h4>
            <p>Rede neural para padrões complexos. Requer mais dados históricos.</p>
          </div>
        </div>
      </div>

      {/* Prediction Results */}
      {predictions && (
        <div className="prediction-results">
          <div className="results-summary">
            <div className="summary-card">
              <div className="card-icon">💰</div>
              <div className="card-content">
                <h3>Total Previsto</h3>
                <p className="value">R$ {predictions.total_predicted.toFixed(2)}</p>
                <p className="detail">Para os próximos {daysAhead} dias</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">📊</div>
              <div className="card-content">
                <h3>Média Diária</h3>
                <p className="value">R$ {predictions.avg_daily_spending.toFixed(2)}</p>
                <p className="detail">Gasto médio por dia</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">{getTrendIcon(predictions.trend)}</div>
              <div className="card-content">
                <h3>Tendência</h3>
                <p
                  className="value"
                  style={{ color: getTrendColor(predictions.trend) }}
                >
                  {getTrendText(predictions.trend)}
                </p>
                <p className="detail">Padrão identificado</p>
              </div>
            </div>

            {predictions.accuracy_score !== null && (
              <div className="summary-card">
                <div className="card-icon">🎯</div>
                <div className="card-content">
                  <h3>Confiança</h3>
                  <p className="value">{(predictions.accuracy_score * 100).toFixed(1)}%</p>
                  <p className="detail">Acurácia do modelo</p>
                </div>
              </div>
            )}
          </div>

          <PredictionChart
            predictions={predictions.predictions}
            title={`Previsão de Gastos - ${
              selectedCategory === 'all' ? 'Todas as Categorias' : selectedCategory
            }`}
            showConfidence={true}
          />
        </div>
      )}

      {/* Insights Section */}
      {insights && insights.categories && insights.categories.length > 0 && (
        <div className="insights-section">
          <h2>Insights por Categoria</h2>
          <div className="insights-grid">
            {insights.categories.map((insight) => (
              <div key={insight.category} className="insight-card">
                <div className="insight-header">
                  <h3>{insight.category}</h3>
                  <span
                    className="trend-badge"
                    style={{
                      backgroundColor: `${getTrendColor(insight.trend)}20`,
                      color: getTrendColor(insight.trend)
                    }}
                  >
                    {getTrendIcon(insight.trend)} {getTrendText(insight.trend)}
                  </span>
                </div>

                <div className="insight-stats">
                  <div className="stat">
                    <span className="label">Média Atual:</span>
                    <span className="value">R$ {insight.current_avg.toFixed(2)}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Média Prevista:</span>
                    <span className="value">R$ {insight.predicted_avg.toFixed(2)}</span>
                  </div>
                </div>

                <div className="insight-recommendation">
                  <p>{insight.recommendation}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="overall-insight">
            <div className="overall-header">
              <h3>Visão Geral</h3>
              <span
                className="trend-badge-large"
                style={{
                  backgroundColor: `${getTrendColor(insights.overall_trend)}20`,
                  color: getTrendColor(insights.overall_trend)
                }}
              >
                {getTrendIcon(insights.overall_trend)} Tendência Geral: {getTrendText(insights.overall_trend)}
              </span>
            </div>
            <p className="overall-total">
              Total previsto para todas as categorias: <strong>R$ {insights.total_predicted_spending.toFixed(2)}</strong>
            </p>
          </div>
        </div>
      )}

      {mlApiStatus !== 'connected' && (
        <div className="ml-api-warning">
          <h3>⚠️ API de Machine Learning não disponível</h3>
          <p>Para usar as previsões, inicie a API FastAPI:</p>
          <div className="code-block">
            <code>cd ml-api</code>
            <code>pip install -r requirements.txt</code>
            <code>python -m uvicorn app.main:app --reload --port 8000</code>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionsPage;
