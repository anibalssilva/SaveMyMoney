'''
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AlertsPage = () => {
  const [budgets, setBudgets] = useState([]);
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const res = await api.get('/budgets');
        setBudgets(res.data);
      } catch (err) {
        console.error(err.response.data);
      }
    };

    fetchBudgets();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!category || !limit) {
      setMessage('Please fill in all fields');
      return;
    }
    try {
      const res = await api.post('/budgets', { category, limit });
      setBudgets([...budgets, res.data]);
      setCategory('');
      setLimit('');
      setMessage('Budget saved!');
    } catch (err) {
      setMessage(err.response.data.msg || 'Server Error');
    }
  };

  return (
    <div className="container">
      <h2>Configurar Alertas de Orçamento</h2>
      {message && <div className="alert alert-info">{message}</div>}
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>Categoria</label>
          <input
            type="text"
            className="form-control"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Limite</label>
          <input
            type="number"
            className="form-control"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary mt-3">
          Salvar Orçamento
        </button>
      </form>

      <hr />

      <h3>Orçamentos Atuais</h3>
      <ul className="list-group">
        {budgets.map((budget) => (
          <li key={budget._id} className="list-group-item">
            {budget.category}: R$ {budget.limit.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AlertsPage;
'''