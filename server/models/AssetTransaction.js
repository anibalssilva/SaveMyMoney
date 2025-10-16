const mongoose = require('mongoose');

/**
 * AssetTransaction Model
 * Represents buy/sell transactions for portfolio assets
 */
const AssetTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  portfolio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
    required: true
  },
  type: {
    type: String,
    enum: ['buy', 'sell', 'dividend', 'split', 'fee'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  fees: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'BRL'
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for faster queries
AssetTransactionSchema.index({ user: 1, asset: 1, date: -1 });
AssetTransactionSchema.index({ portfolio: 1, date: -1 });

module.exports = mongoose.model('AssetTransaction', AssetTransactionSchema);
