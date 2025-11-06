import React, { useState } from 'react';
import DateInput from './DateInput';
import './Modal.css';

const AddTransactionModal = ({ asset, onClose, onSubmit }) => {

  const [formData, setFormData] = useState({

    type: 'buy',

    quantity: '',

    price: '',

    date: new Date().toISOString().split('T')[0],

    fees: '0',

    notes: ''

  });

  const [errors, setErrors] = useState({});

  const transactionTypes = [
  { value: 'buy', label: 'Compra' },
  { value: 'sell', label: 'Venda' },
  { value: 'dividend', label: 'Dividendo' },
  { value: 'split', label: 'Desdobramento' },
  { value: 'fee', label: 'Taxa' }
];

  const handleChange = (e) => {

    const { name, value } = e.target;

    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {

      setErrors(prev => ({ ...prev, [name]: null }));

    }

  };

  const validate = () => {

    const newErrors = {};

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {

      newErrors.quantity = 'Quantidade deve ser maior que zero';

    }

    // Check if user is selling more than they own

    if (formData.type === 'sell' && parseFloat(formData.quantity) > asset.quantity) {

      newErrors.quantity = `Voce possui apenas ${asset.quantity} unidades`;

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

    const submitData = {

      ...formData,

      quantity: parseFloat(formData.quantity),

      price: parseFloat(formData.price),

      fees: parseFloat(formData.fees)

    };

    onSubmit(submitData);

  };

  const calculateTotal = () => {

    const quantity = parseFloat(formData.quantity) || 0;

    const price = parseFloat(formData.price) || 0;

    const fees = parseFloat(formData.fees) || 0;

    const subtotal = quantity * price;

    if (formData.type === 'buy') {

      return subtotal + fees;

    } else if (formData.type === 'sell') {

      return subtotal - fees;

    } else {

      return subtotal;

    }

  };

  return (

    <div className="modal-overlay" onClick={onClose}>

      <div className="modal-content" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">

          <div>

            <h2>Nova Transacao</h2>

            <p className="modal-subtitle">{asset.symbol} - {asset.name}</p>

          </div>

          <button className="modal-close" onClick={onClose}>X</button>

        </div>

        <form onSubmit={handleSubmit} className="modal-form">

          {/* Current Holdings Info */}

          <div className="info-box">

            <div className="info-item">

              <span>Quantidade Atual:</span>

              <strong>{asset.quantity}</strong>

            </div>

            <div className="info-item">

              <span>Preco Medio:</span>

              <strong>R$ {asset.averagePrice.toFixed(2)}</strong>

            </div>

            {asset.currentPrice > 0 && (

              <div className="info-item">

                <span>Preco Atual:</span>

                <strong>R$ {asset.currentPrice.toFixed(2)}</strong>

              </div>

            )}

          </div>

          <div className="form-group">

            <label htmlFor="type">Tipo de Transacao *</label>

            <select

              id="type"

              name="type"

              value={formData.type}

              onChange={handleChange}

              className="type-select"

            >

              {transactionTypes.map(type => (

                <option key={type.value} value={type.value}>

                  {type.label}

                </option>

              ))}

            </select>

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

              <label htmlFor="price">Preco (R$) *</label>

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

              <label htmlFor="fees">Taxas (R$)</label>

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

            </div>

            <div className="form-group">

              <label htmlFor="date">Data *</label>

              <DateInput

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

              placeholder="Notas sobre esta transacao (opcional)"

              rows="3"

            />

          </div>

          <div className="form-summary">

            <div className="summary-item">

              <span>Subtotal:</span>

              <strong>

                R$ {((parseFloat(formData.quantity) || 0) * (parseFloat(formData.price) || 0)).toFixed(2)}

              </strong>

            </div>

            <div className="summary-item">

              <span>Taxas:</span>

              <strong>R$ {parseFloat(formData.fees || 0).toFixed(2)}</strong>

            </div>

            <div className={`summary-item total ${formData.type === 'buy' ? 'negative' : 'positive'}`}>

              <span>Total {formData.type === 'buy' ? 'a Pagar' : 'a Receber'}:</span>

              <strong>R$ {calculateTotal().toFixed(2)}</strong>

            </div>

          </div>

          <div className="modal-actions">

            <button type="button" className="btn btn-secondary" onClick={onClose}>

              Cancelar

            </button>

            <button type="submit" className="btn btn-primary">

              Adicionar Transacao

            </button>

          </div>

        </form>

      </div>

    </div>

  );

};

export default AddTransactionModal;


