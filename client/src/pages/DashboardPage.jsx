import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import api from '../services/api';
import Toast from '../components/Toast';
import './DashboardPage.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const DashboardPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [valuesVisible, setValuesVisible] = useState(true);

  // Filtros
  const [selectedType, setSelectedType] = useState('expense'); // all, expense, income
  const [selectedMonth, setSelectedMonth] = useState('all'); // all, 2025-01, etc
  const [selectedYear, setSelectedYear] = useState('all');

  // Chart options
  const [barChartMode, setBarChartMode] = useState('category'); // 'category' or 'subcategory'
  const [barChartCategory, setBarChartCategory] = useState('all'); // for subcategory mode

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

  // Get unique years from transactions
  const availableYears = useMemo(() => {
    const years = new Set();
    transactions.forEach(t => {
      const date = new Date(t.date);
      years.add(date.getFullYear());
    });
    return Array.from(years).sort().reverse();
  }, [transactions]);

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

  // Get unique categories for bar chart filter
  const expenseCategories = useMemo(() => {
    const categories = new Set();
    transactions.forEach(t => {
      if (t.type === 'expense' && t.category) {
        categories.add(t.category);
      }
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

    return {
      totalExpenses,
      totalIncome,
      balance,
      totalTransactions: filteredTransactions.length,
      expenseCount: expenses.length,
      incomeCount: incomes.length,
    };
  }, [filteredTransactions]);

  // Bar Chart Data - Category or Subcategory
  const barChartData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');

    if (barChartMode === 'category') {
      // Group by category
      const categoryTotals = {};
      expenses.forEach(t => {
        const cat = t.category || 'Sem Categoria';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
      });

      // Sort and take top 10
      const sorted = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      return {
        labels: sorted.map(([name]) => name),
        datasets: [{
          label: 'Despesas',
          data: sorted.map(([, amount]) => amount),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 2,
        }]
      };
    } else {
      // Group by subcategory for selected category
      const filtered = barChartCategory === 'all'
        ? expenses
        : expenses.filter(t => t.category === barChartCategory);

      const subcategoryTotals = {};
      filtered.forEach(t => {
        const subcat = t.subcategoryId || 'outros';
        subcategoryTotals[subcat] = (subcategoryTotals[subcat] || 0) + t.amount;
      });

      const sorted = Object.entries(subcategoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      return {
        labels: sorted.map(([name]) => name),
        datasets: [{
          label: 'Gastos por Subcategoria',
          data: sorted.map(([, amount]) => amount),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 2,
        }]
      };
    }
  }, [filteredTransactions, barChartMode, barChartCategory]);

  // Line Chart Data - Monthly expenses and income evolution
  const lineChartData = useMemo(() => {
    // Group by month
    const monthlyData = {};

    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { expenses: 0, income: 0 };
      }

      if (t.type === 'expense') {
        monthlyData[monthKey].expenses += t.amount;
      } else {
        monthlyData[monthKey].income += t.amount;
      }
    });

    // Sort months
    const sortedMonths = Object.keys(monthlyData).sort();

    // Format month names
    const labels = sortedMonths.map(monthKey => {
      const [year, month] = monthKey.split('-');
      const date = new Date(year, month - 1);
      return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    });

    return {
      labels,
      datasets: [
        {
          label: 'Despesas',
          data: sortedMonths.map(month => monthlyData[month].expenses),
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
        {
          label: 'Receitas',
          data: sortedMonths.map(month => monthlyData[month].income),
          borderColor: 'rgba(34, 197, 94, 1)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          pointRadius: 6,
          pointHoverRadius: 8,
        }
      ]
    };
  }, [transactions]);

  // Pie Chart Data - Expense categories vs total income with percentages
  const pieChartData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const totalIncome = stats.totalIncome;

    // Group by category
    const categoryTotals = {};
    expenses.forEach(t => {
      const cat = t.category || 'Sem Categoria';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
    });

    // Sort and take top 8
    const sorted = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    // Calculate percentages relative to total income
    const labels = sorted.map(([name, amount]) => {
      const percentage = totalIncome > 0 ? (amount / totalIncome * 100).toFixed(1) : 0;
      return `${name} (${percentage}%)`;
    });

    const colors = [
      'rgba(239, 68, 68, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(59, 130, 246, 0.8)',
      'rgba(251, 191, 36, 0.8)',
      'rgba(168, 85, 247, 0.8)',
      'rgba(236, 72, 153, 0.8)',
      'rgba(20, 184, 166, 0.8)',
      'rgba(249, 115, 22, 0.8)',
    ];

    return {
      labels,
      datasets: [{
        label: 'Comprometimento da Receita',
        data: sorted.map(([, amount]) => amount),
        backgroundColor: colors,
        borderColor: colors.map(c => c.replace('0.8', '1')),
        borderWidth: 2,
      }]
    };
  }, [filteredTransactions, stats.totalIncome]);

  // Format month name
  const getMonthName = (monthKey) => {
    if (monthKey === 'all') return 'Todos os Meses';
    const [year, month] = monthKey.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
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
          Análise visual completa das suas finanças
        </p>
      </div>

      {/* Statistics Cards - 2x2 Grid */}
      <div className="stats-grid-2x2">
        <div className="stat-card stat-card-income">
          <div className="stat-header">
            <div className="stat-icon">💰</div>
            <button
              className="toggle-values-btn"
              onClick={() => setValuesVisible(!valuesVisible)}
              title={valuesVisible ? 'Ocultar valores' : 'Mostrar valores'}
            >
              {valuesVisible ? '👁️' : '👁️‍🗨️'}
            </button>
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
      </div>

      {/* Filters - Below cards */}
      <div className="filters-section-below">
        <div className="filters-header">
          <h3>🔍 Filtros</h3>
        </div>

        <div className="filters-grid-horizontal">
          {/* Type Filter */}
          <div className="filter-group">
            <label className="filter-label">TIPO</label>
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
            <label className="filter-label">MÊS</label>
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

      {/* Charts Section */}
      <div className="charts-section">
        {/* Bar Chart */}
        <div className="chart-card chart-card-full">
          <div className="chart-header">
            <h3>📊 Gráfico de Barras - Por Categoria</h3>
            <div className="chart-controls">
              <select
                value={barChartMode}
                onChange={(e) => setBarChartMode(e.target.value)}
                className="chart-select"
              >
                <option value="category">Agrupado por Categorias</option>
                <option value="subcategory">Gastos por Subcategoria</option>
              </select>

              {barChartMode === 'subcategory' && (
                <select
                  value={barChartCategory}
                  onChange={(e) => setBarChartCategory(e.target.value)}
                  className="chart-select"
                >
                  <option value="all">Todas as Categorias</option>
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div className="chart-description">
            Top 10 categorias com maiores valores
          </div>
          <div className="chart-wrapper">
            <Bar
              data={barChartData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                plugins: {
                  legend: { display: true, position: 'top' },
                  tooltip: {
                    callbacks: {
                      label: (context) => `R$ ${context.parsed.y.toFixed(2)}`
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => `R$ ${value.toFixed(0)}`
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Line Chart */}
        <div className="chart-card chart-card-full">
          <div className="chart-header">
            <h3>📈 Gráfico de Linhas - Evolução Temporal</h3>
          </div>
          <div className="chart-description">
            Valores ao longo do tempo
          </div>
          <div className="chart-wrapper">
            <Line
              data={lineChartData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                plugins: {
                  legend: { display: true, position: 'top' },
                  tooltip: {
                    callbacks: {
                      label: (context) => `${context.dataset.label}: R$ ${context.parsed.y.toFixed(2)}`
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => `R$ ${value.toFixed(0)}`
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Pie Chart */}
        <div className="chart-card chart-card-half">
          <div className="chart-header">
            <h3>🍕 Gráfico de Pizza - Distribuição</h3>
          </div>
          <div className="chart-description">
            Proporção por categoria (Top 8)
          </div>
          <div className="chart-wrapper">
            <Pie
              data={pieChartData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    display: true,
                    position: 'right',
                    labels: {
                      boxWidth: 15,
                      padding: 10,
                      font: { size: 11 }
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const value = context.parsed;
                        const percentage = stats.totalIncome > 0
                          ? ((value / stats.totalIncome) * 100).toFixed(1)
                          : 0;
                        return `R$ ${value.toFixed(2)} (${percentage}% da receita)`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
