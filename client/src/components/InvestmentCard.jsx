import React from 'react';
import './InvestmentCard.css';

const InvestmentCard = ({ suggestion, onLearnMore }) => {
  const getRiskColor = (level) => {
    if (level === 1) return '#48bb78';
    if (level === 2) return '#4299e1';
    if (level === 3) return '#ed8936';
    if (level >= 4) return '#f56565';
    return '#a0aec0';
  };

  const getLiquidityText = (liquidity) => {
    const texts = {
      immediate: 'Imediata',
      daily: 'Diária',
      monthly: 'Mensal',
      maturity: 'No Vencimento',
    };
    return texts[liquidity] || liquidity;
  };

  const getPriorityBadge = (priority) => {
    if (priority === 5) return { text: 'Prioridade Máxima', color: '#f56565' };
    if (priority === 4) return { text: 'Alta Prioridade', color: '#ed8936' };
    if (priority === 3) return { text: 'Prioridade Média', color: '#4299e1' };
    return { text: 'Sugestão', color: '#48bb78' };
  };

  const priorityBadge = getPriorityBadge(suggestion.priority);

  return (
    <div className={`investment-card priority-${suggestion.priority}`}>
      <div className="investment-header">
        <div className="header-top">
          <h3>{suggestion.productName}</h3>
          <span
            className="priority-badge"
            style={{ backgroundColor: `${priorityBadge.color}20`, color: priorityBadge.color }}
          >
            {priorityBadge.text}
          </span>
        </div>
        <p className="investment-description">{suggestion.description}</p>
      </div>

      <div className="investment-body">
        <div className="investment-metrics">
          <div className="metric">
            <span className="metric-label">Rentabilidade Anual</span>
            <span className="metric-value highlight">{suggestion.expectedReturn.toFixed(2)}%</span>
          </div>

          <div className="metric">
            <span className="metric-label">Risco</span>
            <div className="risk-indicator">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`risk-dot ${level <= suggestion.riskLevel ? 'active' : ''}`}
                  style={{
                    backgroundColor: level <= suggestion.riskLevel ? getRiskColor(suggestion.riskLevel) : '#4a5568'
                  }}
                />
              ))}
            </div>
          </div>

          <div className="metric">
            <span className="metric-label">Liquidez</span>
            <span className="metric-value">{getLiquidityText(suggestion.liquidity)}</span>
          </div>
        </div>

        <div className="investment-amounts">
          <div className="amount-box">
            <span className="amount-label">Valor Sugerido</span>
            <span className="amount-value">R$ {suggestion.suggestedAmount.toFixed(2)}</span>
          </div>

          {suggestion.minimumInvestment > 0 && (
            <div className="amount-box secondary">
              <span className="amount-label">Mínimo</span>
              <span className="amount-value">R$ {suggestion.minimumInvestment.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="match-score-container">
          <div className="match-score-header">
            <span>Adequação ao seu perfil</span>
            <span className="match-percentage">{suggestion.matchScore}%</span>
          </div>
          <div className="match-score-bar">
            <div
              className="match-score-fill"
              style={{
                width: `${suggestion.matchScore}%`,
                backgroundColor: getRiskColor(suggestion.riskLevel)
              }}
            />
          </div>
        </div>

        <div className="investment-reason">
          <p>{suggestion.reason}</p>
        </div>

        {suggestion.relatedGoal && (
          <div className="related-goal">
            <span className="goal-icon">🎯</span>
            <span>Objetivo: {suggestion.relatedGoal}</span>
          </div>
        )}

        <div className="pros-cons">
          {suggestion.pros && suggestion.pros.length > 0 && (
            <div className="pros">
              <h4>✅ Vantagens</h4>
              <ul>
                {suggestion.pros.map((pro, index) => (
                  <li key={index}>{pro}</li>
                ))}
              </ul>
            </div>
          )}

          {suggestion.cons && suggestion.cons.length > 0 && (
            <div className="cons">
              <h4>⚠️ Desvantagens</h4>
              <ul>
                {suggestion.cons.map((con, index) => (
                  <li key={index}>{con}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {suggestion.additionalInfo && (
          <div className="additional-info">
            {suggestion.additionalInfo.indexer && (
              <span className="info-badge">📊 {suggestion.additionalInfo.indexer}</span>
            )}
            {suggestion.additionalInfo.taxable !== undefined && (
              <span className="info-badge">
                {suggestion.additionalInfo.taxable ? '💰 Tributado IR' : '🎁 Isento IR'}
              </span>
            )}
            {suggestion.additionalInfo.covered && (
              <span className="info-badge">🛡️ Protegido FGC</span>
            )}
          </div>
        )}
      </div>

      <div className="investment-footer">
        <button className="btn-learn-more" onClick={() => onLearnMore && onLearnMore(suggestion)}>
          Saiba Mais
        </button>
      </div>
    </div>
  );
};

export default InvestmentCard;
