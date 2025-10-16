const express = require('express');
const router = express.Router();
const marketDataService = require('../../services/marketDataService');

// @route   GET api/market/quote/:symbol
// @desc    Get quote for a specific symbol
// @access  Public
router.get('/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const quote = await marketDataService.fetchQuote(symbol.toUpperCase());

    if (!quote) {
      return res.status(404).json({ msg: 'Symbol not found' });
    }

    res.json(quote);
  } catch (err) {
    console.error('Quote error:', err.message);
    res.status(500).json({ msg: 'Error fetching quote' });
  }
});

// @route   POST api/market/quotes
// @desc    Get quotes for multiple symbols
// @access  Public
router.post('/quotes', async (req, res) => {
  try {
    const { symbols } = req.body;

    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({ msg: 'Symbols array is required' });
    }

    const quotes = await marketDataService.fetchQuotes(symbols.map(s => s.toUpperCase()));

    res.json({
      quotes,
      count: quotes.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Quotes error:', err.message);
    res.status(500).json({ msg: 'Error fetching quotes' });
  }
});

// @route   GET api/market/summary
// @desc    Get market summary (indices and major stocks)
// @access  Public
router.get('/summary', async (req, res) => {
  try {
    const summary = await marketDataService.getMarketSummary();
    res.json(summary);
  } catch (err) {
    console.error('Summary error:', err.message);
    res.status(500).json({ msg: 'Error fetching market summary' });
  }
});

// @route   GET api/market/indices
// @desc    Get Brazilian market indices
// @access  Public
router.get('/indices', async (req, res) => {
  try {
    const indices = await marketDataService.getBrazilianIndices();
    res.json({
      indices,
      count: indices.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Indices error:', err.message);
    res.status(500).json({ msg: 'Error fetching indices' });
  }
});

// @route   GET api/market/currencies
// @desc    Get currency exchange rates
// @access  Public
router.get('/currencies', async (req, res) => {
  try {
    const rates = await marketDataService.getCurrencyRates();
    res.json({
      currencies: rates,
      count: rates.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Currencies error:', err.message);
    res.status(500).json({ msg: 'Error fetching currency rates' });
  }
});

// @route   GET api/market/search/:query
// @desc    Search for symbols
// @access  Public
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const results = await marketDataService.searchSymbol(query);

    res.json({
      results,
      count: results.length,
      query
    });
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ msg: 'Error searching symbols' });
  }
});

// @route   GET api/market/ticker
// @desc    Get ticker data (for header/footer display)
// @access  Public
router.get('/ticker', async (req, res) => {
  try {
    // Get main Brazilian symbols for ticker (Brapi format)
    // Using only reliable free symbols that work without API token
    const symbols = ['PETR4', 'VALE3', 'ITUB4', 'MGLU3', 'WEGE3', 'ABEV3'];
    const quotes = await marketDataService.fetchQuotes(symbols);

    // Return only successfully fetched quotes
    const tickers = quotes.filter(quote => quote !== null).map(quote => ({
      symbol: quote.symbol,
      displayName: quote.name || quote.symbol,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      isPositive: quote.change >= 0
    }));

    res.json({
      tickers,
      count: tickers.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Ticker error:', err.message);
    res.status(500).json({ msg: 'Error fetching ticker data' });
  }
});

// @route   DELETE api/market/cache
// @desc    Clear cache (admin)
// @access  Public (should be protected in production)
router.delete('/cache', (req, res) => {
  try {
    marketDataService.clearCache();
    res.json({ msg: 'Cache cleared successfully' });
  } catch (err) {
    console.error('Cache clear error:', err.message);
    res.status(500).json({ msg: 'Error clearing cache' });
  }
});

module.exports = router;
