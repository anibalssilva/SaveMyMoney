import React, { useState } from 'react';
import './Modal.css';
const AddAssetModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    type: 'stock',
    quantity: '',
    price: '',
    date: new Date().toISOString().split('T')[0],
    fees: '0',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const assetTypes = [
    { value: 'stock', label: 'Acao' },
    { value: 'etf', label: 'ETF' },
    { value: 'crypto', label: 'Criptomoeda' },
    { value: 'reit', label: 'Fundo Imobiliario (FII)' },
    { value: 'fund', label: 'Fundo de Investimento' },
    { value: 'bond', label: 'Renda Fixa' },
    { value: 'other', label: 'Outro' }
  ];
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  const validate = () => {
    const newErrors = {};
    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Simbolo e obrigatorio';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Nome e obrigatorio';
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantidade deve ser maior que zero';
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Preco deve ser maior que zero';
    }
    if (parseFloat(formData.fees) < 0) {
      newErrors.fees = 'Taxas nao podem ser negativas';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    // Convert strings to numbers
    const submitData = {
      ...formData,
      symbol: formData.symbol.toUpperCase().trim(),
      quantity: parseFloat(formData.quantity),
      price: parseFloat(formData.price),
      fees: parseFloat(formData.fees)
    };
    onSubmit(submitData);
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Adicionar Ativo</h2>
          <button className="modal-close" onClick={onClose}>X</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="symbol">Simbolo *</label>
              <input
                type="text"
                id="symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                placeholder="Ex: PETR4, BTC, AAPL"
                className={errors.symbol ? 'error' : ''}
                maxLength={20}
              />
              {errors.symbol && <span className="error-message">{errors.symbol}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="type">Tipo *</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
              >
                {assetTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="name">Nome do Ativo *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Petrobras PN, Bitcoin, Apple Inc."
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quantity">Quantidade *</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="0"
                step="any"
                min="0"
                className={errors.quantity ? 'error' : ''}
              />
              {errors.quantity && <span className="error-message">{errors.quantity}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="price">Preco de Compra (R$) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={errors.price ? 'error' : ''}
              />
              {errors.price && <span className="error-message">{errors.price}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fees">Taxas e Custos (R$)</label>
              <input
                type="number"
                id="fees"
                name="fees"
                value={formData.fees}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={errors.fees ? 'error' : ''}
              />
              {errors.fees && <span className="error-message">{errors.fees}</span>}
              <small className="form-help">Corretagem, emolumentos, etc.</small>
            </div>
            <div className="form-group">
              <label htmlFor="date">Data da Compra</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="notes">Observacoes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Notas sobre esta compra (opcional)"
              rows="3"
            />
          </div>
          <div className="form-summary">
            <div className="summary-item">
              <span>Subtotal:</span>
              <strong>
                R$ {(parseFloat(formData.quantity || 0) * parseFloat(formData.price || 0)).toFixed(2)}
              </strong>
            </div>
            <div className="summary-item">
              <span>Taxas:</span>
              <strong>R$ {parseFloat(formData.fees || 0).toFixed(2)}</strong>
            </div>
            <div className="summary-item total">
              <span>Total Investido:</span>
              <strong>
                R$ {(
                  (parseFloat(formData.quantity || 0) * parseFloat(formData.price || 0)) +
                  parseFloat(formData.fees || 0)
                ).toFixed(2)}
              </strong>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Adicionar Ativo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AddAssetModal;

