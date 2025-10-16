import React from 'react';
import './BudgetAlert.css';

const BudgetAlert = ({ alert, onDismiss, showDetails = true }) => {
  if (!alert) return null;

  const getSeverityClass = () => {
    return alert.severity === 'danger' ? 'alert-danger' : 'alert-warning';
  };

  const getSeverityIcon = () => {
    return alert.severity === 'danger' ? '🚨' : '⚠️';
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className={`budget-alert ${getSeverityClass()}`}>
      <div className="alert-header">
        <div className="alert-icon">{getSeverityIcon()}</div>
        <div className="alert-content">
          <h4 className="alert-title">
            {alert.severity === 'danger' ? 'Limite Ultrapassado!' : 'Atenção ao Orçamento'}
          </h4>
          <p className="alert-message">{alert.message}</p>
        </div>
        {onDismiss && (
          <button className="alert-dismiss" onClick={() => onDismiss(alert.id)}>
            ✕
          </button>
        )}
      </div>

      {showDetails && (
        <div className="alert-details">
          <div className="detail-item">
            <span className="detail-label">Categoria:</span>
            <span className="detail-value">{alert.category}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Limite:</span>
            <span className="detail-value">{formatCurrency(alert.limit)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Gasto Total:</span>
            <span className="detail-value expense">{formatCurrency(alert.totalSpent)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Restante:</span>
            <span className={`detail-value ${alert.remaining <= 0 ? 'exceeded' : ''}`}>
              {formatCurrency(alert.remaining)}
            </span>
          </div>

          <div className="alert-progress">
            <div className="progress-info">
              <span>Utilização do orçamento</span>
              <span className="progress-percent">{alert.percentage}%</span>
            </div>
            <div className="progress-bar-container">
              <div
                className={`progress-bar-fill ${alert.severity}`}
                style={{ width: `${Math.min(parseFloat(alert.percentage), 100)}%` }}
              />
            </div>
          </div>

          {alert.period && (
            <div className="alert-period">
              <small>
                Período: {alert.period === 'monthly' ? 'Mensal' : alert.period === 'weekly' ? 'Semanal' : 'Anual'}
                {alert.periodStart && alert.periodEnd && (
                  <> ({formatDate(alert.periodStart)} - {formatDate(alert.periodEnd)})</>
                )}
              </small>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BudgetAlert;
