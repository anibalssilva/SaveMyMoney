import React, { useState, useEffect, useMemo } from 'react';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '../services/api';
import api from '../services/api';
import Toast from '../components/Toast';
import DateInput from '../components/DateInput';
import './TransactionsPage.css';

// Custom Tooltip Component
const CustomTooltip = ({ content, title, children, className = '' }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!content) return <span className={className}>{children}</span>;

  return (
    <span
      className={className}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{ position: 'relative', display: 'inline-block', zIndex: showTooltip ? 10000 : 10 }}
    >
      {children}
      {showTooltip && (
        <div className="custom-tooltip">
          <div className="tooltip-title">{title}</div>
          <div className="tooltip-content">{content}</div>
        </div>
      )}
    </span>
  );
};

const TransactionsPage = ({ setAlert }) => {
  const [toast, setToast] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    subcategoryId: '',
    type: 'expense',
    isRecurring: false,
    recurrenceCount: 1,
    notes: '',
    paymentMethod: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Categories and subcategories
  const [availableCategories, setAvailableCategories] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, expense, income
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, amount-desc, amount-asc
  // Period filters (date range)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  // removed month/year multi-selects; using date range instead

  useEffect(() => {
    loadTransactions();
    loadCategories();
    // Transparent date backfill (run once per session)
    (async () => {
      const FLAG = 'backfillDatesDone_v1';
      if (localStorage.getItem(FLAG) === '1') return;
      try {
        const res = await api.post('/transactions/backfill-dates');
        localStorage.setItem(FLAG, '1');
        if (res?.data?.updated > 0) {
          await loadTransactions();
        }
      } catch (e) {
        localStorage.setItem(FLAG, '1');
      }
    })();
  }, []);

  // Load categories from API
  const loadCategories = async () => {
    try {
      const [expenseRes, incomeRes] = await Promise.all([
        api.get('/transactions/categories'),
        api.get('/transactions/income-categories')
      ]);
      setAvailableCategories(expenseRes.data);
      setIncomeCategories(incomeRes.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Load subcategories for a category
  const loadSubcategories = async (categoryId) => {
    try {
      const response = await api.get(`/transactions/subcategories/${categoryId}`);
      const list = Array.isArray(response.data) ? response.data : [];
      setSubcategories(list);

      // Se nenhuma subcategoria estiver definida no formulário, usar uma padrão
      setFormData(prev => {
        if (prev.subcategoryId) return prev;
        const defaultSub = list.find(s => s.id === 'outros') || list[0];
        return { ...prev, subcategoryId: defaultSub ? defaultSub.id : '' };
      });
    } catch (error) {
      console.error('Error loading subcategories:', error);
      const fallback = [{ id: 'outros', name: 'Outros', emoji: '💡' }];
      setSubcategories(fallback);
      setFormData(prev => ({ ...prev, subcategoryId: 'outros' }));
    }
  };

  const loadTransactions = async () => {
    try {
      const res = await getTransactions();
      setTransactions(res.data);
    } catch (error) {
      setToast({
        message: 'Erro ao carregar transações',
        type: 'error',
        duration: 4000
      });
    }
  };

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set();
    transactions.forEach(t => {
      if (t.category) cats.add(t.category);
    });
    return Array.from(cats).sort();
  }, [transactions]);

  // Years set still computed if needed elsewhere (not rendered now)
  const availableYears = useMemo(() => {
    const years = new Set();
    transactions.forEach(t => years.add(new Date(t.date).getFullYear()));
    return Array.from(years).sort((a,b) => a - b);
  }, [transactions]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.category === filterCategory);
    }

    // Period filters
    if (startDate) {
      const from = new Date(startDate + 'T00:00:00');
      filtered = filtered.filter(t => new Date(t.date) >= from);
    }
    if (endDate) {
      const to = new Date(endDate + 'T23:59:59.999');
      filtered = filtered.filter(t => new Date(t.date) <= to);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date) - new Date(a.date);
        case 'date-asc':
          return new Date(a.date) - new Date(b.date);
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [transactions, searchTerm, filterType, filterCategory, startDate, endDate, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const incomes = filteredTransactions.filter(t => t.type === 'income');
    // Despesas que afetam o saldo (excluindo cartão alimentação)
    const expensesForBalance = expenses.filter(t => t.paymentMethod !== 'cartao_alimentacao');

    return {
      totalExpenses: expenses.reduce((sum, t) => sum + t.amount, 0),
      totalIncome: incomes.reduce((sum, t) => sum + t.amount, 0),
      count: filteredTransactions.length,
      balance: incomes.reduce((sum, t) => sum + t.amount, 0) - expensesForBalance.reduce((sum, t) => sum + t.amount, 0)
    };
  }, [filteredTransactions]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle checkbox
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
      return;
    }

    // If type changed, reset category and subcategory
    if (name === 'type') {
      setFormData({ ...formData, [name]: value, category: '', subcategoryId: '' });
      setSubcategories([]);
      return;
    }

    // If category changed, load subcategories
    if (name === 'category') {
      setFormData({ ...formData, [name]: value, subcategoryId: '' });
      if (value) {
        loadSubcategories(value);
      } else {
        setSubcategories([]);
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateTransaction(editingId, formData);
        setToast({
          message: '✅ Transação atualizada com sucesso!',
          type: 'success',
          duration: 3000
        });
      } else {
        // Handle recurring transactions (income or expense)
        if (formData.isRecurring && formData.recurrenceCount > 1) {
          // Create multiple transactions (one for each month)
          const baseDate = new Date(formData.date);
          const transactionsToCreate = [];

          for (let i = 0; i < formData.recurrenceCount; i++) {
            const transactionDate = new Date(baseDate);
            transactionDate.setMonth(baseDate.getMonth() + i);

            transactionsToCreate.push({
              ...formData,
              date: transactionDate.toISOString().split('T')[0],
              // Remove recurrence fields from the transaction data
              isRecurring: undefined,
              recurrenceCount: undefined
            });
          }

          // Create all transactions
          await Promise.all(transactionsToCreate.map(t => createTransaction(t)));

          setToast({
            message: `✅ ${formData.recurrenceCount} transações recorrentes criadas com sucesso!`,
            type: 'success',
            duration: 4000
          });
        } else {
          // Single transaction
          const res = await createTransaction(formData);
          setToast({
            message: '✅ Transação criada com sucesso!',
            type: 'success',
            duration: 3000
          });

          // Check for budget alert
          if (res.data.budgetAlert) {
            setTimeout(() => {
              setToast({
                message: `⚠️ ${res.data.budgetAlert.message}`,
                type: res.data.budgetAlert.severity === 'danger' ? 'error' : 'warning',
                duration: 8000
              });
            }, 3500);
          }
        }
      }

      resetForm();
      loadTransactions();
    } catch (error) {
      setToast({
        message: '❌ Erro ao salvar transação',
        type: 'error',
        duration: 4000
      });
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      subcategoryId: '',
      type: 'expense',
      isRecurring: false,
      recurrenceCount: 1,
      notes: '',
      paymentMethod: '',
    });
    setEditingId(null);
    setShowForm(false);
    setSubcategories([]);
  };

  const onEdit = (transaction) => {
    setFormData({
      description: transaction.description,
      amount: transaction.amount,
      date: new Date(transaction.date).toISOString().split('T')[0],
      category: transaction.category,
      subcategoryId: transaction.subcategoryId || '',
      type: transaction.type,
      notes: transaction.notes || '',
      paymentMethod: transaction.paymentMethod || '',
    });
    setEditingId(transaction._id);
    setShowForm(true);

    // Load subcategories for the transaction's category
    if (transaction.category) {
      loadSubcategories(transaction.category);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = (transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteModal(true);
  };

  const onDelete = async () => {
    if (!transactionToDelete) return;

    try {
      const response = await deleteTransaction(transactionToDelete._id);
      setToast({
        message: '🗑️ Transação excluída com sucesso!',
        type: 'success',
        duration: 3000
      });
      loadTransactions();
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage = error.response?.data?.msg || error.message || 'Erro ao excluir transação';
      setToast({
        message: `❌ ${errorMessage}`,
        type: 'error',
        duration: 5000
      });
    } finally {
      setShowDeleteModal(false);
      setTransactionToDelete(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterCategory('all');
    setStartDate('');
    setEndDate('');
    setSortBy('date-desc');
  };

  // Bulk selection handlers
  const toggleSelectTransaction = (transactionId) => {
    setSelectedTransactions(prev => {
      if (prev.includes(transactionId)) {
        return prev.filter(id => id !== transactionId);
      } else {
        return [...prev, transactionId];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedTransactions.length === filteredTransactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(filteredTransactions.map(t => t._id));
    }
  };

  const confirmBulkDelete = () => {
    if (selectedTransactions.length === 0) return;
    setShowBulkDeleteModal(true);
  };

  const onBulkDelete = async () => {
    if (selectedTransactions.length === 0) return;

    try {
      // Delete all selected transactions
      await Promise.all(
        selectedTransactions.map(id => deleteTransaction(id))
      );

      setToast({
        message: `🗑️ ${selectedTransactions.length} transação(ões) excluída(s) com sucesso!`,
        type: 'success',
        duration: 3000
      });

      setSelectedTransactions([]);
      loadTransactions();
    } catch (error) {
      console.error('Bulk delete error:', error);
      setToast({
        message: '❌ Erro ao excluir transações',
        type: 'error',
        duration: 5000
      });
    } finally {
      setShowBulkDeleteModal(false);
    }
  };

  return (
    <div className="transactions-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">💰 Gerenciar Transações</h1>
          <p className="page-subtitle">Visualize, adicione, edite ou remova suas transações financeiras</p>
        </div>
        <button
          className="btn-add-transaction"
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? '✖ Cancelar' : '➕ Nova Transação'}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-income">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">Receitas</div>
            <div className="stat-value">R$ {stats.totalIncome.toFixed(2)}</div>
          </div>
        </div>

        <div className="stat-card stat-expense">
          <div className="stat-icon">💸</div>
          <div className="stat-content">
            <div className="stat-label">Despesas</div>
            <div className="stat-value">R$ {stats.totalExpenses.toFixed(2)}</div>
          </div>
        </div>

        <div className={`stat-card stat-balance ${stats.balance >= 0 ? 'positive' : 'negative'}`}>
          <div className="stat-icon">{stats.balance >= 0 ? '✅' : '⚠️'}</div>
          <div className="stat-content">
            <div className="stat-label">Saldo</div>
            <div className="stat-value">R$ {stats.balance.toFixed(2)}</div>
          </div>
        </div>

        <div className="stat-card stat-count">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-label">Total</div>
            <div className="stat-value">{stats.count}</div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      {showForm && (
        <div className="form-card">
          <div className="form-header">
            <h2>{editingId ? '✏️ Editar Transação' : '➕ Nova Transação'}</h2>
            <button className="btn-close" onClick={resetForm}>✖</button>
          </div>

          <form onSubmit={onSubmit} className="transaction-form">
            <div className="form-row">
              <div className="form-group">
                <label>Descrição</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={onChange}
                  placeholder="Ex: Almoço no restaurante"
                  required
                />
              </div>

              <div className="form-group">
                <label>Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={formData.amount}
                  onChange={onChange}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Data</label>
                <DateInput
                  name="date"
                  value={formData.date}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Tipo</label>
                <div className="radio-group">
                  <label className={`radio-label ${formData.type === 'expense' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="expense"
                      checked={formData.type === 'expense'}
                      onChange={onChange}
                    />
                    <span className="radio-icon">💸</span>
                    Despesa
                  </label>
                  <label className={`radio-label ${formData.type === 'income' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="income"
                      checked={formData.type === 'income'}
                      onChange={onChange}
                    />
                    <span className="radio-icon">💰</span>
                    Receita
                  </label>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Categoria</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={onChange}
                  required
                  className="category-select"
                >
                  <option value="">Selecione uma categoria</option>
                  {(formData.type === 'income' ? incomeCategories : availableCategories).map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.name && (cat.name.charAt(0).toUpperCase() + cat.name.slice(1).toLowerCase())}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>💳 Método de Pagamento</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={onChange}
                  className="payment-method-select"
                >
                  <option value="">Selecione (opcional)</option>
                  <option value="pix">📱 PIX</option>
                  <option value="pix_parcelado">📱💳 PIX Parcelado</option>
                  <option value="credito">💳 Crédito</option>
                  <option value="debito">💳 Débito</option>
                  <option value="dinheiro">💵 Dinheiro</option>
                  <option value="boleto">📄 Boleto</option>
                  <option value="cartao_alimentacao">🍽️ Cartão Alimentação/Refeição</option>
                </select>
              </div>
            </div>

            {/* Subcategory row - only show when category is selected AND type is expense */}
            {formData.type === 'expense' && formData.category && subcategories.length > 0 && (
              <div className="form-row">
                <div className="form-group">
                  <label>Subcategoria</label>
                  <select
                    name="subcategoryId"
                    value={formData.subcategoryId}
                    onChange={onChange}
                    className="subcategory-select"
                  >
                    {subcategories.map(subcat => (
                      <option key={subcat.id} value={subcat.id}>
                        {subcat.emoji} {subcat.name && (subcat.name.charAt(0).toUpperCase() + subcat.name.slice(1).toLowerCase())}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Recurrence section (both types) */}
            {!editingId && (
              <div className="form-row recurrence-section">
                <div className="form-group recurrence-checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isRecurring"
                      checked={formData.isRecurring}
                      onChange={onChange}
                    />
                    <span className="checkbox-text">🔄 {formData.type === 'income' ? 'Receita' : 'Despesa'} recorrente</span>
                  </label>
                  <p className="help-text">
                    Marque se esta {formData.type === 'income' ? 'receita' : 'despesa'} se repete todos os meses
                  </p>
                </div>

                {formData.isRecurring && (
                  <div className="form-group">
                    <label>Quantidade de repetições</label>
                    <input
                      type="number"
                      name="recurrenceCount"
                      value={formData.recurrenceCount}
                      onChange={onChange}
                      min="1"
                      max="12"
                      placeholder="Ex: 12 (para 12 meses)"
                    />
                    <p className="help-text">
                      Número de meses que esta {formData.type === 'income' ? 'receita' : 'despesa'} vai se repetir (máximo 12)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Notes/Observations field */}
            <div className="form-row">
              <div className="form-group">
                <label>📝 Observações (opcional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={onChange}
                  placeholder="Adicione observações ou detalhes adicionais sobre esta transação..."
                  rows="3"
                  className="notes-textarea"
                />
                <p className="help-text">
                  Campo opcional para anotações adicionais
                </p>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={resetForm}>
                Cancelar
              </button>
              <button type="submit" className="btn-submit">
                {editingId ? '💾 Atualizar' : '➕ Adicionar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters Section */}
      <div className="filters-card">
        <div className="filters-header">
          <h3>🔍 Filtros e Busca</h3>
          {(searchTerm || filterType !== 'all' || filterCategory !== 'all' || startDate || endDate || sortBy !== 'date-desc') && (
            <button className="btn-clear-filters" onClick={clearFilters}>
              ✖ Limpar Filtros
            </button>
          )}
        </div>

        <div className="filters-grid">
          <div className="filter-group">
            <label>🔎 Buscar</label>
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por descrição ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>💵 Tipo</label>
            <select
              className="filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="expense">Despesas</option>
              <option value="income">Receitas</option>
            </select>
          </div>

          <div className="filter-group">
            <label>📂 Categoria</label>
            <select
              className="filter-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">Todas</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>📅 De</label>
            <DateInput
              className="filter-select"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>📅 Até</label>
            <DateInput
              className="filter-select"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>🔄 Ordenar por</label>
            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date-desc">Data (mais recente)</option>
              <option value="date-asc">Data (mais antiga)</option>
              <option value="amount-desc">Valor (maior)</option>
              <option value="amount-asc">Valor (menor)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="table-card">
        <div className="table-header">
          <h3>📋 Transações ({filteredTransactions.length})</h3>
          {selectedTransactions.length > 0 && (
            <div className="bulk-actions">
              <span className="selected-count">
                {selectedTransactions.length} selecionada(s)
              </span>
              <button
                className="btn-bulk-delete"
                onClick={confirmBulkDelete}
                title="Excluir selecionadas"
              >
                🗑️ Excluir Selecionadas
              </button>
              <button
                className="btn-clear-selection"
                onClick={() => setSelectedTransactions([])}
                title="Limpar seleção"
              >
                ✖ Limpar
              </button>
            </div>
          )}
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>Nenhuma transação encontrada</h3>
            <p>
              {transactions.length === 0
                ? 'Adicione sua primeira transação para começar!'
                : 'Tente ajustar os filtros ou fazer uma nova busca.'}
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th className="th-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0}
                      onChange={toggleSelectAll}
                      title="Selecionar todas"
                    />
                  </th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction._id} className={`transaction-row ${transaction.type}`}>
                    <td className="td-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.includes(transaction._id)}
                        onChange={() => toggleSelectTransaction(transaction._id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="td-description">
                      <div className="description-content">
                        <span>{transaction.description.toUpperCase()}</span>
                        {transaction.notes && (
                          <CustomTooltip
                            content={transaction.notes}
                            title="📝 Observações"
                            className="notes-indicator"
                          >
                            ℹ️
                          </CustomTooltip>
                        )}
                      </div>
                    </td>
                    <td className="td-category">
                      <span className="category-badge">{transaction.category && (transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1).toLowerCase())}</span>
                      {transaction.paymentMethod && (
                        <CustomTooltip
                          content={
                            transaction.paymentMethod === 'pix' ? 'PIX' :
                            transaction.paymentMethod === 'pix_parcelado' ? 'PIX Parcelado' :
                            transaction.paymentMethod === 'credito' ? 'Cartão de Crédito' :
                            transaction.paymentMethod === 'debito' ? 'Cartão de Débito' :
                            transaction.paymentMethod === 'dinheiro' ? 'Dinheiro' :
                            transaction.paymentMethod === 'boleto' ? 'Boleto Bancário' :
                            transaction.paymentMethod === 'cartao_alimentacao' ? 'Cartão Alimentação/Refeição' : ''
                          }
                          title="💳 Método de Pagamento"
                          className="payment-method-badge"
                        >
                          {transaction.paymentMethod === 'pix' && '📱'}
                          {transaction.paymentMethod === 'pix_parcelado' && '📱💳'}
                          {transaction.paymentMethod === 'credito' && '💳'}
                          {transaction.paymentMethod === 'debito' && '💳'}
                          {transaction.paymentMethod === 'dinheiro' && '💵'}
                          {transaction.paymentMethod === 'boleto' && '📄'}
                          {transaction.paymentMethod === 'cartao_alimentacao' && '🍽️'}
                        </CustomTooltip>
                      )}
                    </td>
                    <td className="td-date">
                      {new Date(transaction.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="td-type">
                      <span className={`type-badge ${transaction.type}`}>
                        {transaction.type === 'expense' ? '💸 Despesa' : '💰 Receita'}
                      </span>
                    </td>
                    <td className={`td-amount ${transaction.type}`}>
                      R$ {transaction.amount.toFixed(2)}
                    </td>
                    <td className="td-actions">
                      <button
                        className="btn-action btn-edit"
                        onClick={() => onEdit(transaction)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => confirmDelete(transaction)}
                        title="Excluir"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚠️ Confirmar Exclusão</h2>
              <button className="btn-close" onClick={() => setShowDeleteModal(false)}>✖</button>
            </div>
            <div className="modal-body">
              <p>Tem certeza que deseja excluir esta transação?</p>
              {transactionToDelete && (
                <div className="transaction-preview">
                  <p><strong>Descrição:</strong> {transactionToDelete.description}</p>
                  <p><strong>Valor:</strong> R$ {transactionToDelete.amount.toFixed(2)}</p>
                  <p><strong>Categoria:</strong> {transactionToDelete.category}</p>
                </div>
              )}
              <p className="warning-text">⚠️ Esta ação não pode ser desfeita!</p>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </button>
              <button className="btn-delete-confirm" onClick={onDelete}>
                🗑️ Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowBulkDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚠️ Confirmar Exclusão em Lote</h2>
              <button className="btn-close" onClick={() => setShowBulkDeleteModal(false)}>✖</button>
            </div>
            <div className="modal-body">
              <p>Tem certeza que deseja excluir <strong>{selectedTransactions.length}</strong> transação(ões) selecionada(s)?</p>
              <div className="transaction-preview">
                <p><strong>Total de transações:</strong> {selectedTransactions.length}</p>
                <p><strong>Valor total:</strong> R$ {
                  filteredTransactions
                    .filter(t => selectedTransactions.includes(t._id))
                    .reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : -t.amount), 0)
                    .toFixed(2)
                }</p>
              </div>
              <p className="warning-text">⚠️ Esta ação não pode ser desfeita!</p>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowBulkDeleteModal(false)}>
                Cancelar
              </button>
              <button className="btn-delete-confirm" onClick={onBulkDelete}>
                🗑️ Excluir Todas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
