import React, { useState, useEffect } from 'react';
import api from '../services/api';
import BudgetAlert from '../components/BudgetAlert';
import Toast from '../components/Toast';
import './DashboardPage.css';

const DashboardPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alertsRes, statsRes] = await Promise.all([
        api.get('/budgets/alerts'),
        api.get('/budgets/stats')
      ]);
      setAlerts(alertsRes.data);
      setStats(statsRes.data);

      // Show toast for critical alerts
      const criticalAlerts = alertsRes.data.filter(a => a.severity === 'danger');
      if (criticalAlerts.length > 0) {
        setToast({
          message: `Você tem ${criticalAlerts.length} orçamento(s) ultrapassado(s)!`,
          type: 'danger',
          duration: 6000
        });
      }
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setToast({
        message: 'Erro ao carregar dados do dashboard',
        type: 'error',
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDismissAlert = (alertId) => {
    setAlerts(alerts.filter(a => a.id !== alertId));
    setToast({
      message: 'Alerta dispensado',
      type: 'info',
      duration: 2000
    });
  };

  const getSummaryStats = () => {
    const totalBudgets = stats.length;
    const exceededCount = stats.filter(s => s.status === 'exceeded').length;
    const warningCount = stats.filter(s => s.status === 'warning').length;
    const okCount = stats.filter(s => s.status === 'ok').length;
    const totalLimit = stats.reduce((sum, s) => sum + s.limit, 0);
    const totalSpent = stats.reduce((sum, s) => sum + s.totalSpent, 0);

    return {
      totalBudgets,
      exceededCount,
      warningCount,
      okCount,
      totalLimit,
      totalSpent,
      totalRemaining: totalLimit - totalSpent,
      overallPercentage: totalLimit > 0 ? ((totalSpent / totalLimit) * 100).toFixed(1) : 0
    };
  };

  const summary = getSummaryStats();

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => setToast(null)}
        />
      )}

      <div className="dashboard-header">
        <h1>Dashboard Financeiro</h1>
        <p className="subtitle">Visão geral dos seus gastos e orçamentos</p>
      </div>

      {/* Summary Cards */}
      {stats.length > 0 && (
        <div className="summary-cards">
          <div className="summary-card card-primary">
            <div className="card-icon">💰</div>
            <div className="card-content">
              <h3>Orçamento Total</h3>
              <p className="card-value">R$ {summary.totalLimit.toFixed(2)}</p>
            </div>
          </div>

          <div className="summary-card card-expense">
            <div className="card-icon">💸</div>
            <div className="card-content">
              <h3>Total Gasto</h3>
              <p className="card-value">R$ {summary.totalSpent.toFixed(2)}</p>
              <p className="card-detail">{summary.overallPercentage}% do total</p>
            </div>
          </div>

          <div className="summary-card card-remaining">
            <div className="card-icon">💵</div>
            <div className="card-content">
              <h3>Saldo Restante</h3>
              <p className={`card-value ${summary.totalRemaining < 0 ? 'negative' : ''}`}>
                R$ {summary.totalRemaining.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="summary-card card-status">
            <div className="card-icon">📊</div>
            <div className="card-content">
              <h3>Status</h3>
              <div className="status-counts">
                {summary.exceededCount > 0 && (
                  <span className="status-badge danger">{summary.exceededCount} Excedidos</span>
                )}
                {summary.warningCount > 0 && (
                  <span className="status-badge warning">{summary.warningCount} Alerta</span>
                )}
                {summary.okCount > 0 && (
                  <span className="status-badge success">{summary.okCount} OK</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Alerts Section */}
      {alerts.length > 0 ? (
        <div className="alerts-section">
          <div className="section-header">
            <h2>⚠️ Alertas Ativos ({alerts.length})</h2>
            <p className="section-subtitle">
              Orçamentos que atingiram o limite de alerta ou foram ultrapassados
            </p>
          </div>
          <div className="alerts-list">
            {alerts.map((alert) => (
              <BudgetAlert
                key={alert.id}
                alert={alert}
                onDismiss={handleDismissAlert}
                showDetails={true}
              />
            ))}
          </div>
        </div>
      ) : stats.length > 0 ? (
        <div className="no-alerts-section">
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h2>Parabéns!</h2>
            <p>Todos os seus orçamentos estão dentro dos limites estabelecidos.</p>
          </div>
        </div>
      ) : (
        <div className="empty-state-section">
          <div className="empty-icon">📊</div>
          <h2>Nenhum orçamento configurado</h2>
          <p>Configure seus primeiros orçamentos para começar a controlar seus gastos!</p>
          <a href="/budgets" className="btn btn-primary">Configurar Orçamentos</a>
        </div>
      )}

      {/* Quick Stats */}
      {stats.length > 0 && (
        <div className="quick-stats-section">
          <h2>Visão Rápida por Categoria</h2>
          <div className="quick-stats-grid">
            {stats.slice(0, 6).map((stat) => (
              <div key={stat.id} className={`quick-stat-card status-${stat.status}`}>
                <div className="stat-header">
                  <h4>{stat.category}</h4>
                  <span className="stat-percentage">{stat.percentage}%</span>
                </div>
                <div className="mini-progress">
                  <div
                    className={`mini-progress-fill ${stat.status}`}
                    style={{ width: `${Math.min(parseFloat(stat.percentage), 100)}%` }}
                  />
                </div>
                <div className="stat-footer">
                  <span>R$ {parseFloat(stat.totalSpent).toFixed(2)}</span>
                  <span className="stat-limit">/ R$ {parseFloat(stat.limit).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
          {stats.length > 6 && (
            <div className="view-all-link">
              <a href="/budgets">Ver todos os orçamentos →</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
