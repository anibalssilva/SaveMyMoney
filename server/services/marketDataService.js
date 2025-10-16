const axios = require('axios');

/**
 * Market Data Service
 * Fetches real-time stock quotes and indices from multiple sources
 */

class MarketDataService {
  constructor() {
    // Cache configuration
    this.cache = new Map();
    this.cacheDuration = 60000; // 1 minute

    // API configurations
    this.brapiBaseUrl = 'https://brapi.dev/api';
    this.yahooFinanceKey = process.env.YAHOO_FINANCE_KEY || '';
    this.yahooFinanceHost = 'apidojo-yahoo-finance-v1.p.rapidapi.com';

    // Default symbols to track
    this.defaultSymbols = {
      indices: ['IBOV', 'IFIX', 'BVSP'], // B3 indices
      stocks: ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3'], // Popular Brazilian stocks
      currencies: ['USDBRL', 'EURBRL'], // Currency pairs
      crypto: ['BTC', 'ETH'] // Cryptocurrencies
    };
  }

  /**
   * Get cache key
   */
  getCacheKey(symbol, source) {
    return `${source}:${symbol}`;
  }

  /**
   * Check if cache is valid
   */
  isCacheValid(key) {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.cacheDuration;
  }

  /**
   * Get from cache
   */
  getFromCache(key) {
    if (this.isCacheValid(key)) {
      return this.cache.get(key).data;
    }
    return null;
  }

  /**
   * Set cache
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Fetch quote from Brapi (Free Brazilian API)
   */
  async fetchFromBrapi(symbol) {
    const cacheKey = this.getCacheKey(symbol, 'brapi');
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.brapiBaseUrl}/quote/${symbol}`, {
        params: {
          range: '1d',
          interval: '1d',
          fundamental: false
        }
      });

      if (response.data && response.data.results && response.data.results.length > 0) {
        const quote = response.data.results[0];
        const formattedData = {
          symbol: quote.symbol,
          name: quote.longName || quote.shortName,
          price: quote.regularMarketPrice,
          change: quote.regularMarketChange,
          changePercent: quote.regularMarketChangePercent,
          currency: quote.currency,
          marketTime: quote.regularMarketTime,
          source: 'brapi'
        };

        this.setCache(cacheKey, formattedData);
        return formattedData;
      }

      return null;
    } catch (error) {
      console.error(`Brapi error for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Fetch quote from Yahoo Finance (via RapidAPI)
   */
  async fetchFromYahoo(symbol) {
    if (!this.yahooFinanceKey) {
      console.warn('Yahoo Finance API key not configured');
      return null;
    }

    const cacheKey = this.getCacheKey(symbol, 'yahoo');
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(
        `https://${this.yahooFinanceHost}/market/v2/get-quotes`,
        {
          params: { symbols: symbol, region: 'BR' },
          headers: {
            'X-RapidAPI-Key': this.yahooFinanceKey,
            'X-RapidAPI-Host': this.yahooFinanceHost
          }
        }
      );

      if (response.data && response.data.quoteResponse && response.data.quoteResponse.result) {
        const quote = response.data.quoteResponse.result[0];
        const formattedData = {
          symbol: quote.symbol,
          name: quote.longName || quote.shortName,
          price: quote.regularMarketPrice,
          change: quote.regularMarketChange,
          changePercent: quote.regularMarketChangePercent,
          currency: quote.currency,
          marketTime: quote.regularMarketTime,
          source: 'yahoo'
        };

        this.setCache(cacheKey, formattedData);
        return formattedData;
      }

      return null;
    } catch (error) {
      console.error(`Yahoo Finance error for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Fetch multiple quotes
   */
  async fetchQuotes(symbols) {
    const promises = symbols.map(symbol => this.fetchQuote(symbol));
    const results = await Promise.all(promises);
    return results.filter(quote => quote !== null);
  }

  /**
   * Fetch single quote (tries Brapi first, then Yahoo)
   */
  async fetchQuote(symbol) {
    // Try Brapi first (free)
    let quote = await this.fetchFromBrapi(symbol);

    // Fallback to Yahoo if Brapi fails and key is available
    if (!quote && this.yahooFinanceKey) {
      quote = await this.fetchFromYahoo(symbol);
    }

    return quote;
  }

  /**
   * Get market summary (indices and major stocks)
   */
  async getMarketSummary() {
    const cacheKey = 'market:summary';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Fetch Brazilian indices and stocks (Brapi format)
      const indicesSymbols = ['IBOV', 'IFIX']; // Ibovespa and IFIX
      const stocksSymbols = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4'];

      const allSymbols = [...indicesSymbols, ...stocksSymbols];
      const quotes = await this.fetchQuotes(allSymbols);

      const summary = {
        indices: quotes.filter(q => indicesSymbols.includes(q.symbol)),
        stocks: quotes.filter(q => stocksSymbols.includes(q.symbol)),
        lastUpdate: new Date().toISOString()
      };

      this.setCache(cacheKey, summary);
      return summary;
    } catch (error) {
      console.error('Market summary error:', error.message);
      return {
        indices: [],
        stocks: [],
        lastUpdate: new Date().toISOString(),
        error: 'Unable to fetch market data'
      };
    }
  }

  /**
   * Get Brazilian market indices
   */
  async getBrazilianIndices() {
    const symbols = ['IBOV', 'IFIX', 'SMALL', 'IDIV'];

    try {
      const response = await axios.get(`${this.brapiBaseUrl}/quote/list`, {
        params: {
          sortBy: 'volume',
          sortOrder: 'desc',
          limit: 10,
          type: 'index'
        }
      });

      if (response.data && response.data.indexes) {
        return response.data.indexes.map(index => ({
          symbol: index.stock,
          name: index.name,
          price: index.close,
          change: index.change,
          changePercent: index.changePercent,
          volume: index.volume,
          source: 'brapi'
        }));
      }

      return [];
    } catch (error) {
      console.error('Indices error:', error.message);
      return [];
    }
  }

  /**
   * Get currency rates
   */
  async getCurrencyRates() {
    const currencies = ['USDBRL', 'EURBRL', 'GBPBRL'];

    try {
      const quotes = await this.fetchQuotes(currencies);
      return quotes.map(quote => ({
        pair: quote.symbol,
        name: quote.name,
        rate: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        source: quote.source
      }));
    } catch (error) {
      console.error('Currency rates error:', error.message);
      return [];
    }
  }

  /**
   * Search for symbols
   */
  async searchSymbol(query) {
    try {
      const response = await axios.get(`${this.brapiBaseUrl}/quote/list`, {
        params: {
          search: query,
          limit: 10
        }
      });

      if (response.data && response.data.stocks) {
        return response.data.stocks.map(stock => ({
          symbol: stock.stock,
          name: stock.name,
          type: stock.type,
          source: 'brapi'
        }));
      }

      return [];
    } catch (error) {
      console.error('Search error:', error.message);
      return [];
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Clear old cache entries
   */
  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheDuration) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
const marketDataService = new MarketDataService();

// Clean cache every 5 minutes
setInterval(() => {
  marketDataService.cleanCache();
}, 300000);

module.exports = marketDataService;
