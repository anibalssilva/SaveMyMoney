const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  description: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  category: {
    type: String,
    required: true,
  },
  // Optional subcategory fields (for expense breakdowns)
  subcategoryId: {
    type: String,
    default: undefined,
  },
  subcategory: {
    type: String,
    default: undefined,
  },
  type: {
    type: String,
    enum: ['expense', 'income'],
    required: true,
  },
  notes: {
    type: String,
    default: '',
  },
  paymentMethod: {
    type: String,
    enum: ['pix', 'pix_parcelado', 'credito', 'debito', 'dinheiro', 'boleto', 'cartao_alimentacao', ''],
    default: '',
  },
});

module.exports = mongoose.model('transaction', TransactionSchema);
