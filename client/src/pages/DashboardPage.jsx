import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import Toast from '../components/Toast';
import './DashboardPage.css';

const DashboardPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filtros
  const [selectedType, setSelectedType] = useState('all'); // all, expense, income
  const [selectedMonth, setSelectedMonth] = useState('all'); // all, 2025-01, etc
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [groupBy, setGroupBy] = useState('category'); // category, date, type

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data);
    } catch (err) {
      console.error('Erro ao buscar transações:', err);
      setToast({
        message: 'Erro ao carregar transações',
        type: 'error',
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  // Get unique months from transactions
  const availableMonths = useMemo(() => {
    const months = new Set();
    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  // Get unique categories
  const availableCategories = useMemo(() => {
    const categories = new Set();
    transactions.forEach(t => {
      if (t.category) categories.add(t.category);
    });
    return Array.from(categories).sort();
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Type filter
      if (selectedType !== 'all' && t.type !== selectedType) return false;

      // Month filter
      if (selectedMonth !== 'all') {
        const tDate = new Date(t.date);
        const tMonthKey = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`;
        if (tMonthKey !== selectedMonth) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;

      return true;
    });
  }, [transactions, selectedType, selectedMonth, selectedCategory]);

  // Group transactions
  const groupedData = useMemo(() => {
    const groups = {};

    filteredTransactions.forEach(t => {
      let key;

      if (groupBy === 'category') {
        key = t.category || 'Sem Categoria';
      } else if (groupBy === 'date') {
        const date = new Date(t.date);
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (groupBy === 'type') {
        key = t.type === 'expense' ? 'Despesas' : 'Receitas';
      }

      if (!groups[key]) {
        groups[key] = {
          items: [],
          total: 0,
          count: 0
        };
      }

      groups[key].items.push(t);
      groups[key].total += t.amount;
      groups[key].count += 1;
    });

    // Convert to array and sort by total
    return Object.entries(groups)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTransactions, groupBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const incomes = filteredTransactions.filter(t => t.type === 'income');

    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpenses;

    return {
      totalExpenses,
      totalIncome,
      balance,
      expenseCount: expenses.length,
      incomeCount: incomes.length,
      avgExpense: expenses.length > 0 ? totalExpenses / expenses.length : 0,
      avgIncome: incomes.length > 0 ? totalIncome / incomes.length : 0
    };
  }, [filteredTransactions]);

  // Format month name
  const getMonthName = (monthKey) => {
    if (monthKey === 'all') return 'Todos os Meses';
    const [year, month] = monthKey.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  // Get group icon
  const getGroupIcon = (groupName) => {
    if (groupBy === 'type') {
      return groupName === 'Despesas' ? '💸' : '💰';
    } else if (groupBy === 'date') {
      return '📅';
    } else {
      // Category icons
      const iconMap = {
        'Alimentação': '🍔',
        'Transporte': '🚗',
        'Saúde': '🏥',
        'Educação': '📚',
        'Lazer': '🎮',
        'Moradia': '🏠',
        'Vestuário': '👔',
        'OCR Upload': '📸',
        'default': '📦'
      };
      return iconMap[groupName] || iconMap['default'];
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner-container">
          <div className="cyber-spinner"></div>
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

      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">💎 Dashboard Financeiro</h1>
        <p className="dashboard-subtitle">
          Visualize e analise suas despesas e receitas
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card-income">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">Receitas</div>
            <div className="stat-value">R$ {stats.totalIncome.toFixed(2)}</div>
            <div className="stat-detail">{stats.incomeCount} transação(ões)</div>
          </div>
        </div>

        <div className="stat-card stat-card-expense">
          <div className="stat-icon">💸</div>
          <div className="stat-content">
            <div className="stat-label">Despesas</div>
            <div className="stat-value">R$ {stats.totalExpenses.toFixed(2)}</div>
            <div className="stat-detail">{stats.expenseCount} transação(ões)</div>
          </div>
        </div>

        <div className={`stat-card stat-card-balance ${stats.balance >= 0 ? 'positive' : 'negative'}`}>
          <div className="stat-icon">{stats.balance >= 0 ? '✅' : '⚠️'}</div>
          <div className="stat-content">
            <div className="stat-label">Saldo</div>
            <div className="stat-value">R$ {stats.balance.toFixed(2)}</div>
            <div className="stat-detail">{stats.balance >= 0 ? 'Positivo' : 'Negativo'}</div>
          </div>
        </div>

        <div className="stat-card stat-card-info">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-label">Total</div>
            <div className="stat-value">{filteredTransactions.length}</div>
            <div className="stat-detail">transações</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-header">
          <h3>🔍 Filtros</h3>
        </div>

        <div className="filters-grid">
          {/* Type Filter */}
          <div className="filter-group">
            <label className="filter-label">Tipo</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todos</option>
              <option value="expense">Despesas</option>
              <option value="income">Receitas</option>
            </select>
          </div>

          {/* Month Filter */}
          <div className="filter-group">
            <label className="filter-label">Mês</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todos os Meses</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {getMonthName(month)}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="filter-group">
            <label className="filter-label">Categoria</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todas as Categorias</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Group By */}
          <div className="filter-group">
            <label className="filter-label">Agrupar Por</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="filter-select"
            >
              <option value="category">Categoria</option>
              <option value="date">Mês</option>
              <option value="type">Tipo</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(selectedType !== 'all' || selectedMonth !== 'all' || selectedCategory !== 'all') && (
          <button
            onClick={() => {
              setSelectedType('all');
              setSelectedMonth('all');
              setSelectedCategory('all');
            }}
            className="clear-filters-btn"
          >
            ❌ Limpar Filtros
          </button>
        )}
      </div>

      {/* Grouped Data */}
      {groupedData.length > 0 ? (
        <div className="grouped-data-section">
          <div className="section-header">
            <h3>📊 Dados Agrupados por {groupBy === 'category' ? 'Categoria' : groupBy === 'date' ? 'Mês' : 'Tipo'}</h3>
            <span className="group-count">{groupedData.length} grupo(s)</span>
          </div>

          <div className="groups-grid">
            {groupedData.map((group, index) => (
              <div key={index} className="group-card">
                <div className="group-header">
                  <div className="group-title">
                    <span className="group-icon">{getGroupIcon(group.name)}</span>
                    <span className="group-name">{group.name}</span>
                  </div>
                  <div className="group-count-badge">{group.count}</div>
                </div>

                <div className="group-total">
                  <span className="group-total-label">Total:</span>
                  <span className="group-total-value">R$ {group.total.toFixed(2)}</span>
                </div>

                {/* Progress bar */}
                <div className="group-progress">
                  <div
                    className="group-progress-fill"
                    style={{ width: `${(group.total / stats.totalExpenses) * 100}%` }}
                  />
                </div>

                <div className="group-percentage">
                  {((group.total / stats.totalExpenses) * 100).toFixed(1)}% do total
                </div>

                {/* Items preview */}
                <div className="group-items-preview">
                  {group.items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="preview-item">
                      <span className="preview-desc">{item.description}</span>
                      <span className="preview-amount">R$ {item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  {group.items.length > 3 && (
                    <div className="preview-more">
                      +{group.items.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>Nenhuma transação encontrada</h3>
          <p>Ajuste os filtros ou adicione novas transações</p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
