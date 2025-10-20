import { useState, useEffect, useMemo, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { getTransactions, getSubcategoriesByCategory } from '../services/api';
import './FinancialDashboardPage.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);
// Ensure global legend/text color defaults to white (safety against theme overrides)
try {
  ChartJS.defaults.color = '#ffffff';
  if (ChartJS.defaults?.plugins?.legend?.labels) {
    ChartJS.defaults.plugins.legend.labels.color = '#ffffff';
  }
} catch (e) {
  // no-op: defensive guard if defaults shape changes
}

const FinancialDashboardPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all'); // expense, income, all
  // Multi-select filters
  const [selectedMonths, setSelectedMonths] = useState([]); // [] => todos os meses
  const [selectedYears, setSelectedYears] = useState([]);   // [] => todos os anos
  const [selectedBarCategory, setSelectedBarCategory] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [apiSubcategories, setApiSubcategories] = useState([]); // opções vindas do servidor
  const [showStatsValues, setShowStatsValues] = useState(false); // mostrar/ocultar valores dos cards
  // Dropdown open states
  const [openMonths, setOpenMonths] = useState(false);
  const [openYears, setOpenYears] = useState(false);
  const monthsRef = useRef(null);
  const yearsRef = useRef(null);
  // Full month list (always 12)
  const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  // Helpers to toggle month/year selections
  const toggleMonth = (monthNumber) => {
    setSelectedMonths(prev => {
      if (prev.includes(monthNumber)) {
        return prev.filter(m => m !== monthNumber);
      }
      return [...prev, monthNumber];
    });
  };

  const toggleYear = (yearNumber) => {
    setSelectedYears(prev => {
      if (prev.includes(yearNumber)) {
        return prev.filter(y => y !== yearNumber);
      }
      return [...prev, yearNumber];
    });
  };

  // Close dropdown if selecting the "Todos" option
  const clearMonths = () => { setSelectedMonths([]); setOpenMonths(false); };
  const clearYears = () => { setSelectedYears([]); setOpenYears(false); };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (monthsRef.current && !monthsRef.current.contains(e.target)) setOpenMonths(false);
      if (yearsRef.current && !yearsRef.current.contains(e.target)) setOpenYears(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedMonthsLabel = useMemo(() => {
    if (selectedMonths.length === 0) return 'Todos os Meses';
    if (selectedMonths.length === 1) return MONTH_NAMES[selectedMonths[0] - 1];
    if (selectedMonths.length === 2) return `${MONTH_NAMES[selectedMonths[0] - 1]}, ${MONTH_NAMES[selectedMonths[1] - 1]}`;
    return `${selectedMonths.length} meses selecionados`;
  }, [selectedMonths]);

  const selectedYearsLabel = useMemo(() => {
    if (selectedYears.length === 0) return 'Todos os Anos';
    if (selectedYears.length === 1) return String(selectedYears[0]);
    if (selectedYears.length === 2) return `${selectedYears[0]}, ${selectedYears[1]}`;
    return `${selectedYears.length} anos selecionados`;
  }, [selectedYears]);

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
  const availableYears = useMemo(() => {
    const years = new Set();
    transactions.forEach(t => {
      const date = new Date(t.date);
      years.add(date.getFullYear());
    });
    return Array.from(years).sort((a, b) => a - b);
  }, [transactions]);

  const DEFAULT_SUBCATEGORY_VALUE = 'outros';
  const DEFAULT_SUBCATEGORY_LABEL = 'Outros';

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
    []
  );

  // Consistent color mapping
  const CATEGORY_COLOR_MAP = {
    moradia: '#3B82F6',
    contas_fixas: '#8B5CF6',
    supermercado: '#EF4444',
    transporte: '#F59E0B',
    saude: '#10B981',
    pessoais: '#EC4899',
    educacao: '#6366F1',
    filhos: '#F472B6',
    financeiras: '#14B8A6',
    lazer: '#22C55E',
    pets: '#F97316',
    outras: '#64748B',
  };

  const hexToRgba = (hex, alpha = 1) => {
    const h = hex.replace('#','');
    const bigint = parseInt(h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const stringHash = (str) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  };

  const stableBaseColor = (key) => {
    const k = String(key || '').toLowerCase();
    if (CATEGORY_COLOR_MAP[k]) return CATEGORY_COLOR_MAP[k];
    // Fallback deterministic HSL by hash
    const hue = stringHash(k) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  const colorsForKeys = (keys) => {
    const bgColors = keys.map(k => {
      const base = stableBaseColor(k);
      return base.startsWith('hsl(') ? base.replace('hsl(', 'hsla(').replace(')', ', 0.85)') : hexToRgba(base, 0.85);
    });
    const borderColors = keys.map(k => {
      const base = stableBaseColor(k);
      return base.startsWith('hsl(') ? base.replace('hsl(', 'hsla(').replace(')', ', 1)') : hexToRgba(base, 1);
    });
    return { bgColors, borderColors };
  };

  const typeAndPeriodFilteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (selectedType !== 'all' && t.type !== selectedType) return false;

      const tDate = new Date(t.date);
      const tMonth = tDate.getMonth() + 1; // 1-12
      const tYear = tDate.getFullYear();
      if (selectedMonths.length > 0 && !selectedMonths.includes(tMonth)) return false;
      if (selectedYears.length > 0 && !selectedYears.includes(tYear)) return false;

      return true;
    });
  }, [transactions, selectedType, selectedMonths, selectedYears]);

  const availableCategories = useMemo(() => {
    const categories = new Set();
    typeAndPeriodFilteredTransactions.forEach(t => {
      if (t.category) {
        categories.add(t.category);
      }
    });
    return Array.from(categories).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [typeAndPeriodFilteredTransactions]);

  const availableSubcategories = useMemo(() => {
    // Preferir lista completa do servidor (todas as subcategorias do pai)
    if (selectedBarCategory === 'all') return [];

    if (apiSubcategories && apiSubcategories.length > 0) {
      return apiSubcategories
        .map(s => ({ value: s.id || s.value, label: s.name || s.label }))
        .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
    }

    // Fallback: derivar de transações filtradas caso API falhe
    const subcategoriesMap = new Map();
    typeAndPeriodFilteredTransactions.forEach(t => {
      if (t.category === selectedBarCategory) {
        const value = t.subcategoryId || t.subcategory || DEFAULT_SUBCATEGORY_VALUE;
        const label = t.subcategory || t.subcategoryId || DEFAULT_SUBCATEGORY_LABEL;
        if (!subcategoriesMap.has(value)) {
          subcategoriesMap.set(value, label);
        }
      }
    });

    return Array.from(subcategoriesMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  }, [selectedBarCategory, apiSubcategories, typeAndPeriodFilteredTransactions]);

  // Get expense categories for the dropdown
  const expenseCategories = useMemo(() => {
    const categories = new Set();
    typeAndPeriodFilteredTransactions.forEach(t => {
      if (t.type === 'expense' && t.category) {
        categories.add(t.category);
      }
    });
    return Array.from(categories).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [typeAndPeriodFilteredTransactions]);

  // Filter transactions based on selected filters
  const filteredTransactions = useMemo(() => {
    return typeAndPeriodFilteredTransactions.filter(t => {
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;

      return true;
    });
  }, [typeAndPeriodFilteredTransactions, selectedCategory]);

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

  const barChartTransactions = useMemo(() => {
    if (selectedSubcategory === 'all') {
      return filteredTransactions;
    }
    // Accept match either by ID or by label (for dados antigos)
    const selectedLabel = (() => {
      const fromApi = apiSubcategories.find(s => (s.id || s.value) === selectedSubcategory);
      return fromApi ? (fromApi.name || fromApi.label) : undefined;
    })();

    return filteredTransactions.filter(t => {
      const value = t.subcategoryId || t.subcategory || DEFAULT_SUBCATEGORY_VALUE;
      return value === selectedSubcategory || (selectedLabel && value === selectedLabel);
    });
  }, [filteredTransactions, selectedSubcategory, apiSubcategories]);

  // Prepare data for Bar Chart (by category or subcategory)
  const barFocusType = selectedType === 'income' ? 'income' : 'expense';

  const barChartData = useMemo(() => {
    const datasetTransactions = barChartTransactions.filter(t => t.type === barFocusType);

    if (barFocusType === 'income') {
      const categoryTotals = datasetTransactions.reduce((acc, t) => {
        const category = t.category || 'Sem Categoria';
        acc[category] = (acc[category] || 0) + t.amount;
        return acc;
      }, {});

      const sorted = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      const labels = sorted.map(([name]) => name);
      const data = sorted.map(([, amount]) => amount);
      const { bgColors, borderColors } = colorsForKeys(labels);
      return {
        labels,
        datasets: [{
          label: 'Receitas por Categoria',
          data,
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 2,
          borderRadius: 8,
        }]
      };
    }

    if (selectedBarCategory === 'all') {
      const categoryTotals = datasetTransactions.reduce((acc, t) => {
        const category = t.category || 'Sem Categoria';
        acc[category] = (acc[category] || 0) + t.amount;
        return acc;
      }, {});

      const sorted = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      const labels = sorted.map(([name]) => name);
      const data = sorted.map(([, amount]) => amount);
      const { bgColors, borderColors } = colorsForKeys(labels);
      return {
        labels,
        datasets: [{
          label: 'Despesas por Categoria',
          data,
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 2,
          borderRadius: 8,
        }]
      };
    }

    const filtered = datasetTransactions.filter(t => t.category === selectedBarCategory);
    const subcategoryTotals = new Map();
    const subcategoryLabels = new Map();

    filtered.forEach(t => {
      const value = t.subcategoryId || t.subcategory || DEFAULT_SUBCATEGORY_VALUE;
      const label = t.subcategory || t.subcategoryId || DEFAULT_SUBCATEGORY_LABEL;
      subcategoryTotals.set(value, (subcategoryTotals.get(value) || 0) + t.amount);
      if (!subcategoryLabels.has(value)) {
        subcategoryLabels.set(value, label);
      }
    });

    const sorted = Array.from(subcategoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const values = sorted.map(([value]) => value);
    const labels = values.map((value) => subcategoryLabels.get(value) || value);
    const data = sorted.map(([, amount]) => amount);
    const { bgColors, borderColors } = colorsForKeys(values.map(v => `${selectedBarCategory}:${v}`));
    return {
      labels,
      datasets: [{
        label: `Gastos por Subcategoria - ${selectedBarCategory}`,
        data,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 2,
        borderRadius: 8,
      }]
    };
  }, [barChartTransactions, selectedBarCategory, barFocusType]);

  // Prepare data for Line Chart (income vs expense over time) with multi-month/year filters
  const lineChartData = useMemo(() => {
    const passSelections = (t) => {
      const d = new Date(t.date);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      if (selectedMonths.length > 0 && !selectedMonths.includes(m)) return false;
      if (selectedYears.length > 0 && !selectedYears.includes(y)) return false;
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      return true;
    };

    const filtered = transactions.filter(passSelections);
    const singleMonthAndYear = selectedMonths.length === 1 && selectedYears.length === 1;

    let labels = [];
    let incomeSeries = [];
    let expenseSeries = [];

    if (singleMonthAndYear) {
      const targetMonth = selectedMonths[0];
      const targetYear = selectedYears[0];
      const incomeByDay = {};
      const expenseByDay = {};

      filtered.forEach(t => {
        const d = new Date(t.date);
        if (d.getMonth() + 1 !== targetMonth || d.getFullYear() !== targetYear) return;
        const day = d.getDate();
        if (t.type === 'income') incomeByDay[day] = (incomeByDay[day] || 0) + t.amount;
        else if (t.type === 'expense') expenseByDay[day] = (expenseByDay[day] || 0) + t.amount;
      });

      const days = Array.from(new Set([...Object.keys(incomeByDay), ...Object.keys(expenseByDay)]))
        .map(n => parseInt(n, 10))
        .sort((a, b) => a - b);
      labels = days.map(d => `${String(d).padStart(2, '0')}/${String(targetMonth).padStart(2, '0')}`);
      incomeSeries = days.map(d => incomeByDay[d] || 0);
      expenseSeries = days.map(d => expenseByDay[d] || 0);
    } else {
      const incomeByMonth = {};
      const expenseByMonth = {};
      filtered.forEach(t => {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (t.type === 'income') incomeByMonth[key] = (incomeByMonth[key] || 0) + t.amount;
        else if (t.type === 'expense') expenseByMonth[key] = (expenseByMonth[key] || 0) + t.amount;
      });

      const months = Array.from(new Set([...Object.keys(incomeByMonth), ...Object.keys(expenseByMonth)])).sort();
      labels = months.map(m => MONTH_NAMES[parseInt(m.split('-')[1], 10) - 1]);
      incomeSeries = months.map(m => incomeByMonth[m] || 0);
      expenseSeries = months.map(m => expenseByMonth[m] || 0);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Receitas',
          data: incomeSeries,
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgba(59, 130, 246, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
        {
          label: 'Despesas',
          data: expenseSeries,
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgba(239, 68, 68, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
      ]
    };
  }, [transactions, selectedMonths, selectedYears, selectedCategory]);

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
          // Legenda com pointStyle e texto branco
          color: '#ffffff',
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, weight: 600 },
          padding: 15,
          // Generate legend per bar instead of per dataset
          generateLabels: (chart) => {
            const labels = chart.data.labels || [];
            const dataset = chart.data.datasets?.[0] || {};
            const bg = dataset.backgroundColor;
            const bd = dataset.borderColor;
            return labels.map((text, i) => ({
              text,
              fillStyle: Array.isArray(bg) ? bg[i] : bg,
              strokeStyle: Array.isArray(bd) ? bd[i] : bd,
              lineWidth: 1,
              pointStyle: 'circle',
              // Chart.js v3/v4 respeita fontColor por item quando presente
              fontColor: '#ffffff',
              // index is required but we disable click behavior below
              datasetIndex: 0,
            }));
          }
        },
        // Disable default click (which toggles whole dataset)
        onClick: () => {}
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
          label: (context) => `${context.dataset.label}: ${currencyFormatter.format(context.parsed.y)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          callback: (value) => currencyFormatter.format(Number(value))
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
          color: '#ffffff',
          usePointStyle: true,
          pointStyle: 'circle',
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
          label: (context) => `${context.dataset.label}: ${currencyFormatter.format(context.parsed.y)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          callback: (value) => currencyFormatter.format(Number(value))
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
          color: '#ffffff',
          usePointStyle: true,
          pointStyle: 'circle',
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
            return `${context.label}: ${currencyFormatter.format(context.parsed)} (${percentage}%)`;
          }
        }
      }
    }
  };

  const getMonthName = (month) => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months[month - 1];
  };

  useEffect(() => {
    setSelectedCategory('all');
    setSelectedSubcategory('all');
  }, [selectedType]);

  useEffect(() => {
    // Ao trocar a categoria analisada no gráfico, resetar subcategoria
    setSelectedSubcategory('all');
  }, [selectedBarCategory]);

  // Carregar subcategorias completas do servidor quando a categoria do gráfico muda
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (selectedBarCategory !== 'all' && barFocusType === 'expense') {
          const { data } = await getSubcategoriesByCategory(selectedBarCategory);
          if (!cancelled) {
            setApiSubcategories(Array.isArray(data) ? data : []);
          }
        } else {
          setApiSubcategories([]);
        }
      } catch (error) {
        console.error('Erro ao buscar subcategorias:', error?.message || error);
        if (!cancelled) setApiSubcategories([]);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedBarCategory, barFocusType]);

  useEffect(() => {
    if (selectedType === 'income') {
      setSelectedBarCategory('all');
    }
  }, [selectedType]);

  useEffect(() => {
    if (selectedCategory !== 'all' && !availableCategories.includes(selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [availableCategories, selectedCategory]);

  useEffect(() => {
    if (
      selectedSubcategory !== 'all' &&
      !availableSubcategories.some(subcategory => subcategory.value === selectedSubcategory)
    ) {
      setSelectedSubcategory('all');
    }
  }, [availableSubcategories, selectedSubcategory]);

  useEffect(() => {
    if (selectedBarCategory !== 'all' && !expenseCategories.includes(selectedBarCategory)) {
      setSelectedBarCategory('all');
    }
  }, [expenseCategories, selectedBarCategory]);

  const clearFilters = () => {
    setSelectedType('all');
    setSelectedMonths([]);
    setSelectedYears([]);
    setSelectedCategory('all');
    setSelectedSubcategory('all');
    setSelectedBarCategory('all');
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
          <div className="filter-group" ref={monthsRef}>
            <label className="filter-label">Mês</label>
            <button
              type="button"
              className={`multi-dd-toggle ${openMonths ? 'open' : ''}`}
              onClick={() => setOpenMonths(v => !v)}
            >
              <span>{selectedMonthsLabel}</span>
              <span className="caret">▾</span>
            </button>
            {openMonths && (
              <div className="multi-dd-panel">
                <label className={`multi-option ${selectedMonths.length === 0 ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selectedMonths.length === 0}
                    onChange={clearMonths}
                  />
                  Todos os Meses
                </label>
                <div className="multi-options is-expanded">
                  {MONTH_NAMES.map((name, idx) => {
                    const value = idx + 1;
                    const checked = selectedMonths.includes(value);
                    return (
                      <label key={value} className={`multi-option ${checked ? 'active' : ''}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleMonth(value)}
                        />
                        {name}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="filter-group" ref={yearsRef}>
            <label className="filter-label">Ano</label>
            <button
              type="button"
              className={`multi-dd-toggle ${openYears ? 'open' : ''}`}
              onClick={() => setOpenYears(v => !v)}
            >
              <span>{selectedYearsLabel}</span>
              <span className="caret">▾</span>
            </button>
            {openYears && (
              <div className="multi-dd-panel">
                <label className={`multi-option ${selectedYears.length === 0 ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selectedYears.length === 0}
                    onChange={clearYears}
                  />
                  Todos os Anos
                </label>
                <div className="multi-options is-expanded">
                  {availableYears.map((year) => {
                    const checked = selectedYears.includes(year);
                    return (
                      <label key={year} className={`multi-option ${checked ? 'active' : ''}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleYear(year)}
                        />
                        {year}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {(selectedMonths.length > 0 || selectedYears.length > 0 || selectedCategory !== 'all') && (
          <button className="clear-filters-btn" onClick={clearFilters}>
            ✖ Limpar Filtros
          </button>
        )}
      </div>

      {/* Statistics Controls + Cards */}
      <div className="stats-controls">
        <button
          className="stats-toggle-btn"
          onClick={() => setShowStatsValues(v => !v)}
        >
          {showStatsValues ? '🙈 Ocultar valores' : '👁️ Mostrar valores'}
        </button>
      </div>
      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card-income">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">Receitas</div>
            <div className="stat-value">{showStatsValues ? currencyFormatter.format(stats.totalIncome) : '••••'}</div>
            <div className="stat-detail">{showStatsValues ? `${stats.incomeCount} transações` : '—'}</div>
          </div>
        </div>
        <div className="stat-card stat-card-expense">
          <div className="stat-icon">💸</div>
          <div className="stat-content">
            <div className="stat-label">Despesas</div>
            <div className="stat-value">{showStatsValues ? currencyFormatter.format(stats.totalExpenses) : '••••'}</div>
            <div className="stat-detail">{showStatsValues ? `${stats.expenseCount} transações` : '—'}</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      {filteredTransactions.length > 0 ? (
        <div className="charts-container">
          {/* Bar Chart */}
          <div className="chart-card chart-card-full">
            <div className="chart-header">
              <h3>📊 Gráfico de Barras - {barFocusType === 'income' ? 'Receitas' : 'Despesas'}</h3>
              <div className="chart-controls">
                <div className="filter-group">
                  <label className="chart-control-label">Analisar Categoria:</label>
                  <select
                    value={selectedBarCategory}
                    onChange={(e) => setSelectedBarCategory(e.target.value)}
                    className="filter-select"
                    disabled={barFocusType === 'income'}
                  >
                    <option value="all">Todas as Categorias</option>
                    {expenseCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label className="chart-control-label">Filtrar Subcategoria:</label>
                  <select
                    className="filter-select"
                    value={selectedSubcategory}
                    onChange={(e) => setSelectedSubcategory(e.target.value)}
                    disabled={selectedBarCategory === 'all' || availableSubcategories.length === 0}
                  >
                    <option value="all">Todas as Subcategorias</option>
                    {availableSubcategories.map(subcategory => (
                      <option key={subcategory.value} value={subcategory.value}>{subcategory.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <p className="chart-subtitle">
              {barFocusType === 'income'
                ? 'Top 10 categorias com maiores receitas'
                : selectedBarCategory === 'all'
                ? 'Top 10 categorias com maiores despesas'
                : `Top 10 subcategorias de ${selectedBarCategory}`
              }
            </p>
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
