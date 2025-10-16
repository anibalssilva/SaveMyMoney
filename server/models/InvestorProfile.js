const mongoose = require('mongoose');

const InvestorProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    unique: true,
  },
  // Perfil de risco
  riskProfile: {
    type: String,
    enum: ['conservative', 'moderate', 'aggressive'],
    default: 'moderate',
  },
  // Idade (influencia no perfil)
  age: {
    type: Number,
    min: 18,
    max: 100,
  },
  // Renda mensal
  monthlyIncome: {
    type: Number,
    default: 0,
  },
  // Percentual que pode poupar mensalmente
  savingsRate: {
    type: Number,
    default: 10, // 10% da renda
    min: 0,
    max: 100,
  },
  // Objetivos financeiros
  goals: [{
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['emergency', 'short-term', 'medium-term', 'long-term', 'retirement'],
      required: true,
    },
    targetAmount: {
      type: Number,
      required: true,
    },
    currentAmount: {
      type: Number,
      default: 0,
    },
    deadline: {
      type: Date,
    },
    priority: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },
  }],
  // Experiência com investimentos
  investmentExperience: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  // Já possui reserva de emergência?
  hasEmergencyFund: {
    type: Boolean,
    default: false,
  },
  emergencyFundAmount: {
    type: Number,
    default: 0,
  },
  // Preferências
  preferences: {
    lowLiquidity: Boolean,
    taxBenefits: Boolean,
    sustainableInvestments: Boolean,
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

// Update timestamp before saving
InvestorProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('InvestorProfile', InvestorProfileSchema);
