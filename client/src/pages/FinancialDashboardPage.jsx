import { useState, useEffect, useMemo, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import api, { getTransactions, getSubcategoriesByCategory } from '../services/api';
import { brazilianToISO, isValidBRDate } from '../utils/dateUtils';
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
  // Period filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBarCategory, setSelectedBarCategory] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [apiSubcategories, setApiSubcategories] = useState([]); // opções vindas do servidor
  const [showStatsValues, setShowStatsValues] = useState(false); // mostrar/ocultar valores dos cards
  // Pie chart controls
  const [pieMode, setPieMode] = useState('totals'); // 'totals' | 'income-category'
  const [pieTopN, setPieTopN] = useState(5); // quantidade para Receita/Categoria
  // Full month list (always 12) - uppercase display standard
  const MONTH_NAMES = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];

  // Display formatter for categories/subcategories: first letter uppercase, others lowercase
  const formatCap = (s) => {
    if (!s || typeof s !== 'string') return s;
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedType('all');
    setStartDate('');
    setEndDate('');
    setSelectedCategory('all');
    setSelectedSubcategory('all');
    setSelectedBarCategory('all');
  };

  useEffect(() => {
    fetchTransactions();
    // Transparent date backfill (run once per session)
    (async () => {
      const FLAG = 'backfillDatesDone_v1';
      if (localStorage.getItem(FLAG) === '1') return;
      try {
        const res = await api.post('/transactions/backfill-dates');
        localStorage.setItem(FLAG, '1');
        if (res?.data?.updated > 0) {
          await fetchTransactions();
        }
      } catch (e) {
        localStorage.setItem(FLAG, '1');
      }
    })();
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

  const DEFAULT_SUBCATEGORY_VALUE = 'outros';
  const DEFAULT_SUBCATEGORY_LABEL = 'Outros';

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
    []
  );

  // Helper: aplica máscara DD/MM/YYYY
  const applyDateMask = (value) => {
    let numbers = value.replace(/\D/g, '');
    numbers = numbers.slice(0, 8);
    if (numbers.length >= 5) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
    } else if (numbers.length >= 3) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    }
    return numbers;
  };

  // Handler para mudança de data com máscara
  const handleDateChange = (value, setter) => {
    const masked = applyDateMask(value);
    setter(masked);
  };

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

  // Non-blue palette for pie categories (avoid similarity with income blue)
  const NON_BLUE_PALETTE = [
    '#ef4444', // red
    '#f59e0b', // amber
    '#10b981', // emerald
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#84cc16', // lime
    '#eab308', // yellow
    '#f97316', // orange
    '#14b8a6', // teal
    '#22c55e', // green
    '#a855f7', // purple
  ];

  const nonBlueColorsForKeys = (keys) => {
    const pick = (key, alpha = 0.85) => {
      const idx = stringHash(String(key)) % NON_BLUE_PALETTE.length;
      const hex = NON_BLUE_PALETTE[idx];
      return hexToRgba(hex, alpha);
    };
    const bgColors = keys.map(k => pick(k, 0.85));
    const borderColors = keys.map(k => pick(k, 1));
    return { bgColors, borderColors };
  };

  // Generate visually distinct non-blue colors for a given count
  const distinctNonBluePalette = (count) => {
    const candidateHues = [0, 20, 40, 50, 120, 140, 300, 320, 340, 15, 100, 280];
    const hues = [];
    for (let i = 0; i < count; i++) {
      if (i < candidateHues.length) {
        hues.push(candidateHues[i]);
      } else {
        // Spread remaining avoiding blue band (190-250)
        let h = Math.round((i * 360 / count)) % 360;
        if (h >= 190 && h <= 250) h = (h + 70) % 360; // jump out of blue band
        hues.push(h);
      }
    }
    const bgColors = hues.map(h => `hsla(${h}, 75%, 50%, 0.85)`);
    const borderColors = hues.map(h => `hsla(${h}, 75%, 50%, 1)`);
    return { bgColors, borderColors };
  };

  const typeAndPeriodFilteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (selectedType !== 'all' && t.type !== selectedType) return false;

      // Normalizar datas para comparação (apenas YYYY-MM-DD)
      const tDateStr = new Date(t.date).toISOString().split('T')[0];

      // Converter datas brasileiras para ISO se válidas
      const startISO = startDate && isValidBRDate(startDate) ? brazilianToISO(startDate) : '';
      const endISO = endDate && isValidBRDate(endDate) ? brazilianToISO(endDate) : '';

      // Filter by date range
      if (startISO && tDateStr < startISO) return false;
      if (endISO && tDateStr > endISO) return false;

      return true;
    });
  }, [transactions, selectedType, startDate, endDate]);

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

  // not needed after simplifying pie controls; kept categories util in case of future use

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

      const keys = sorted.map(([name]) => name);
      const labels = keys.map(formatCap);
      const data = sorted.map(([, amount]) => amount);
      const { bgColors, borderColors } = colorsForKeys(keys);
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

      const keys = sorted.map(([name]) => name);
      const labels = keys.map(formatCap);
      const data = sorted.map(([, amount]) => amount);
      const { bgColors, borderColors } = colorsForKeys(keys);
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
    const labels = values.map((value) => formatCap(subcategoryLabels.get(value) || value));
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

  // Prepare data for Line Chart (cumulative balance and expenses over time)
  const lineChartData = useMemo(() => {
    const passSelections = (t) => {
      // Filter by date range using string comparison to avoid timezone issues
      const tDateStr = new Date(t.date).toISOString().split('T')[0];

      // Converter datas brasileiras para ISO se válidas
      const startISO = startDate && isValidBRDate(startDate) ? brazilianToISO(startDate) : '';
      const endISO = endDate && isValidBRDate(endDate) ? brazilianToISO(endDate) : '';

      if (startISO && tDateStr < startISO) return false;
      if (endISO && tDateStr > endISO) return false;

      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      return true;
    };

    const filtered = transactions.filter(passSelections);

    // Se não houver transações filtradas, retornar dados vazios
    if (filtered.length === 0) {
      return {
        labels: [],
        datasets: [
          { label: 'Saldo Acumulado', data: [], borderColor: 'rgba(99, 102, 241, 1)', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderWidth: 3, fill: true, tension: 0.4 },
          { label: 'Despesas', data: [], borderColor: 'rgba(239, 68, 68, 1)', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 3, fill: true, tension: 0.4 }
        ]
      };
    }

    // Determine if we should show daily or monthly view based on date range
    const startISO = startDate && isValidBRDate(startDate) ? brazilianToISO(startDate) : '';
    const endISO = endDate && isValidBRDate(endDate) ? brazilianToISO(endDate) : '';
    const hasPeriod = startISO && endISO;
    const start = hasPeriod ? new Date(startISO) : null;
    const end = hasPeriod ? new Date(endISO) : null;
    const daysDiff = hasPeriod ? Math.ceil((end - start) / (1000 * 60 * 60 * 24)) : 0;
    const singleMonthAndYear = hasPeriod && daysDiff <= 31;

    let labels = [];
    let balanceSeries = [];
    let expenseSeries = [];
    let incomeSeries = [];

    if (singleMonthAndYear) {
      // Usar timestamp como chave para ordenação correta, mas formatar para exibição
      const dataByTimestamp = {};

      filtered.forEach(t => {
        const d = new Date(t.date);
        const timestamp = d.getTime();
        const day = d.getDate();
        const month = d.getMonth() + 1;
        const displayKey = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;

        if (!dataByTimestamp[timestamp]) {
          dataByTimestamp[timestamp] = {
            displayKey,
            income: 0,
            expense: 0,
            expenseForBalance: 0
          };
        }

        if (t.type === 'income') {
          dataByTimestamp[timestamp].income += t.amount;
        } else if (t.type === 'expense') {
          dataByTimestamp[timestamp].expense += t.amount;
          // Apenas adiciona ao saldo se NÃO for cartão alimentação
          if (t.paymentMethod !== 'cartao_alimentacao') {
            dataByTimestamp[timestamp].expenseForBalance += t.amount;
          }
        }
      });

      // Ordenar por timestamp e extrair labels
      const sortedTimestamps = Object.keys(dataByTimestamp).map(Number).sort((a, b) => a - b);
      labels = sortedTimestamps.map(ts => dataByTimestamp[ts].displayKey);

      // Calculate cumulative balance day by day
      let cumulativeBalance = 0;
      balanceSeries = [];
      expenseSeries = [];
      incomeSeries = [];

      sortedTimestamps.forEach(ts => {
        const data = dataByTimestamp[ts];
        const income = data.income;
        const expense = data.expense;
        const expenseForBalance = data.expenseForBalance;

        // Add income to cumulative balance
        cumulativeBalance += income;
        // Subtract expense from cumulative balance (excluindo cartão alimentação)
        cumulativeBalance -= expenseForBalance;

        balanceSeries.push(cumulativeBalance);
        expenseSeries.push(expense);
        incomeSeries.push(income);
      });
    } else {
      const incomeByMonth = {};
      const expenseByMonth = {};
      const expenseForBalanceByMonth = {}; // Despesas que afetam o saldo (excluindo cartão alimentação)

      filtered.forEach(t => {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (t.type === 'income') {
          incomeByMonth[key] = (incomeByMonth[key] || 0) + t.amount;
        } else if (t.type === 'expense') {
          expenseByMonth[key] = (expenseByMonth[key] || 0) + t.amount;
          // Apenas adiciona ao saldo se NÃO for cartão alimentação
          if (t.paymentMethod !== 'cartao_alimentacao') {
            expenseForBalanceByMonth[key] = (expenseForBalanceByMonth[key] || 0) + t.amount;
          }
        }
      });

      const months = Array.from(new Set([...Object.keys(incomeByMonth), ...Object.keys(expenseByMonth)])).sort();
      labels = months.map(m => MONTH_NAMES[parseInt(m.split('-')[1], 10) - 1]);

      // Calculate cumulative balance month by month
      let cumulativeBalance = 0;
      balanceSeries = [];
      expenseSeries = [];
      incomeSeries = [];

      months.forEach(m => {
        const income = incomeByMonth[m] || 0;
        const expense = expenseByMonth[m] || 0;
        const expenseForBalance = expenseForBalanceByMonth[m] || 0;

        // Add income to cumulative balance
        cumulativeBalance += income;
        // Subtract expense from cumulative balance (excluindo cartão alimentação)
        cumulativeBalance -= expenseForBalance;

        balanceSeries.push(cumulativeBalance);
        expenseSeries.push(expense);
        incomeSeries.push(income);
      });
    }

    return {
      labels,
      datasets: [
        {
          label: 'Receitas',
          data: incomeSeries,
          borderColor: 'rgba(34, 197, 94, 1)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgba(34, 197, 94, 1)',
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
        {
          label: 'Saldo',
          data: balanceSeries,
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
      ]
    };
  }, [transactions, startDate, endDate, selectedCategory]);

  // Prepare data for Pie Chart (category distribution)
  const pieChartData = useMemo(() => {
    // Mode: totals (Receita x Despesa)
    if (pieMode === 'totals') {
      const income = filteredTransactions.filter(t => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0);
      const expense = filteredTransactions.filter(t => t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);
      const labels = ['RECEITAS', 'DESPESAS'];
      const data = [income, expense];
      const colors = [
        'rgba(59, 130, 246, 0.85)', // blue for income
        'rgba(239, 68, 68, 0.85)', // red for expense
      ];
      return {
        labels,
        datasets: [{
          label: 'Totais',
          data,
          backgroundColor: colors,
          borderColor: colors.map(c => c.replace('0.85', '1')),
          borderWidth: 2,
          hoverOffset: 8,
        }]
      };
    }

    // Mode: Receita / Categoria / Subcategoria
    if (pieMode === 'income-category') {
      const incomeTotal = filteredTransactions.filter(t => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0);

      // Agrupar despesas por categoria
      const categoryTotals = filteredTransactions.filter(t => t.type === 'expense')
        .reduce((acc, t) => {
          const cat = t.category || 'Sem Categoria';
          acc[cat] = (acc[cat] || 0) + t.amount;
          return acc;
        }, {});

      // Top N categorias de despesa (configurável)
      const sorted = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, Math.max(1, pieTopN));
      const catKeys = sorted.map(([c]) => c);
      const expenseLabels = catKeys.map(c => formatCap(c));
      const expenseData = sorted.map(([, v]) => v);

      const labels = ['RECEITAS', ...expenseLabels];
      const data = [incomeTotal, ...expenseData];

      const blue = 'rgba(59, 130, 246,';
      // Cores variadas e estáveis para categorias, evitando tons de azul
      const { bgColors, borderColors } = distinctNonBluePalette(catKeys.length);
      const backgroundColor = [`${blue}0.85)`, ...bgColors];
      const borderColor = [`${blue}1)`, ...borderColors];

      return {
        labels,
        datasets: [{
          label: 'Receita / Categoria',
          data,
          backgroundColor,
          borderColor,
          borderWidth: 2,
          hoverOffset: 8,
        }]
      };
    }
  }, [filteredTransactions, pieMode, pieTopN]);

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
              strokeStyle: 'rgba(0,0,0,0)',
              lineWidth: 0,
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
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#00f0ff',
        bodyColor: '#fff',
        borderColor: 'rgba(0, 240, 255, 0.8)',
        borderWidth: 2,
        padding: 16,
        displayColors: true,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        bodySpacing: 8,
        callbacks: {
          title: (context) => `📊 ${context[0].label}`,
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
          generateLabels: (chart) => {
            const base = ChartJS.defaults.plugins.legend.labels.generateLabels(chart);
            return base.map(item => ({ ...item, strokeStyle: 'rgba(0,0,0,0)', lineWidth: 0 }));
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#00f0ff',
        bodyColor: '#fff',
        borderColor: 'rgba(0, 240, 255, 0.8)',
        borderWidth: 2,
        padding: 16,
        displayColors: true,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        bodySpacing: 8,
        callbacks: {
          title: (context) => `📅 ${context[0].label}`,
          label: (context) => `${context.dataset.label}: ${currencyFormatter.format(context.parsed.y)}`,
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
          // Generate labels per data item so Totais mostre RECEITAS e DESPESAS
          generateLabels: (chart) => {
            const labels = chart.data.labels || [];
            const dataset = chart.data.datasets?.[0] || {};
            const bg = dataset.backgroundColor;
            const bd = dataset.borderColor;
            return labels.map((text, i) => ({
              text,
              fillStyle: Array.isArray(bg) ? bg[i] : bg,
              strokeStyle: 'rgba(0,0,0,0)',
              lineWidth: 0,
              pointStyle: 'circle',
              fontColor: '#ffffff',
              datasetIndex: 0,
            }));
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#00f0ff',
        bodyColor: '#fff',
        borderColor: 'rgba(0, 240, 255, 0.8)',
        borderWidth: 2,
        padding: 16,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        bodySpacing: 8,
        callbacks: {
          title: (context) => `🥧 ${context[0].label}`,
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${currencyFormatter.format(context.parsed)} (${percentage}%)`;
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
        <h1 className="dashboard-title">📈 Evolução Financeira</h1>
        <p className="dashboard-subtitle">Análise visual completa das suas finanças</p>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-header">
          <h3>🔍 Filtros</h3>
        </div>

        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label">📅 De</label>
            <input
              type="text"
              className="date-input"
              value={startDate}
              onChange={(e) => handleDateChange(e.target.value, setStartDate)}
              placeholder="DD/MM/AAAA"
              maxLength="10"
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">📅 Até</label>
            <input
              type="text"
              className="date-input"
              value={endDate}
              onChange={(e) => handleDateChange(e.target.value, setEndDate)}
              placeholder="DD/MM/AAAA"
              maxLength="10"
            />
          </div>
        </div>

        {(startDate || endDate || selectedCategory !== 'all') && (
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
        <div className={`stat-card ${stats.balance >= 0 ? 'stat-card-balance-positive' : 'stat-card-balance-negative'}`}>
          <div className="stat-icon">{stats.balance >= 0 ? '📈' : '📉'}</div>
          <div className="stat-content">
            <div className="stat-label">Saldo</div>
            <div className="stat-value">{showStatsValues ? currencyFormatter.format(stats.balance) : '••••'}</div>
            <div className="stat-detail">{showStatsValues ? `${stats.incomeCount + stats.expenseCount} transações` : '—'}</div>
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
                      <option key={cat} value={cat}>{formatCap(cat)}</option>
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
                      <option key={subcategory.value} value={subcategory.value}>{formatCap(subcategory.label)}</option>
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
              <p className="chart-subtitle">Saldo Acumulado e Despesas ao longo do tempo</p>
            </div>
            <div className="chart-wrapper" style={{ height: '350px' }}>
              <Line data={lineChartData} options={lineOptions} />
            </div>
          </div>

          {/* Pie Chart */}
          <div className="chart-card chart-card-half">
            <div className="chart-header">
              <h3>🥧 Gráfico de Pizza - Distribuição</h3>
              <div className="chart-controls">
                <div className="filter-group">
                  <label className="chart-control-label">Visão:</label>
                  <select className="filter-select" value={pieMode} onChange={(e) => setPieMode(e.target.value)}>
                    <option value="totals">Totais (Receita x Despesa)</option>
                    <option value="income-category">Receita / Categoria</option>
                  </select>
                </div>
                {pieMode === 'income-category' && (
                  <div className="filter-group">
                    <label className="chart-control-label">Top N:</label>
                    <select className="filter-select" value={pieTopN} onChange={(e) => setPieTopN(parseInt(e.target.value, 10))}>
                      <option value={3}>3</option>
                      <option value={5}>5</option>
                      <option value={8}>8</option>
                      <option value={10}>10</option>
                    </select>
                  </div>
                )}
              </div>
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
