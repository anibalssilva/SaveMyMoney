const mongoose = require('mongoose');

/**
 * Portfolio Model
 * Represents an investment portfolio for a user
 */
const PortfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    default: 'Minha Carteira'
  },
  description: {
    type: String,
    default: ''
  },
  assets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  }],
  totalInvested: {
    type: Number,
    default: 0
  },
  currentValue: {
    type: Number,
    default: 0
  },
  totalReturn: {
    type: Number,
    default: 0
  },
  totalReturnPercent: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
PortfolioSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('Portfolio', PortfolioSchema);
