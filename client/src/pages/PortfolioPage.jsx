import React, { useState, useEffect } from 'react';
import AddAssetModal from '../components/AddAssetModal';
import AddTransactionModal from '../components/AddTransactionModal';
import AssetPerformanceChart from '../components/AssetPerformanceChart';
import Toast from '../components/Toast';
import api from '../services/api';
import './PortfolioPage.css';
const PortfolioPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [toast, setToast] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    fetchPortfolioSummary();
  }, []);
  const fetchPortfolioSummary = async () => {
    try {
      const response = await api.get('/portfolio/summary');
      setSummary(response.data);
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      showToast('Erro ao carregar carteira', 'error');
    } finally {
      setLoading(false);
    }
  };
  const refreshPrices = async () => {
    setRefreshing(true);
    try {
      await api.put('/portfolio/refresh', {});
      await fetchPortfolioSummary();
      showToast('Precos atualizados!', 'success');
    } catch (err) {
      console.error('Error refreshing prices:', err);
      showToast('Erro ao atualizar precos', 'error');
    } finally {
      setRefreshing(false);
    }
  };
  const handleAddAsset = async (assetData) => {
    try {
      await api.post('/portfolio/assets', assetData);
      showToast('Ativo adicionado com sucesso!', 'success');
      setShowAddAssetModal(false);
      await fetchPortfolioSummary();
    } catch (err) {
      console.error('Error adding asset:', err);
      showToast('Erro ao adicionar ativo', 'error');
    }
  };
  const handleAddTransaction = async (transactionData) => {
    try {
      await api.post(
        `/portfolio/assets/${selectedAsset._id}/transactions`,
        transactionData
      );
      showToast('Transacao adicionada com sucesso!', 'success');
      setShowTransactionModal(false);
      setSelectedAsset(null);
      await fetchPortfolioSummary();
    } catch (err) {
      console.error('Error adding transaction:', err);
      showToast('Erro ao adicionar transacao', 'error');
    }
  };
  const handleDeleteAsset = async (assetId) => {
    if (!window.confirm('Tem certeza que deseja remover este ativo?')) {
      return;
    }
    try {
      await api.delete(`/portfolio/assets/${assetId}`);
      showToast('Ativo removido com sucesso!', 'success');
      await fetchPortfolioSummary();
    } catch (err) {
      console.error('Error deleting asset:', err);
      showToast('Erro ao remover ativo', 'error');
    }
  };
  const showToast = (message, type) => {
    setToast({ message, type });
  };
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };
  const formatPercent = (value) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };
  const getAssetTypeLabel = (type) => {
    const labels = {
      stock: 'Acao',
      etf: 'ETF',
      crypto: 'Cripto',
      reit: 'FII',
      fund: 'Fundo',
      bond: 'Renda Fixa',
      other: 'Outro'
    };
    return labels[type] || type;
  };
  if (loading) {
    return (
      <div className="portfolio-page">
        <div className="loading">Carregando carteira...</div>
      </div>
    );
  }
  if (!summary) {
    return (
      <div className="portfolio-page">
        <div className="error">Erro ao carregar carteira</div>
      </div>
    );
  }
  const { portfolio, assets, summary: stats } = summary;
  return (
    <div className="portfolio-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="portfolio-header">
        <div>
          <h1> Minha Carteira</h1>
          <p className="subtitle">
            Ultima atualizacao: {new Date(portfolio.lastUpdated).toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={refreshPrices}
            disabled={refreshing}
          >
            {refreshing ? 'Atualizando...' : 'Atualizar Precos'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddAssetModal(true)}
          >
            Adicionar Ativo
          </button>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-label">Valor Investido</div>
          <div className="card-value">{formatCurrency(stats.totalInvested)}</div>
        </div>
        <div className="summary-card">
          <div className="card-label">Valor Atual</div>
          <div className="card-value">{formatCurrency(stats.currentValue)}</div>
        </div>
        <div className={`summary-card ${stats.totalReturn >= 0 ? 'positive' : 'negative'}`}>
          <div className="card-label">Retorno Total</div>
          <div className="card-value">
            {formatCurrency(stats.totalReturn)}
          </div>
          <div className="card-subtitle">
            {formatPercent(stats.totalReturnPercent)}
          </div>
        </div>
        <div className={`summary-card ${stats.dayChange >= 0 ? 'positive' : 'negative'}`}>
          <div className="card-label">Variacao do Dia</div>
          <div className="card-value">
            {formatCurrency(stats.dayChange)}
          </div>
          <div className="card-subtitle">
            {formatPercent(stats.dayChangePercent)}
          </div>
        </div>
      </div>
      {/* Assets Table */}
      <div className="assets-section">
        <h2>Ativos ({stats.totalAssets})</h2>
        {assets.length === 0 ? (
          <div className="empty-state">
            <p>Voce ainda nao possui ativos na carteira.</p>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddAssetModal(true)}
            >
              Adicionar Primeiro Ativo
            </button>
          </div>
        ) : (
          <div className="assets-table-container">
            <table className="assets-table">
              <thead>
                <tr>
                  <th>Ativo</th>
                  <th>Tipo</th>
                  <th>Quantidade</th>
                  <th>Preco Medio</th>
                  <th>Preco Atual</th>
                  <th>Valor Investido</th>
                  <th>Valor Atual</th>
                  <th>Retorno</th>
                  <th>Alocacao</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset._id} className="asset-row">
                    <td>
                      <div className="asset-info">
                        <strong>{asset.symbol}</strong>
                        <span className="asset-name">{asset.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="asset-type-badge">
                        {getAssetTypeLabel(asset.type)}
                      </span>
                    </td>
                    <td>{asset.quantity}</td>
                    <td>{formatCurrency(asset.averagePrice)}</td>
                    <td>
                      {asset.currentPrice > 0
                        ? formatCurrency(asset.currentPrice)
                        : '--'}
                    </td>
                    <td>{formatCurrency(asset.totalInvested)}</td>
                    <td>{formatCurrency(asset.currentValue)}</td>
                    <td className={asset.totalReturn >= 0 ? 'positive' : 'negative'}>
                      <div>{formatCurrency(asset.totalReturn)}</div>
                      <div className="small-text">
                        {formatPercent(asset.totalReturnPercent)}
                      </div>
                    </td>
                    <td>
                      <div className="allocation-cell">
                        <span>{asset.allocationPercent.toFixed(1)}%</span>
                        <div className="allocation-bar">
                          <div
                            className="allocation-fill"
                            style={{ width: `${asset.allocationPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="asset-actions">
                        <button
                          className="btn-icon"
                          title="Ver Performance"
                          onClick={() => {
                            setSelectedAsset(asset);
                            setShowPerformanceModal(true);
                          }}
                        >
                          Ver
                        </button>
                        <button
                          className="btn-icon"
                          title="Adicionar Transacao"
                          onClick={() => {
                            setSelectedAsset(asset);
                            setShowTransactionModal(true);
                          }}
                        >
                          Transacao
                        </button>
                        <button
                          className="btn-icon btn-icon-danger"
                          title="Remover"
                          onClick={() => handleDeleteAsset(asset._id)}
                        >
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Modals */}
      {showAddAssetModal && (
        <AddAssetModal
          onClose={() => setShowAddAssetModal(false)}
          onSubmit={handleAddAsset}
        />
      )}
      {showTransactionModal && selectedAsset && (
        <AddTransactionModal
          asset={selectedAsset}
          onClose={() => {
            setShowTransactionModal(false);
            setSelectedAsset(null);
          }}
          onSubmit={handleAddTransaction}
        />
      )}
      {showPerformanceModal && selectedAsset && (
        <AssetPerformanceChart
          assetId={selectedAsset._id}
          assetSymbol={selectedAsset.symbol}
          onClose={() => {
            setShowPerformanceModal(false);
            setSelectedAsset(null);
          }}
        />
      )}
    </div>
  );
};
export default PortfolioPage;

