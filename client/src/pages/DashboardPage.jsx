import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import Toast from '../components/Toast';
import DateInput from '../components/DateInput';
import './DashboardPage.css';

const DashboardPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [valuesVisible, setValuesVisible] = useState(false); // Start hidden by default

  // Filtros
  const [selectedType, setSelectedType] = useState('all'); // all, expense, income
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchTransactions();
    // Transparently adjust legacy dates once per session
    (async () => {
      const FLAG = 'backfillDatesDone_v1';
      if (localStorage.getItem(FLAG) === '1') return;
      try {
        const res = await api.post('/transactions/backfill-dates');
        localStorage.setItem(FLAG, '1');
        if (res?.data?.updated > 0) {
          // Refresh if any record changed
          await fetchTransactions();
        }
      } catch (e) {
        // Fail silently to keep UX transparent
        localStorage.setItem(FLAG, '1');
      }
    })();
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

  // Helper: capitalize first letter
  const formatCap = (s) => (typeof s === 'string' && s.length > 0)
    ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
    : s;

  // Clear filters function
  const clearFilters = () => {
    setSelectedType('all');
    setStartDate('');
    setEndDate('');
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Type filter
      if (selectedType !== 'all' && t.type !== selectedType) return false;

      // Date range filter using string comparison to avoid timezone issues
      const tDateStr = new Date(t.date).toISOString().split('T')[0];

      if (startDate && tDateStr < startDate) return false;
      if (endDate && tDateStr > endDate) return false;

      return true;
    });
  }, [transactions, selectedType, startDate, endDate]);

  // Calculate statistics
  const stats = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const incomes = filteredTransactions.filter(t => t.type === 'income');
    // Despesas que afetam o saldo (excluindo cartão alimentação)
    const expensesForBalance = expenses.filter(t => t.paymentMethod !== 'cartao_alimentacao');

    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
    const totalExpensesForBalance = expensesForBalance.reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpensesForBalance;

    // Calculate financial health (usando apenas despesas que afetam o saldo)
    let financialHealth = {
      status: 'balanced',
      message: 'Equilibrado',
      color: 'orange',
      icon: '⚖️'
    };

    if (totalExpensesForBalance > totalIncome) {
      financialHealth = {
        status: 'danger',
        message: 'Atenção! Despesas maiores que receitas',
        color: 'red',
        icon: '⚠️'
      };
    } else if (totalIncome > totalExpensesForBalance) {
      financialHealth = {
        status: 'healthy',
        message: 'Excelente! Receitas maiores que despesas',
        color: 'blue',
        icon: '✅'
      };
    }

    // Calculate top category
    const categoryTotals = {};
    expenses.forEach(t => {
      const cat = t.category || 'Sem Categoria';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
    });

    const sortedCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1]);

    const topCategory = sortedCategories.length > 0
      ? { name: sortedCategories[0][0], amount: sortedCategories[0][1] }
      : { name: 'N/A', amount: 0 };

    // Calculate category percentages (top 5)
    const categoryPercentages = sortedCategories.slice(0, 5).map(([name, amount]) => ({
      name,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses * 100).toFixed(1) : 0
    }));

    return {
      totalExpenses,
      totalIncome,
      balance,
      totalTransactions: filteredTransactions.length,
      expenseCount: expenses.length,
      incomeCount: incomes.length,
      topCategory,
      categoryPercentages,
      financialHealth,
    };
  }, [filteredTransactions]);


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
        <div className="dashboard-header-content">
          <div className="dashboard-header-text">
            <h1 className="dashboard-title">💎 Dashboard Financeiro</h1>
            <p className="dashboard-subtitle">
              Análise visual completa das suas finanças
            </p>
          </div>
          <button
            className="toggle-values-btn-header"
            onClick={() => setValuesVisible(!valuesVisible)}
            title={valuesVisible ? 'Ocultar valores' : 'Mostrar valores'}
          >
            {valuesVisible ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
      </div>

      {/* Filters - First */}
      <div className="filters-section-below">
        <div className="filters-header">
          <h3>🔍 Filtros</h3>
        </div>

        <div className="filters-grid-horizontal-2cols">
          {/* Start Date Filter */}
          <div className="filter-group">
            <label className="filter-label">📅 DE</label>
            <DateInput
              className="date-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* End Date Filter */}
          <div className="filter-group">
            <label className="filter-label">📅 ATÉ</label>
            <DateInput
              className="date-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {(startDate || endDate) && (
          <button className="clear-filters-btn" onClick={clearFilters}>
            ✖ Limpar Filtros
          </button>
        )}
      </div>

      {/* Statistics Cards - Responsive Grid */}
      <div className="stats-grid-dashboard">
        <div className="stat-card stat-card-income">
          <div className="stat-header">
            <div className="stat-icon">💰</div>
          </div>
          <div className="stat-content">
            <div className="stat-label">RECEITAS</div>
            <div className="stat-value">
              {valuesVisible ? `R$ ${stats.totalIncome.toFixed(2)}` : '••••••'}
            </div>
            <div className="stat-detail">{stats.incomeCount} transações</div>
          </div>
        </div>

        <div className="stat-card stat-card-expense">
          <div className="stat-header">
            <div className="stat-icon">💸</div>
          </div>
          <div className="stat-content">
            <div className="stat-label">DESPESAS</div>
            <div className="stat-value">
              {valuesVisible ? `R$ ${stats.totalExpenses.toFixed(2)}` : '••••••'}
            </div>
            <div className="stat-detail">{stats.expenseCount} transações</div>
          </div>
        </div>

        <div className={`stat-card stat-card-balance ${stats.balance >= 0 ? 'positive' : 'negative'}`}>
          <div className="stat-header">
            <div className="stat-icon">{stats.balance >= 0 ? '✅' : '⚠️'}</div>
          </div>
          <div className="stat-content">
            <div className="stat-label">SALDO</div>
            <div className="stat-value">
              {valuesVisible ? `R$ ${stats.balance.toFixed(2)}` : '••••••'}
            </div>
            <div className="stat-detail">{stats.balance >= 0 ? 'Positivo' : 'Negativo'}</div>
          </div>
        </div>

        <div className="stat-card stat-card-total">
          <div className="stat-header">
            <div className="stat-icon">📊</div>
          </div>
          <div className="stat-content">
            <div className="stat-label">TOTAL</div>
            <div className="stat-value">{stats.totalTransactions}</div>
            <div className="stat-detail">transações filtradas</div>
          </div>
        </div>

        {/* Top Category Card */}
        <div className="stat-card stat-card-top-category">
          <div className="stat-header">
            <div className="stat-icon">🏆</div>
          </div>
          <div className="stat-content">
            <div className="stat-label">CATEGORIA COM MAIOR GASTO</div>
            <div className="stat-category-name">{formatCap(stats.topCategory.name)}</div>
            <div className="stat-value">
              {valuesVisible ? `R$ ${stats.topCategory.amount.toFixed(2)}` : '••••••'}
            </div>
          </div>
        </div>

        {/* Financial Health Card */}
        <div className={`stat-card stat-card-health stat-card-health-${stats.financialHealth.color}`}>
          <div className="stat-header">
            <div className="stat-icon">{stats.financialHealth.icon}</div>
          </div>
          <div className="stat-content">
            <div className="stat-label">SAÚDE FINANCEIRA</div>
            <div className="stat-health-message">{stats.financialHealth.message}</div>
          </div>
        </div>

        {/* Category Percentages Card */}
        <div className="stat-card stat-card-percentages">
          <div className="stat-header">
            <div className="stat-icon">📊</div>
          </div>
          <div className="stat-content">
            <div className="stat-label">DISTRIBUIÇÃO POR CATEGORIA</div>
            <div className="category-percentages-list">
              {stats.categoryPercentages.length > 0 ? (
                stats.categoryPercentages.map((cat, index) => (
                  <div key={index} className="category-percentage-item">
                    <div className="category-percentage-bar-container">
                      <div
                        className="category-percentage-bar"
                        style={{ width: `${cat.percentage}%` }}
                      ></div>
                    </div>
                    <div className="category-percentage-info">
                      <span className="category-percentage-name">{formatCap(cat.name)}</span>
                      <span className="category-percentage-value">
                        {valuesVisible ? `R$ ${cat.amount.toFixed(2)}` : '•••'}
                        <strong className="category-percentage-percent"> ({cat.percentage}%)</strong>
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-data-message">Nenhuma despesa registrada</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
