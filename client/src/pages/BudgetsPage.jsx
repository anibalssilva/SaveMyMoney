import React, { useState, useEffect } from 'react';
import { getBudgets, saveBudget } from '../services/api';

const BudgetsPage = () => {
  const [budgets, setBudgets] = useState([]);
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const response = await getBudgets();
        setBudgets(response.data);
      } catch (error) {
        console.error('Error fetching budgets', error);
      }
    };
    fetchBudgets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await saveBudget({ category, limit });
      // Update budget in list or add new one
      const updatedBudgets = budgets.filter(b => b.category !== category);
      setBudgets([...updatedBudgets, response.data]);
      setMessage(`Budget for ${category} saved successfully!`);
      setCategory('');
      setLimit('');
    } catch (error) {
      console.error('Error saving budget', error);
      setMessage('Error saving budget. Please try again.');
    }
  };

  return (
    <div className="container">
      <h2>Budgets</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Limit</label>
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            required
          />
        </div>
        <button type="submit">Save Budget</button>
      </form>

      <hr />

      <h3>Existing Budgets</h3>
      <ul>
        {budgets.map((budget) => (
          <li key={budget._id}>
            {budget.category}: R$ {budget.limit.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BudgetsPage;
