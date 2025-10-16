import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './BudgetAlertsPage.css';

const BudgetAlertsPage = () => {
  const [budgets, setBudgets] = useState([]);
  const [stats, setStats] = useState([]);
  const [formData, setFormData] = useState({
    category: '',
    limit: '',
    warningThreshold: 80,
    alertEnabled: true,
    period: 'monthly',
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchBudgets();
    fetchStats();
  }, []);

  const fetchBudgets = async () => {
    try {
      const res = await api.get('/budgets');
      setBudgets(res.data);
    } catch (err) {
      console.error('Erro ao buscar orçamentos:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/budgets/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
    }
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/budgets', formData);
      setMessage({ text: 'Orçamento salvo com sucesso!', type: 'success' });
      setFormData({
        category: '',
        limit: '',
        warningThreshold: 80,
        alertEnabled: true,
        period: 'monthly',
      });
      setEditingId(null);
      fetchBudgets();
      fetchStats();
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setMessage({
        text: err.response?.data?.msg || 'Erro ao salvar orçamento',
        type: 'error'
      });
    }
  };

  const onEdit = (budget) => {
    setFormData({
      category: budget.category,
      limit: budget.limit,
      warningThreshold: budget.warningThreshold || 80,
      alertEnabled: budget.alertEnabled !== undefined ? budget.alertEnabled : true,
      period: budget.period || 'monthly',
    });
    setEditingId(budget._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onDelete = async (category) => {
    if (!window.confirm(`Deseja realmente excluir o orçamento de "${category}"?`)) {
      return;
    }
    try {
      // Note: You'll need to implement a DELETE route in the backend
      setMessage({ text: 'Funcionalidade de exclusão em desenvolvimento', type: 'info' });
    } catch (err) {
      setMessage({ text: 'Erro ao excluir orçamento', type: 'error' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'exceeded':
        return 'danger';
      case 'warning':
        return 'warning';
      default:
        return 'success';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'exceeded':
        return '🚨';
      case 'warning':
        return '⚠️';
      default:
        return '✅';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'exceeded':
        return 'Limite ultrapassado';
      case 'warning':
        return 'Atenção';
      default:
        return 'Dentro do limite';
    }
  };

  const getPeriodText = (period) => {
    switch (period) {
      case 'weekly':
        return 'Semanal';
      case 'yearly':
        return 'Anual';
      default:
        return 'Mensal';
    }
  };

  return (
    <div className="budget-alerts-page">
      <h1>Configuração de Limites e Alertas</h1>
      <p className="subtitle">Defina limites de gastos por categoria e receba alertas quando ultrapassar os valores definidos.</p>

      {message.text && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="budget-form-card">
        <h2>{editingId ? 'Editar Orçamento' : 'Criar Novo Orçamento'}</h2>
        <form onSubmit={onSubmit} className="budget-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Categoria *</label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={onChange}
                placeholder="Ex: Alimentação, Transporte, Lazer"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="limit">Limite (R$) *</label>
              <input
                type="number"
                id="limit"
                name="limit"
                value={formData.limit}
                onChange={onChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="warningThreshold">
                Alerta em (%)
                <span className="help-text">Receba aviso ao atingir esta porcentagem</span>
              </label>
              <input
                type="number"
                id="warningThreshold"
                name="warningThreshold"
                value={formData.warningThreshold}
                onChange={onChange}
                min="1"
                max="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="period">Período</label>
              <select
                id="period"
                name="period"
                value={formData.period}
                onChange={onChange}
              >
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="alertEnabled"
                checked={formData.alertEnabled}
                onChange={onChange}
              />
              <span>Habilitar alertas para este orçamento</span>
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Atualizar Orçamento' : 'Criar Orçamento'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    category: '',
                    limit: '',
                    warningThreshold: 80,
                    alertEnabled: true,
                    period: 'monthly',
                  });
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="budget-stats-section">
        <h2>Seus Orçamentos</h2>
        {stats.length === 0 ? (
          <div className="empty-state">
            <p>📊 Nenhum orçamento configurado ainda.</p>
            <p>Crie seu primeiro orçamento acima para começar a controlar seus gastos!</p>
          </div>
        ) : (
          <div className="budget-cards">
            {stats.map((stat) => (
              <div key={stat.id} className={`budget-card status-${stat.status}`}>
                <div className="budget-card-header">
                  <div className="category-info">
                    <span className="status-icon">{getStatusIcon(stat.status)}</span>
                    <h3>{stat.category}</h3>
                  </div>
                  <div className="budget-actions">
                    <button
                      className="btn-icon"
                      onClick={() => onEdit(budgets.find(b => b._id === stat.id))}
                      title="Editar"
                    >
                      ✏️
                    </button>
                  </div>
                </div>

                <div className="budget-card-body">
                  <div className="budget-info">
                    <div className="info-item">
                      <span className="label">Período:</span>
                      <span className="value">{getPeriodText(stat.period)}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Limite:</span>
                      <span className="value">R$ {parseFloat(stat.limit).toFixed(2)}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Gasto:</span>
                      <span className="value expense">R$ {parseFloat(stat.totalSpent).toFixed(2)}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Restante:</span>
                      <span className={`value ${stat.remaining <= 0 ? 'exceeded' : ''}`}>
                        R$ {parseFloat(stat.remaining).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="progress-section">
                    <div className="progress-header">
                      <span className="progress-label">{getStatusText(stat.status)}</span>
                      <span className="progress-percentage">{stat.percentage}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className={`progress-fill progress-${getStatusColor(stat.status)}`}
                        style={{ width: `${Math.min(parseFloat(stat.percentage), 100)}%` }}
                      />
                      {stat.warningThreshold < 100 && (
                        <div
                          className="progress-threshold"
                          style={{ left: `${stat.warningThreshold}%` }}
                          title={`Alerta em ${stat.warningThreshold}%`}
                        />
                      )}
                    </div>
                  </div>

                  <div className="budget-footer">
                    <span className={`alert-status ${stat.alertEnabled ? 'enabled' : 'disabled'}`}>
                      {stat.alertEnabled ? '🔔 Alertas ativos' : '🔕 Alertas desativados'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetAlertsPage;
