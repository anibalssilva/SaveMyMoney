const mongoose = require('mongoose');

const InvestmentSuggestionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  // Tipo de produto
  productType: {
    type: String,
    enum: ['emergency-fund', 'cdb', 'tesouro-selic', 'tesouro-ipca', 'tesouro-prefixado', 'lci-lca', 'fundo-renda-fixa', 'fundo-multimercado', 'acoes'],
    required: true,
  },
  // Nome do produto
  productName: {
    type: String,
    required: true,
  },
  // Descrição
  description: {
    type: String,
  },
  // Categoria do produto
  category: {
    type: String,
    enum: ['renda-fixa', 'renda-variavel', 'fundos', 'reserva'],
    required: true,
  },
  // Rentabilidade estimada anual (%)
  expectedReturn: {
    type: Number,
    required: true,
  },
  // Risco (1-5)
  riskLevel: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  // Liquidez
  liquidity: {
    type: String,
    enum: ['immediate', 'daily', 'monthly', 'maturity'],
    required: true,
  },
  // Investimento mínimo
  minimumInvestment: {
    type: Number,
    default: 0,
  },
  // Valor sugerido para investir
  suggestedAmount: {
    type: Number,
    required: true,
  },
  // Prazo recomendado (em meses)
  recommendedTerm: {
    type: Number,
  },
  // Score de adequação ao perfil (0-100)
  matchScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  // Motivo da sugestão
  reason: {
    type: String,
    required: true,
  },
  // Prós
  pros: [{
    type: String,
  }],
  // Contras
  cons: [{
    type: String,
  }],
  // Prioridade da sugestão
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 5,
  },
  // Objetivo relacionado
  relatedGoal: {
    type: String,
  },
  // Dados adicionais
  additionalInfo: {
    taxable: Boolean,
    covered: Boolean, // FGC coverage
    indexer: String, // CDI, IPCA, Prefixado
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('InvestmentSuggestion', InvestmentSuggestionSchema);
