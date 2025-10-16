import React, { useState, useEffect } from 'react';

import api from '../services/api';

import {

  LineChart,

  Line,

  AreaChart,

  Area,

  XAxis,

  YAxis,

  CartesianGrid,

  Tooltip,

  Legend,

  ResponsiveContainer

} from 'recharts';

import './Modal.css';

import './AssetPerformanceChart.css';

const AssetPerformanceChart = ({ assetId, assetSymbol, onClose }) => {

  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [chartType, setChartType] = useState('value'); // 'value' or 'price'

  useEffect(() => {

    fetchPerformanceData();

  }, [assetId]);

  const fetchPerformanceData = async () => {

    try {

      const response = await api.get(

        `/portfolio/assets/${assetId}/performance`

      );

      setData(response.data);

      setLoading(false);

    } catch (err) {

      console.error('Error fetching performance:', err);

      setLoading(false);

    }

  };

  const formatCurrency = (value) => {

    return new Intl.NumberFormat('pt-BR', {

      style: 'currency',

      currency: 'BRL'

    }).format(value || 0);

  };

  const formatDate = (dateString) => {

    const date = new Date(dateString);

    return date.toLocaleDateString('pt-BR', {

      day: '2-digit',

      month: '2-digit',

      year: '2-digit'

    });

  };

  const getTransactionIcon = (type) => {

    const icons = {

      buy: '',

      sell: '',

      dividend: '',

      split: '',

      fee: '',

      current: ''

    };

    return icons[type] || '';

  };

  const getTransactionLabel = (type) => {

    const labels = {

      buy: 'Compra',

      sell: 'Venda',

      dividend: 'Dividendo',

      split: 'Desdobramento',

      fee: 'Taxa',

      current: 'Atual'

    };

    return labels[type] || type;

  };

  if (loading) {

    return (

      <div className="modal-overlay" onClick={onClose}>

        <div className="modal-content performance-modal" onClick={(e) => e.stopPropagation()}>

          <div className="loading">Carregando dados...</div>

        </div>

      </div>

    );

  }

  if (!data || !data.asset) {

    return (

      <div className="modal-overlay" onClick={onClose}>

        <div className="modal-content performance-modal" onClick={(e) => e.stopPropagation()}>

          <div className="error">Erro ao carregar dados</div>

        </div>

      </div>

    );

  }

  const { asset, performance, transactions } = data;

  // Prepare chart data

  const chartData = performance.map(point => ({

    date: formatDate(point.date),

    fullDate: point.date,

    price: point.price,

    averagePrice: point.averagePrice,

    invested: point.invested,

    value: point.value || point.quantity * point.price,

    quantity: point.quantity,

    type: point.type

  }));

  // Custom tooltip

  const CustomTooltip = ({ active, payload }) => {

    if (active && payload && payload.length) {

      const data = payload[0].payload;

      return (

        <div className="custom-tooltip">

          <p className="tooltip-date">{data.date}</p>

          <p className="tooltip-item">

            Preco: <strong>{formatCurrency(data.price)}</strong>

          </p>

          <p className="tooltip-item">

            Quantidade: <strong>{data.quantity}</strong>

          </p>

          {data.value && (

            <p className="tooltip-item">

              Valor: <strong>{formatCurrency(data.value)}</strong>

            </p>

          )}

          {data.invested && (

            <p className="tooltip-item">

              Investido: <strong>{formatCurrency(data.invested)}</strong>

            </p>

          )}

        </div>

      );

    }

    return null;

  };

  return (

    <div className="modal-overlay" onClick={onClose}>

      <div

        className="modal-content performance-modal"

        onClick={(e) => e.stopPropagation()}

      >

        <div className="modal-header">

          <div>

            <h2>Performance do Ativo</h2>

            <p className="modal-subtitle">

              {asset.symbol} - {asset.name}

            </p>

          </div>

          <button className="modal-close" onClick={onClose}>
            X
          </button>

        </div>

        <div className="performance-content">

          {/* Asset Summary */}

          <div className="performance-summary">

            <div className="summary-card-small">

              <span>Quantidade Atual</span>

              <strong>{asset.quantity}</strong>

            </div>

            <div className="summary-card-small">

              <span>Preco Medio</span>

              <strong>{formatCurrency(asset.averagePrice)}</strong>

            </div>

            <div className="summary-card-small">

              <span>Preco Atual</span>

              <strong>

                {asset.currentPrice > 0 ? formatCurrency(asset.currentPrice) : '--'}

              </strong>

            </div>

            <div className="summary-card-small">

              <span>Total Investido</span>

              <strong>{formatCurrency(asset.totalInvested)}</strong>

            </div>

            <div className="summary-card-small">

              <span>Valor Atual</span>

              <strong>{formatCurrency(asset.currentValue)}</strong>

            </div>

            <div

              className={`summary-card-small ${

                asset.totalReturn >= 0 ? 'positive' : 'negative'

              }`}

            >

              <span>Retorno</span>

              <strong>

                {formatCurrency(asset.totalReturn)}

                <br />

                <small>

                  ({asset.totalReturn >= 0 ? '+' : ''}

                  {asset.totalReturnPercent.toFixed(2)}%)

                </small>

              </strong>

            </div>

          </div>

          {/* Chart Type Selector */}

          <div className="chart-selector">

            <button

              className={`selector-btn ${chartType === 'value' ? 'active' : ''}`}

              onClick={() => setChartType('value')}

            >

              Valor da Posicao

            </button>

            <button

              className={`selector-btn ${chartType === 'price' ? 'active' : ''}`}

              onClick={() => setChartType('price')}

            >

              Preco por Unidade

            </button>

          </div>

          {/* Chart */}

          <div className="chart-container">

            <ResponsiveContainer width="100%" height={300}>

              {chartType === 'value' ? (

                <AreaChart data={chartData}>

                  <defs>

                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">

                      <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />

                      <stop offset="95%" stopColor="#667eea" stopOpacity={0} />

                    </linearGradient>

                    <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">

                      <stop offset="5%" stopColor="#48bb78" stopOpacity={0.8} />

                      <stop offset="95%" stopColor="#48bb78" stopOpacity={0} />

                    </linearGradient>

                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

                  <XAxis

                    dataKey="date"

                    stroke="#718096"

                    style={{ fontSize: '0.75rem' }}

                  />

                  <YAxis

                    stroke="#718096"

                    style={{ fontSize: '0.75rem' }}

                    tickFormatter={(value) => `R$ ${value.toFixed(0)}`}

                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Legend />

                  <Area

                    type="monotone"

                    dataKey="value"

                    name="Valor Atual"

                    stroke="#667eea"

                    fillOpacity={1}

                    fill="url(#colorValue)"

                  />

                  <Area

                    type="monotone"

                    dataKey="invested"

                    name="Valor Investido"

                    stroke="#48bb78"

                    fillOpacity={1}

                    fill="url(#colorInvested)"

                  />

                </AreaChart>

              ) : (

                <LineChart data={chartData}>

                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

                  <XAxis

                    dataKey="date"

                    stroke="#718096"

                    style={{ fontSize: '0.75rem' }}

                  />

                  <YAxis

                    stroke="#718096"

                    style={{ fontSize: '0.75rem' }}

                    tickFormatter={(value) => `R$ ${value.toFixed(2)}`}

                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Legend />

                  <Line

                    type="monotone"

                    dataKey="price"

                    name="Preco de Transacao"

                    stroke="#667eea"

                    strokeWidth={3}

                    dot={{ fill: '#667eea', r: 5 }}

                  />

                  <Line

                    type="monotone"

                    dataKey="averagePrice"

                    name="Preco Medio"

                    stroke="#48bb78"

                    strokeWidth={2}

                    strokeDasharray="5 5"

                  />

                </LineChart>

              )}

            </ResponsiveContainer>

          </div>

          {/* Transaction History */}

          <div className="transaction-history">

            <h3>Historico de Transacoes</h3>

            <div className="transaction-list">

              {transactions.length === 0 ? (

                <p className="empty-message">Nenhuma transacao registrada</p>

              ) : (

                transactions.map((tx) => (

                  <div key={tx._id} className="transaction-item">

                    <div className="transaction-icon">

                      {getTransactionIcon(tx.type)}

                    </div>

                    <div className="transaction-details">

                      <div className="transaction-main">

                        <strong>{getTransactionLabel(tx.type)}</strong>

                        <span className="transaction-date">

                          {formatDate(tx.date)}

                        </span>

                      </div>

                      <div className="transaction-info">

                        {tx.quantity}  {formatCurrency(tx.price)} ={' '}

                        {formatCurrency(tx.totalAmount)}

                        {tx.fees > 0 && (

                          <span className="transaction-fees">

                            {' '}

                            + {formatCurrency(tx.fees)} (taxas)

                          </span>

                        )}

                      </div>

                      {tx.notes && (

                        <div className="transaction-notes">{tx.notes}</div>

                      )}

                    </div>

                  </div>

                ))

              )}

            </div>

          </div>

        </div>

      </div>

    </div>

  );

};

export default AssetPerformanceChart;


