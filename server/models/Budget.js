const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  limit: {
    type: Number,
    required: true,
  },
  warningThreshold: {
    type: Number,
    default: 80, // Percentage at which to show warning (80% of limit)
  },
  alertEnabled: {
    type: Boolean,
    default: true,
  },
  period: {
    type: String,
    enum: ['monthly', 'weekly', 'yearly'],
    default: 'monthly',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure that a user has only one budget per category
BudgetSchema.index({ user: 1, category: 1 }, { unique: true });

// Update the updatedAt timestamp before saving
BudgetSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Budget', BudgetSchema);
