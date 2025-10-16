const Transaction = require('../models/Transaction');

/**
 * Financial Analyzer Service
 * Analyzes user's financial situation and calculates investment capacity
 */

class FinancialAnalyzer {
  /**
   * Calculate average monthly income from transactions
   */
  async calculateMonthlyIncome(userId) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const incomeTransactions = await Transaction.find({
      user: userId,
      type: 'income',
      date: { $gte: sixMonthsAgo },
    });

    if (incomeTransactions.length === 0) return 0;

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const months = Math.min(6, Math.ceil(incomeTransactions.length / 4)); // Estimate

    return totalIncome / months;
  }

  /**
   * Calculate average monthly expenses from transactions
   */
  async calculateMonthlyExpenses(userId) {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const expenseTransactions = await Transaction.find({
      user: userId,
      type: 'expense',
      date: { $gte: threeMonthsAgo },
    });

    if (expenseTransactions.length === 0) return 0;

    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

    return totalExpenses / 3;
  }

  /**
   * Calculate savings capacity
   */
  async calculateSavingsCapacity(userId, monthlyIncome = null) {
    const income = monthlyIncome || await this.calculateMonthlyIncome(userId);
    const expenses = await this.calculateMonthlyExpenses(userId);

    const savingsCapacity = income - expenses;
    const savingsRate = income > 0 ? (savingsCapacity / income) * 100 : 0;

    return {
      monthlyIncome: income,
      monthlyExpenses: expenses,
      savingsCapacity: Math.max(0, savingsCapacity),
      savingsRate: Math.max(0, savingsRate),
    };
  }

  /**
   * Calculate recommended emergency fund
   * Rule: 6 months of expenses (conservative) to 12 months (aggressive)
   */
  calculateEmergencyFund(monthlyExpenses, riskProfile = 'moderate') {
    const multipliers = {
      conservative: 12,
      moderate: 6,
      aggressive: 4,
    };

    const months = multipliers[riskProfile] || 6;
    const recommendedAmount = monthlyExpenses * months;

    return {
      recommendedAmount,
      months,
      monthlyContribution: recommendedAmount / 12, // Build in 1 year
    };
  }

  /**
   * Calculate financial health score (0-100)
   */
  async calculateFinancialHealth(userId, profile = null) {
    const savingsData = await this.calculateSavingsCapacity(userId);

    let score = 0;

    // Savings rate (40 points)
    if (savingsData.savingsRate >= 30) score += 40;
    else if (savingsData.savingsRate >= 20) score += 30;
    else if (savingsData.savingsRate >= 10) score += 20;
    else if (savingsData.savingsRate > 0) score += 10;

    // Emergency fund (30 points)
    if (profile && profile.hasEmergencyFund) {
      const emergencyFund = this.calculateEmergencyFund(
        savingsData.monthlyExpenses,
        profile.riskProfile
      );
      const coverage = (profile.emergencyFundAmount / emergencyFund.recommendedAmount) * 100;

      if (coverage >= 100) score += 30;
      else if (coverage >= 75) score += 25;
      else if (coverage >= 50) score += 20;
      else if (coverage >= 25) score += 10;
    }

    // Income vs Expenses ratio (30 points)
    if (savingsData.savingsCapacity > 0) {
      const ratio = savingsData.monthlyIncome / savingsData.monthlyExpenses;
      if (ratio >= 2) score += 30;
      else if (ratio >= 1.5) score += 25;
      else if (ratio >= 1.2) score += 20;
      else if (ratio > 1) score += 15;
    }

    return {
      score: Math.min(100, score),
      rating: this.getHealthRating(score),
      ...savingsData,
    };
  }

  /**
   * Get health rating text
   */
  getHealthRating(score) {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Boa';
    if (score >= 40) return 'Regular';
    if (score >= 20) return 'Precisa Melhorar';
    return 'Crítica';
  }

  /**
   * Analyze spending by category
   */
  async analyzeSpendingByCategory(userId) {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const expenses = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
          date: { $gte: threeMonthsAgo },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          average: { $avg: '$amount' },
        },
      },
      {
        $sort: { total: -1 },
      },
    ]);

    const totalSpending = expenses.reduce((sum, cat) => sum + cat.total, 0);

    return expenses.map(cat => ({
      category: cat._id,
      total: cat.total,
      average: cat.average,
      percentage: totalSpending > 0 ? (cat.total / totalSpending) * 100 : 0,
      count: cat.count,
    }));
  }
}

module.exports = new FinancialAnalyzer();
