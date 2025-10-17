import { useState, useEffect, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { getTransactions } from '../services/api';
import './FinancialDashboardPage.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const FinancialDashboardPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('expense'); // expense, income, all
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [groupBy, setGroupBy] = useState('category'); // category, month, day

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data } = await getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get available months and years
  const availableMonths = useMemo(() => {
    const months = new Set();
    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    return Array.from(months).sort();
  }, [transactions]);

  const availableYears = useMemo(() => {
    const years = new Set();
    transactions.forEach(t => {
      const date = new Date(t.date);
      years.add(date.getFullYear());
    });
    return Array.from(years).sort();
  }, [transactions]);

  // Filter transactions based on selected filters
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
      expenseCount: expenses.length,
      incomeCount: incomes.length
    };
  }, [filteredTransactions]);

  // Prepare data for Bar Chart (by category)
  const barChartData = useMemo(() => {
    const categoryTotals = {};

    filteredTransactions.forEach(t => {
      const category = t.category || 'Sem Categoria';
      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
      }
      categoryTotals[category] += t.amount;
    });

    const sortedCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Top 10 categories

    return {
      labels: sortedCategories.map(([category]) => category),
      datasets: [{
        label: selectedType === 'expense' ? 'Despesas' : selectedType === 'income' ? 'Receitas' : 'Transações',
        data: sortedCategories.map(([, total]) => total),
        backgroundColor: selectedType === 'expense'
          ? 'rgba(239, 68, 68, 0.8)'
          : selectedType === 'income'
          ? 'rgba(16, 185, 129, 0.8)'
          : 'rgba(99, 102, 241, 0.8)',
        borderColor: selectedType === 'expense'
          ? 'rgba(239, 68, 68, 1)'
          : selectedType === 'income'
          ? 'rgba(16, 185, 129, 1)'
          : 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: selectedType === 'expense'
          ? 'rgba(239, 68, 68, 1)'
          : selectedType === 'income'
          ? 'rgba(16, 185, 129, 1)'
          : 'rgba(99, 102, 241, 1)',
      }]
    };
  }, [filteredTransactions, selectedType]);

  // Prepare data for Line Chart (over time)
  const lineChartData = useMemo(() => {
    const dailyTotals = {};

    filteredTransactions.forEach(t => {
      const date = new Date(t.date);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      if (!dailyTotals[dateKey]) {
        dailyTotals[dateKey] = 0;
      }
      dailyTotals[dateKey] += t.amount;
    });

    const sortedDates = Object.keys(dailyTotals).sort();

    // If too many days, group by week or month
    let labels, data;
    if (sortedDates.length > 60) {
      // Group by month
      const monthlyTotals = {};
      sortedDates.forEach(dateKey => {
        const monthKey = dateKey.substring(0, 7); // YYYY-MM
        if (!monthlyTotals[monthKey]) {
          monthlyTotals[monthKey] = 0;
        }
        monthlyTotals[monthKey] += dailyTotals[dateKey];
      });
      labels = Object.keys(monthlyTotals).map(m => {
        const [year, month] = m.split('-');
        return `${getMonthName(parseInt(month))}/${year}`;
      });
      data = Object.values(monthlyTotals);
    } else {
      labels = sortedDates.map(d => {
        const [, month, day] = d.split('-');
        return `${day}/${month}`;
      });
      data = sortedDates.map(d => dailyTotals[d]);
    }

    return {
      labels,
      datasets: [{
        label: selectedType === 'expense' ? 'Despesas' : selectedType === 'income' ? 'Receitas' : 'Transações',
        data,
        borderColor: selectedType === 'expense'
          ? 'rgba(239, 68, 68, 1)'
          : selectedType === 'income'
          ? 'rgba(16, 185, 129, 1)'
          : 'rgba(0, 240, 255, 1)',
        backgroundColor: selectedType === 'expense'
          ? 'rgba(239, 68, 68, 0.1)'
          : selectedType === 'income'
          ? 'rgba(16, 185, 129, 0.1)'
          : 'rgba(0, 240, 255, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: selectedType === 'expense'
          ? 'rgba(239, 68, 68, 1)'
          : selectedType === 'income'
          ? 'rgba(16, 185, 129, 1)'
          : 'rgba(0, 240, 255, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      }]
    };
  }, [filteredTransactions, selectedType]);

  // Prepare data for Pie Chart (category distribution)
  const pieChartData = useMemo(() => {
    const categoryTotals = {};

    filteredTransactions.forEach(t => {
      const category = t.category || 'Sem Categoria';
      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
      }
      categoryTotals[category] += t.amount;
    });

    const sortedCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8); // Top 8 for pie chart

    const colors = [
      'rgba(239, 68, 68, 0.8)',
      'rgba(16, 185, 129, 0.8)',
      'rgba(99, 102, 241, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(59, 130, 246, 0.8)',
      'rgba(236, 72, 153, 0.8)',
      'rgba(139, 92, 246, 0.8)',
      'rgba(34, 197, 94, 0.8)',
    ];

    return {
      labels: sortedCategories.map(([category]) => category),
      datasets: [{
        label: 'Total',
        data: sortedCategories.map(([, total]) => total),
        backgroundColor: colors,
        borderColor: colors.map(c => c.replace('0.8', '1')),
        borderWidth: 2,
        hoverOffset: 8,
      }]
    };
  }, [filteredTransactions]);

  // Chart options
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: { size: 12, weight: 600 },
          padding: 15,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(0, 240, 255, 0.5)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: (context) => `${context.dataset.label}: R$ ${context.parsed.y.toFixed(2)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          callback: (value) => `R$ ${value.toFixed(0)}`
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        }
      },
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          maxRotation: 45,
          minRotation: 45
        },
        grid: {
          display: false,
        }
      }
    }
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: { size: 12, weight: 600 },
          padding: 15,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(0, 240, 255, 0.5)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: (context) => `${context.dataset.label}: R$ ${context.parsed.y.toFixed(2)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          callback: (value) => `R$ ${value.toFixed(0)}`
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        }
      },
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          maxRotation: 45,
          minRotation: 0
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: { size: 12, weight: 600 },
          padding: 12,
          boxWidth: 15,
          boxHeight: 15,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(0, 240, 255, 0.5)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: R$ ${context.parsed.toFixed(2)} (${percentage}%)`;
          }
        }
      }
    }
  };

  const getMonthName = (month) => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months[month - 1];
  };

  const clearFilters = () => {
    setSelectedType('expense');
    setSelectedMonth('all');
    setSelectedYear('all');
  };

  if (loading) {
    return (
      <div className="financial-dashboard-container">
        <div className="loading-spinner-container">
          <div className="cyber-spinner"></div>
          <p>Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="financial-dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">📊 Dashboard Financeiro</h1>
        <p className="dashboard-subtitle">Análise visual completa das suas finanças</p>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-header">
          <h3>🔍 Filtros</h3>
        </div>

        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label">Tipo</label>
            <select
              className="filter-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="expense">Despesas</option>
              <option value="income">Receitas</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Mês</label>
            <select
              className="filter-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="all">Todos os Meses</option>
              {availableMonths.map(month => {
                const [year, m] = month.split('-');
                return (
                  <option key={month} value={month}>
                    {getMonthName(parseInt(m))} {year}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Ano</label>
            <select
              className="filter-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="all">Todos os Anos</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {(selectedType !== 'expense' || selectedMonth !== 'all' || selectedYear !== 'all') && (
          <button className="clear-filters-btn" onClick={clearFilters}>
            ✖ Limpar Filtros
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card-income">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">Receitas</div>
            <div className="stat-value">R$ {stats.totalIncome.toFixed(2)}</div>
            <div className="stat-detail">{stats.incomeCount} transações</div>
          </div>
        </div>

        <div className="stat-card stat-card-expense">
          <div className="stat-icon">💸</div>
          <div className="stat-content">
            <div className="stat-label">Despesas</div>
            <div className="stat-value">R$ {stats.totalExpenses.toFixed(2)}</div>
            <div className="stat-detail">{stats.expenseCount} transações</div>
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
            <div className="stat-detail">transações filtradas</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      {filteredTransactions.length > 0 ? (
        <div className="charts-container">
          {/* Bar Chart */}
          <div className="chart-card chart-card-full">
            <div className="chart-header">
              <h3>📊 Gráfico de Barras - Por Categoria</h3>
              <p className="chart-subtitle">Top 10 categorias com maiores valores</p>
            </div>
            <div className="chart-wrapper" style={{ height: '350px' }}>
              <Bar data={barChartData} options={barOptions} />
            </div>
          </div>

          {/* Line Chart */}
          <div className="chart-card chart-card-full">
            <div className="chart-header">
              <h3>📈 Gráfico de Linhas - Evolução Temporal</h3>
              <p className="chart-subtitle">Valores ao longo do tempo</p>
            </div>
            <div className="chart-wrapper" style={{ height: '350px' }}>
              <Line data={lineChartData} options={lineOptions} />
            </div>
          </div>

          {/* Pie Chart */}
          <div className="chart-card chart-card-half">
            <div className="chart-header">
              <h3>🥧 Gráfico de Pizza - Distribuição</h3>
              <p className="chart-subtitle">Proporção por categoria (Top 8)</p>
            </div>
            <div className="chart-wrapper" style={{ height: '400px' }}>
              <Pie data={pieChartData} options={pieOptions} />
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>Nenhuma transação encontrada</h3>
          <p>Ajuste os filtros ou adicione novas transações para visualizar os gráficos.</p>
        </div>
      )}
    </div>
  );
};

export default FinancialDashboardPage;
