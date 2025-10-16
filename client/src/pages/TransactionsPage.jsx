import React, { useState, useEffect } from 'react';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, api } from '../services/api';
import TransactionsChart from '../components/TransactionsChart';
import Toast from '../components/Toast';
import { API_BASE_URL } from '../services/api';

const TransactionsPage = ({ setAlert }) => {
  const [toast, setToast] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: '',
    category: '',
    type: 'expense',
  });
  const [editingId, setEditingId] = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    const res = await getTransactions();
    setTransactions(res.data);
    processChartData(res.data);
  };

  const processChartData = (transactions) => {
    const data = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { date, income: 0, expense: 0 };
      }
      if (transaction.type === 'income') {
        acc[date].income += transaction.amount;
      } else {
        acc[date].expense += transaction.amount;
      }
      return acc;
    }, {});
    setChartData(Object.values(data));
  };

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateTransaction(editingId, formData);
        setToast({
          message: 'Transação atualizada com sucesso!',
          type: 'success',
          duration: 3000
        });
      } else {
        const res = await createTransaction(formData);
        setToast({
          message: 'Transação criada com sucesso!',
          type: 'success',
          duration: 3000
        });

        // Check for budget alert
        if (res.data.budgetAlert) {
          setTimeout(() => {
            setToast({
              message: res.data.budgetAlert.message,
              type: res.data.budgetAlert.severity === 'danger' ? 'danger' : 'warning',
              duration: 8000
            });
          }, 3500);
          if (setAlert) {
            setAlert(res.data.budgetAlert.message);
          }
        }
      }
      setFormData({
        description: '',
        amount: '',
        date: '',
        category: '',
        type: 'expense',
      });
      setEditingId(null);
      loadTransactions();
    } catch (error) {
      setToast({
        message: 'Erro ao salvar transação',
        type: 'error',
        duration: 4000
      });
    }
  };

  const onEdit = (transaction) => {
    setFormData({
      description: transaction.description,
      amount: transaction.amount,
      date: new Date(transaction.date).toISOString().split('T')[0],
      category: transaction.category,
      type: transaction.type,
    });
    setEditingId(transaction._id);
  };

  const onDelete = async (id) => {
    await deleteTransaction(id);
    loadTransactions();
  };

  const onExport = async (format) => {
    const res = await api.get(`/transactions/export?format=${format}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transactions.${format}`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => setToast(null)}
        />
      )}
      <h1>Transactions</h1>
      <div>
        <button onClick={() => onExport('csv')}>Export as CSV</button>
        <button onClick={() => onExport('xlsx')}>Export as XLSX</button>
      </div>
      <TransactionsChart data={chartData} />
      <form onSubmit={onSubmit}>
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={onChange}
          placeholder="Description"
          required
        />
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={onChange}
          placeholder="Amount"
          required
        />
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={onChange}
          required
        />
        <input
          type="text"
          name="category"
          value={formData.category}
          onChange={onChange}
          placeholder="Category"
          required
        />
        <select name="type" value={formData.type} onChange={onChange}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <button type="submit">{editingId ? 'Update' : 'Add'} Transaction</button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Category</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction._id}>
              <td>{transaction.description}</td>
              <td>{transaction.amount}</td>
              <td>{new Date(transaction.date).toLocaleDateString()}</td>
              <td>{transaction.category}</td>
              <td>{transaction.type}</td>
              <td>
                <button onClick={() => onEdit(transaction)}>Edit</button>
                <button onClick={() => onDelete(transaction._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionsPage;