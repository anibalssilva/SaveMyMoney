import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import Toast from '../components/Toast';
import './DashboardPage.css';

const DashboardPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [valuesVisible, setValuesVisible] = useState(false); // Start hidden by default

  // Filtros
  const [selectedType, setSelectedType] = useState('all'); // all, expense, income
  const [selectedMonth, setSelectedMonth] = useState('all'); // 'all' or 1..12
  const [selectedYear, setSelectedYear] = useState('all');

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

  // Helper: capitalize first letter
  const formatCap = (s) => (typeof s === 'string' && s.length > 0)
    ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
    : s;

  // Get unique years from transactions
  const availableYears = useMemo(() => {
    const years = new Set();
    transactions.forEach(t => {
      const date = new Date(t.date);
      years.add(date.getFullYear());
    });
    return Array.from(years).sort((a,b) => a - b);
  }, [transactions]);

  // Fixed list of 12 months (JANEIRO..DEZEMBRO)
  const availableMonths = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Type filter
      if (selectedType !== 'all' && t.type !== selectedType) return false;

      // Month filter (by month only; year handled separately)
      if (selectedMonth !== 'all') {
        const tDate = new Date(t.date);
        if ((tDate.getMonth() + 1) !== parseInt(selectedMonth, 10)) return false;
      }

      // Year filter
      if (selectedYear !== 'all') {
        const tDate = new Date(t.date);
        if (tDate.getFullYear() !== parseInt(selectedYear)) return false;
      }

      return true;
    });
  }, [transactions, selectedType, selectedMonth, selectedYear]);

  // Calculate statistics
  const stats = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const incomes = filteredTransactions.filter(t => t.type === 'income');

    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpenses;

    // Calculate financial health
    let financialHealth = {
      status: 'balanced',
      message: 'Equilibrado',
      color: 'orange',
      icon: '⚖️'
    };

    if (totalExpenses > totalIncome) {
      financialHealth = {
        status: 'danger',
        message: 'Atenção! Despesas maiores que receitas',
        color: 'red',
        icon: '⚠️'
      };
    } else if (totalIncome > totalExpenses) {
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

  // Format month name (only month, no year) in UPPERCASE
  const getMonthName = (monthNumber) => {
    if (monthNumber === 'all') return 'Todos os Meses';
    const date = new Date(2000, parseInt(monthNumber, 10) - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase();
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
          {/* Month Filter */}
          <div className="filter-group">
            <label className="filter-label">MÊS</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todos os Meses</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>
                  {getMonthName(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="filter-group">
            <label className="filter-label">ANO</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todos os Anos</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
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
