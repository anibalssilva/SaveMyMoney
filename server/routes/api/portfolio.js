const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const portfolioService = require('../../services/portfolioService');

// All routes require authentication
router.use(auth);

// @route   GET api/portfolio
// @desc    Get user's portfolio with assets
// @access  Private
router.get('/', async (req, res) => {
  try {
    const data = await portfolioService.getPortfolioWithAssets(req.user.id);
    res.json(data);
  } catch (err) {
    console.error('Portfolio error:', err.message);
    res.status(500).json({ msg: 'Error fetching portfolio' });
  }
});

// @route   GET api/portfolio/summary
// @desc    Get portfolio summary with analytics
// @access  Private
router.get('/summary', async (req, res) => {
  try {
    const summary = await portfolioService.getPortfolioSummary(req.user.id);
    res.json(summary);
  } catch (err) {
    console.error('Portfolio summary error:', err.message);
    res.status(500).json({ msg: 'Error fetching portfolio summary' });
  }
});

// @route   POST api/portfolio/assets
// @desc    Add a new asset to portfolio
// @access  Private
router.post('/assets', async (req, res) => {
  try {
    const { symbol, name, type, quantity, price, date, notes, fees } = req.body;

    // Validation
    if (!symbol || !name || !type || !quantity || !price) {
      return res.status(400).json({
        msg: 'Symbol, name, type, quantity, and price are required'
      });
    }

    if (quantity <= 0 || price <= 0) {
      return res.status(400).json({
        msg: 'Quantity and price must be greater than 0'
      });
    }

    // Get or create portfolio
    const portfolio = await portfolioService.getUserPortfolio(req.user.id);

    // Add asset
    const asset = await portfolioService.addAsset(req.user.id, portfolio._id, {
      symbol,
      name,
      type,
      quantity,
      price,
      date,
      notes,
      fees
    });

    res.json({
      msg: 'Asset added successfully',
      asset
    });
  } catch (err) {
    console.error('Add asset error:', err.message);
    res.status(500).json({ msg: 'Error adding asset' });
  }
});

// @route   POST api/portfolio/assets/:assetId/transactions
// @desc    Add a transaction to an asset
// @access  Private
router.post('/assets/:assetId/transactions', async (req, res) => {
  try {
    const { assetId } = req.params;
    const { type, quantity, price, date, notes, fees } = req.body;

    // Validation
    if (!type || !quantity || !price) {
      return res.status(400).json({
        msg: 'Type, quantity, and price are required'
      });
    }

    if (quantity <= 0 || price <= 0) {
      return res.status(400).json({
        msg: 'Quantity and price must be greater than 0'
      });
    }

    if (!['buy', 'sell', 'dividend', 'split', 'fee'].includes(type)) {
      return res.status(400).json({
        msg: 'Invalid transaction type'
      });
    }

    const transaction = await portfolioService.addTransaction(
      req.user.id,
      assetId,
      { type, quantity, price, date, notes, fees }
    );

    res.json({
      msg: 'Transaction added successfully',
      transaction
    });
  } catch (err) {
    console.error('Add transaction error:', err.message);
    if (err.message === 'Asset not found') {
      return res.status(404).json({ msg: 'Asset not found' });
    }
    res.status(500).json({ msg: 'Error adding transaction' });
  }
});

// @route   GET api/portfolio/assets/:assetId/performance
// @desc    Get asset performance over time
// @access  Private
router.get('/assets/:assetId/performance', async (req, res) => {
  try {
    const { assetId } = req.params;
    const performance = await portfolioService.getAssetPerformance(
      assetId,
      req.user.id
    );

    res.json(performance);
  } catch (err) {
    console.error('Asset performance error:', err.message);
    if (err.message === 'Asset not found') {
      return res.status(404).json({ msg: 'Asset not found' });
    }
    res.status(500).json({ msg: 'Error fetching asset performance' });
  }
});

// @route   PUT api/portfolio/refresh
// @desc    Refresh portfolio prices (real-time update)
// @access  Private
router.put('/refresh', async (req, res) => {
  try {
    const portfolio = await portfolioService.getUserPortfolio(req.user.id);
    const updatedAssets = await portfolioService.updatePortfolioPrices(portfolio._id);

    res.json({
      msg: 'Portfolio prices updated',
      updatedCount: updatedAssets.length,
      lastUpdated: new Date()
    });
  } catch (err) {
    console.error('Refresh portfolio error:', err.message);
    res.status(500).json({ msg: 'Error refreshing portfolio' });
  }
});

// @route   DELETE api/portfolio/assets/:assetId
// @desc    Delete an asset
// @access  Private
router.delete('/assets/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params;
    await portfolioService.deleteAsset(assetId, req.user.id);

    res.json({ msg: 'Asset deleted successfully' });
  } catch (err) {
    console.error('Delete asset error:', err.message);
    if (err.message === 'Asset not found') {
      return res.status(404).json({ msg: 'Asset not found' });
    }
    res.status(500).json({ msg: 'Error deleting asset' });
  }
});

// @route   GET api/portfolio/transactions
// @desc    Get transaction history
// @access  Private
router.get('/transactions', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const portfolio = await portfolioService.getUserPortfolio(req.user.id);
    const transactions = await portfolioService.getTransactionHistory(
      portfolio._id,
      req.user.id,
      parseInt(limit)
    );

    res.json({
      transactions,
      count: transactions.length
    });
  } catch (err) {
    console.error('Transactions history error:', err.message);
    res.status(500).json({ msg: 'Error fetching transactions' });
  }
});

module.exports = router;
