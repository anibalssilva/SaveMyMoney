const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Budget = require('../../models/Budget');
const Transaction = require('../../models/Transaction');

// @route   GET api/budgets
// @desc    Get all budgets for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id });
    res.json(budgets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/budgets
// @desc    Create or update a budget
// @access  Private
router.post('/', auth, async (req, res) => {
  const { category, limit, warningThreshold, alertEnabled, period } = req.body;

  if (!category || !limit) {
    return res.status(400).json({ msg: 'Please provide category and limit' });
  }

  try {
    const budgetFields = {
      user: req.user.id,
      category,
      limit,
      warningThreshold: warningThreshold || 80,
      alertEnabled: alertEnabled !== undefined ? alertEnabled : true,
      period: period || 'monthly',
    };

    let budget = await Budget.findOneAndUpdate(
      { user: req.user.id, category: category },
      { $set: budgetFields },
      { new: true, upsert: true }
    );
    res.json(budget);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// @route   GET api/budgets/stats
// @desc    Get budget statistics with spending data
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id });
    const transactions = await Transaction.find({ user: req.user.id });

    const stats = budgets.map(budget => {
      const now = new Date();
      let startDate, endDate;

      // Calculate date range based on budget period
      if (budget.period === 'weekly') {
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else if (budget.period === 'yearly') {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      } else {
        // monthly (default)
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }

      const totalSpent = transactions
        .filter(
          (t) =>
            t.category === budget.category &&
            t.type === 'expense' &&
            t.date >= startDate &&
            t.date <= endDate
        )
        .reduce((acc, t) => acc + t.amount, 0);

      const percentage = (totalSpent / budget.limit) * 100;
      const remaining = Math.max(0, budget.limit - totalSpent);

      return {
        id: budget._id,
        category: budget.category,
        limit: budget.limit,
        totalSpent,
        remaining,
        percentage: percentage.toFixed(1),
        warningThreshold: budget.warningThreshold,
        alertEnabled: budget.alertEnabled,
        period: budget.period,
        status: percentage >= 100 ? 'exceeded' : percentage >= budget.warningThreshold ? 'warning' : 'ok',
      };
    });

    res.json(stats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/budgets/alerts
// @desc    Get all triggered budget alerts
// @access  Private
router.get('/alerts', auth, async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id, alertEnabled: true });
    const transactions = await Transaction.find({ user: req.user.id });

    const alerts = [];

    for (const budget of budgets) {
      const now = new Date();
      let startDate, endDate;

      // Calculate date range based on budget period
      if (budget.period === 'weekly') {
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else if (budget.period === 'yearly') {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      } else {
        // monthly (default)
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }

      const totalSpent = transactions
        .filter(
          (t) =>
            t.category === budget.category &&
            t.type === 'expense' &&
            t.date >= startDate &&
            t.date <= endDate
        )
        .reduce((acc, t) => acc + t.amount, 0);

      const percentage = (totalSpent / budget.limit) * 100;
      const warningThreshold = budget.warningThreshold || 80;

      // Create alert if spending exceeds warning threshold
      if (percentage >= warningThreshold) {
        const severity = percentage >= 100 ? 'danger' : 'warning';
        const icon = percentage >= 100 ? '🚨' : '⚠️';

        let message;
        if (percentage >= 100) {
          const overspent = totalSpent - budget.limit;
          message = `${icon} Você ultrapassou seu orçamento de R$${budget.limit.toFixed(
            2
          )} para "${budget.category}". Total gasto: R$${totalSpent.toFixed(2)} (${percentage.toFixed(1)}%). Excedente: R$${overspent.toFixed(2)}.`;
        } else {
          const remaining = budget.limit - totalSpent;
          message = `${icon} Atenção! Você já gastou ${percentage.toFixed(1)}% do seu orçamento de R$${budget.limit.toFixed(
            2
          )} para "${budget.category}". Gasto: R$${totalSpent.toFixed(2)}. Restante: R$${remaining.toFixed(2)}.`;
        }

        alerts.push({
          id: budget._id,
          category: budget.category,
          limit: budget.limit,
          totalSpent,
          percentage: percentage.toFixed(1),
          remaining: Math.max(0, budget.limit - totalSpent),
          severity,
          message,
          period: budget.period,
          periodStart: startDate,
          periodEnd: endDate,
        });
      }
    }

    // Sort alerts by severity (danger first) and then by percentage
    alerts.sort((a, b) => {
      if (a.severity === 'danger' && b.severity !== 'danger') return -1;
      if (a.severity !== 'danger' && b.severity === 'danger') return 1;
      return parseFloat(b.percentage) - parseFloat(a.percentage);
    });

    res.json(alerts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
