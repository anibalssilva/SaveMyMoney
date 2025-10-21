const Portfolio = require('../models/Portfolio');
const Asset = require('../models/Asset');
const AssetTransaction = require('../models/AssetTransaction');
const marketDataService = require('./marketDataService');

/**
 * Portfolio Service
 * Handles portfolio management, valuation, and performance calculations
 */

// Normalize date inputs to local 12:00 to avoid TZ regressions (-1 day on display)
function normalizeDateInput(input) {
  const toNoon = (d) => { const nd = new Date(d); nd.setHours(12,0,0,0); return nd; };
  if (!input) return toNoon(new Date());
  try {
    if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
      const [y,m,d] = input.split('-').map(n=>parseInt(n,10));
      return new Date(y, m-1, d, 12, 0, 0);
    }
    const parsed = new Date(input);
    if (!isNaN(parsed.getTime())) return toNoon(parsed);
  } catch (e) {}
  return toNoon(new Date());
}

class PortfolioService {
  /**
   * Create a new portfolio for a user
   */
  async createPortfolio(userId, name, description = '') {
    const portfolio = new Portfolio({
      user: userId,
      name: name || 'Minha Carteira',
      description
    });

    await portfolio.save();
    return portfolio;
  }

  /**
   * Get user's portfolio (creates default if none exists)
   */
  async getUserPortfolio(userId) {
    let portfolio = await Portfolio.findOne({ user: userId, isActive: true });

    if (!portfolio) {
      portfolio = await this.createPortfolio(userId, 'Minha Carteira');
    }

    return portfolio;
  }

  /**
   * Add an asset to portfolio
   */
  async addAsset(userId, portfolioId, assetData) {
    const { symbol, name, type, quantity, price, date, notes, fees = 0 } = assetData;

    // Calculate total invested
    const totalInvested = (quantity * price) + fees;

    // Create asset
    const asset = new Asset({
      user: userId,
      portfolio: portfolioId,
      symbol: symbol.toUpperCase(),
      name,
      type,
      quantity,
      averagePrice: price,
      totalInvested,
      notes
    });

    await asset.save();

    // Create initial buy transaction
    const transaction = new AssetTransaction({
      user: userId,
      asset: asset._id,
      portfolio: portfolioId,
      type: 'buy',
      quantity,
      price,
      totalAmount: quantity * price,
      fees,
      date: normalizeDateInput(date),
      notes: notes || 'Compra inicial'
    });

    await transaction.save();

    // Update asset with transaction
    asset.transactions.push(transaction._id);
    await asset.save();

    // Update portfolio
    await this.updatePortfolioTotals(portfolioId);

    return asset;
  }

  /**
   * Add a transaction to an existing asset
   */
  async addTransaction(userId, assetId, transactionData) {
    const { type, quantity, price, date, notes, fees = 0 } = transactionData;

    const asset = await Asset.findOne({ _id: assetId, user: userId });
    if (!asset) {
      throw new Error('Asset not found');
    }

    // Calculate total amount
    const totalAmount = quantity * price;

    // Create transaction
    const transaction = new AssetTransaction({
      user: userId,
      asset: assetId,
      portfolio: asset.portfolio,
      type,
      quantity,
      price,
      totalAmount,
      fees,
      date: normalizeDateInput(date),
      notes
    });

    await transaction.save();

    // Update asset calculations
    if (type === 'buy') {
      const newTotalInvested = asset.totalInvested + totalAmount + fees;
      const newQuantity = asset.quantity + quantity;
      const newAveragePrice = newTotalInvested / newQuantity;

      asset.quantity = newQuantity;
      asset.averagePrice = newAveragePrice;
      asset.totalInvested = newTotalInvested;
    } else if (type === 'sell') {
      asset.quantity = Math.max(0, asset.quantity - quantity);
      // Note: Don't change averagePrice or totalInvested on sell
      // totalInvested represents historical cost basis
    }

    asset.transactions.push(transaction._id);
    await asset.save();

    // Update portfolio totals
    await this.updatePortfolioTotals(asset.portfolio);

    return transaction;
  }

  /**
   * Update real-time prices for all assets in portfolio
   */
  async updatePortfolioPrices(portfolioId) {
    const assets = await Asset.find({ portfolio: portfolioId, isActive: true });

    if (assets.length === 0) {
      return [];
    }

    // Get all unique symbols
    const symbols = [...new Set(assets.map(a => a.symbol))];

    // Fetch current prices
    const quotes = await marketDataService.fetchQuotes(symbols);

    // Create a map for quick lookup
    const priceMap = new Map();
    quotes.forEach(quote => {
      if (quote) {
        priceMap.set(quote.symbol, {
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent
        });
      }
    });

    // Update each asset
    const updates = [];
    for (const asset of assets) {
      const priceData = priceMap.get(asset.symbol);

      if (priceData) {
        asset.currentPrice = priceData.price;
        asset.currentValue = asset.quantity * priceData.price;
        asset.totalReturn = asset.currentValue - asset.totalInvested;
        asset.totalReturnPercent = asset.totalInvested > 0
          ? (asset.totalReturn / asset.totalInvested) * 100
          : 0;
        asset.dayChange = priceData.change * asset.quantity;
        asset.dayChangePercent = priceData.changePercent;
        asset.lastPriceUpdate = new Date();

        await asset.save();
        updates.push(asset);
      }
    }

    // Update portfolio totals
    await this.updatePortfolioTotals(portfolioId);

    return updates;
  }

  /**
   * Calculate and update portfolio total values
   */
  async updatePortfolioTotals(portfolioId) {
    const assets = await Asset.find({ portfolio: portfolioId, isActive: true });

    let totalInvested = 0;
    let currentValue = 0;

    assets.forEach(asset => {
      totalInvested += asset.totalInvested;
      currentValue += asset.currentValue;
    });

    const totalReturn = currentValue - totalInvested;
    const totalReturnPercent = totalInvested > 0
      ? (totalReturn / totalInvested) * 100
      : 0;

    await Portfolio.findByIdAndUpdate(portfolioId, {
      totalInvested,
      currentValue,
      totalReturn,
      totalReturnPercent,
      lastUpdated: new Date()
    });

    return {
      totalInvested,
      currentValue,
      totalReturn,
      totalReturnPercent
    };
  }

  /**
   * Get complete portfolio with assets and current prices
   */
  async getPortfolioWithAssets(userId) {
    const portfolio = await this.getUserPortfolio(userId);

    // Update prices
    await this.updatePortfolioPrices(portfolio._id);

    // Get assets with updated data
    const assets = await Asset.find({
      portfolio: portfolio._id,
      isActive: true
    }).sort({ currentValue: -1 });

    // Calculate allocation percentages
    const totalValue = portfolio.currentValue || 0.01; // Avoid division by zero
    const assetsWithAllocation = assets.map(asset => ({
      ...asset.toObject(),
      allocationPercent: totalValue > 0
        ? (asset.currentValue / totalValue) * 100
        : 0
    }));

    return {
      portfolio: portfolio.toObject(),
      assets: assetsWithAllocation
    };
  }

  /**
   * Get asset performance over time
   */
  async getAssetPerformance(assetId, userId) {
    const asset = await Asset.findOne({ _id: assetId, user: userId })
      .populate('transactions');

    if (!asset) {
      throw new Error('Asset not found');
    }

    // Get all transactions sorted by date
    const transactions = await AssetTransaction.find({ asset: assetId })
      .sort({ date: 1 });

    // Calculate running totals
    let runningQuantity = 0;
    let runningInvested = 0;
    const performanceData = [];

    transactions.forEach(tx => {
      if (tx.type === 'buy') {
        runningQuantity += tx.quantity;
        runningInvested += tx.totalAmount + tx.fees;
      } else if (tx.type === 'sell') {
        runningQuantity -= tx.quantity;
        // Don't subtract from invested (historical cost)
      }

      performanceData.push({
        date: tx.date,
        type: tx.type,
        quantity: runningQuantity,
        invested: runningInvested,
        averagePrice: runningQuantity > 0 ? runningInvested / runningQuantity : 0,
        price: tx.price
      });
    });

    // Add current data point
    if (asset.currentPrice > 0) {
      performanceData.push({
        date: new Date(),
        type: 'current',
        quantity: asset.quantity,
        invested: asset.totalInvested,
        averagePrice: asset.averagePrice,
        price: asset.currentPrice,
        value: asset.currentValue,
        return: asset.totalReturn,
        returnPercent: asset.totalReturnPercent
      });
    }

    return {
      asset: asset.toObject(),
      performance: performanceData,
      transactions: transactions.map(t => t.toObject())
    };
  }

  /**
   * Get portfolio performance summary
   */
  async getPortfolioSummary(userId) {
    const { portfolio, assets } = await this.getPortfolioWithAssets(userId);

    // Calculate metrics
    const totalDayChange = assets.reduce((sum, a) => sum + (a.dayChange || 0), 0);
    const avgDayChangePercent = assets.length > 0
      ? assets.reduce((sum, a) => sum + (a.dayChangePercent || 0), 0) / assets.length
      : 0;

    // Get best and worst performers
    const sortedByReturn = [...assets].sort((a, b) =>
      b.totalReturnPercent - a.totalReturnPercent
    );

    const bestPerformer = sortedByReturn[0] || null;
    const worstPerformer = sortedByReturn[sortedByReturn.length - 1] || null;

    // Asset type distribution
    const typeDistribution = {};
    assets.forEach(asset => {
      if (!typeDistribution[asset.type]) {
        typeDistribution[asset.type] = {
          count: 0,
          value: 0,
          percent: 0
        };
      }
      typeDistribution[asset.type].count++;
      typeDistribution[asset.type].value += asset.currentValue;
    });

    // Calculate percentages
    const totalValue = portfolio.currentValue || 0.01;
    Object.keys(typeDistribution).forEach(type => {
      typeDistribution[type].percent =
        (typeDistribution[type].value / totalValue) * 100;
    });

    return {
      portfolio,
      assets,
      summary: {
        totalAssets: assets.length,
        totalInvested: portfolio.totalInvested,
        currentValue: portfolio.currentValue,
        totalReturn: portfolio.totalReturn,
        totalReturnPercent: portfolio.totalReturnPercent,
        dayChange: totalDayChange,
        dayChangePercent: avgDayChangePercent,
        bestPerformer,
        worstPerformer,
        typeDistribution
      }
    };
  }

  /**
   * Delete an asset (soft delete)
   */
  async deleteAsset(assetId, userId) {
    const asset = await Asset.findOne({ _id: assetId, user: userId });
    if (!asset) {
      throw new Error('Asset not found');
    }

    asset.isActive = false;
    await asset.save();

    // Update portfolio totals
    await this.updatePortfolioTotals(asset.portfolio);

    return asset;
  }

  /**
   * Get transaction history for portfolio
   */
  async getTransactionHistory(portfolioId, userId, limit = 50) {
    const transactions = await AssetTransaction.find({
      portfolio: portfolioId,
      user: userId
    })
      .populate('asset', 'symbol name type')
      .sort({ date: -1 })
      .limit(limit);

    return transactions;
  }
}

// Singleton instance
const portfolioService = new PortfolioService();

module.exports = portfolioService;
