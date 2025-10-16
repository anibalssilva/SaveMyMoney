import React, { useState, useEffect, useRef } from 'react';

import api from '../services/api';

import './MarketTicker.css';

const MarketTicker = ({ refreshInterval = 60000 }) => {

  const [tickers, setTickers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const tickerRef = useRef(null);

  useEffect(() => {

    fetchTickerData();

    // Auto-refresh

    const interval = setInterval(() => {

      fetchTickerData();

    }, refreshInterval);

    return () => clearInterval(interval);

  }, [refreshInterval]);

  const fetchTickerData = async () => {

    try {

      const response = await api.get('/market/ticker');

      if (response.data && response.data.tickers && response.data.tickers.length > 0) {

        setTickers(response.data.tickers);

        setError(null);

      } else {

        // If no tickers returned, don't show error - just keep previous data or hide
        console.warn('No ticker data available');

        if (tickers.length === 0) {
          // Only set error on first load if no data available
          setError(null); // Silent fail - don't show error banner

        }

      }

    } catch (err) {

      console.error('Error fetching ticker data:', err);

      // Don't show error banner if we already have data
      if (tickers.length === 0) {

        setError(null); // Silent fail on error too - market ticker is non-critical

      }

    } finally {

      setLoading(false);

    }

  };

  const formatPrice = (price) => {

    if (price === undefined || price === null) return '--';

    return price.toLocaleString('pt-BR', {

      minimumFractionDigits: 2,

      maximumFractionDigits: 2

    });

  };

  const formatChange = (change, changePercent) => {

    if (change === undefined || change === null) return '--';

    const sign = change >= 0 ? '+' : '';

    const percentText = changePercent !== undefined

      ? ` (${sign}${changePercent.toFixed(2)}%)`

      : '';

    return `${sign}${change.toFixed(2)}${percentText}`;

  };

  // Hide completely if loading and no data yet (non-blocking)
  if (loading && tickers.length === 0) {

    return null; // Don't show loading state - market ticker is optional

  }

  // Hide completely if error and no data (non-blocking)
  if (error && tickers.length === 0) {

    return null; // Don't show error - market ticker is optional feature

  }

  // Hide completely if no tickers available
  if (tickers.length === 0) {

    return null;

  }

  return (

    <div className="market-ticker" ref={tickerRef}>

      <div className="ticker-scroll">

        <div className="ticker-content">

          {tickers.map((ticker, index) => (

            <div

              key={`${ticker.symbol}-${index}`}

              className={`ticker-item ${ticker.isPositive ? 'positive' : 'negative'}`}

            >

              <span className="ticker-symbol">{ticker.symbol}</span>

              <span className="ticker-price">{formatPrice(ticker.price)}</span>

              <span className="ticker-change">

                {formatChange(ticker.change, ticker.changePercent)}

              </span>

            </div>

          ))}

          {/* Duplicate for seamless loop */}

          {tickers.map((ticker, index) => (

            <div

              key={`${ticker.symbol}-duplicate-${index}`}

              className={`ticker-item ${ticker.isPositive ? 'positive' : 'negative'}`}

            >

              <span className="ticker-symbol">{ticker.symbol}</span>

              <span className="ticker-price">{formatPrice(ticker.price)}</span>

              <span className="ticker-change">

                {formatChange(ticker.change, ticker.changePercent)}

              </span>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

};

export default MarketTicker;


