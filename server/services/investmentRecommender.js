/**
 * Investment Recommendation Engine
 * Suggests investments based on user profile and financial situation
 */

class InvestmentRecommender {
  constructor() {
    // Investment products database
    this.products = {
      'emergency-fund': {
        name: 'Reserva de Emergência',
        description: 'Fundo para cobrir imprevistos e emergências',
        category: 'reserva',
        expectedReturn: 10.5, // ~100% CDI
        riskLevel: 1,
        liquidity: 'immediate',
        minimumInvestment: 0,
        pros: [
          'Liquidez imediata',
          'Baixíssimo risco',
          'Proteção do FGC até R$ 250.000',
        ],
        cons: [
          'Rentabilidade mais baixa',
        ],
        additionalInfo: {
          taxable: false,
          covered: true,
          indexer: 'CDI',
        },
      },
      'tesouro-selic': {
        name: 'Tesouro Selic',
        description: 'Título público pós-fixado atrelado à taxa Selic',
        category: 'renda-fixa',
        expectedReturn: 11.0,
        riskLevel: 1,
        liquidity: 'daily',
        minimumInvestment: 30,
        pros: [
          'Risco soberano (menor risco do Brasil)',
          'Liquidez diária',
          'Rentabilidade atrelada à Selic',
          'Pode resgatar a qualquer momento',
        ],
        cons: [
          'Incide Imposto de Renda regressivo',
          'Rentabilidade pode cair se Selic diminuir',
        ],
        additionalInfo: {
          taxable: true,
          covered: false,
          indexer: 'Selic',
        },
      },
      'cdb': {
        name: 'CDB',
        description: 'Certificado de Depósito Bancário',
        category: 'renda-fixa',
        expectedReturn: 12.5, // ~110% CDI
        riskLevel: 2,
        liquidity: 'maturity',
        minimumInvestment: 1000,
        pros: [
          'Rentabilidade superior à poupança',
          'Proteção do FGC até R$ 250.000',
          'Diversas opções de prazo',
        ],
        cons: [
          'Incide Imposto de Renda',
          'Baixa liquidez (vencimento)',
          'Risco de crédito do banco',
        ],
        additionalInfo: {
          taxable: true,
          covered: true,
          indexer: 'CDI',
        },
      },
      'tesouro-ipca': {
        name: 'Tesouro IPCA+',
        description: 'Título público atrelado à inflação + taxa fixa',
        category: 'renda-fixa',
        expectedReturn: 13.5, // IPCA + 6%
        riskLevel: 2,
        liquidity: 'daily',
        minimumInvestment: 30,
        pros: [
          'Proteção contra inflação',
          'Ganho real garantido',
          'Risco soberano',
          'Ideal para longo prazo',
        ],
        cons: [
          'Marcação a mercado (pode ter perda no curto prazo)',
          'Incide Imposto de Renda',
        ],
        additionalInfo: {
          taxable: true,
          covered: false,
          indexer: 'IPCA',
        },
      },
      'lci-lca': {
        name: 'LCI/LCA',
        description: 'Letras de Crédito Imobiliário/Agronegócio',
        category: 'renda-fixa',
        expectedReturn: 10.8,
        riskLevel: 2,
        liquidity: 'maturity',
        minimumInvestment: 5000,
        pros: [
          'Isenção de Imposto de Renda',
          'Proteção do FGC',
          'Rentabilidade líquida atrativa',
        ],
        cons: [
          'Alto investimento mínimo',
          'Baixa liquidez',
          'Carência para resgate',
        ],
        additionalInfo: {
          taxable: false,
          covered: true,
          indexer: 'CDI',
        },
      },
      'fundo-renda-fixa': {
        name: 'Fundo de Renda Fixa',
        description: 'Fundo que investe em títulos de renda fixa',
        category: 'fundos',
        expectedReturn: 11.5,
        riskLevel: 2,
        liquidity: 'daily',
        minimumInvestment: 100,
        pros: [
          'Gestão profissional',
          'Diversificação automática',
          'Liquidez diária',
        ],
        cons: [
          'Taxa de administração',
          'Incide Imposto de Renda',
          'Come-cotas semestral',
        ],
        additionalInfo: {
          taxable: true,
          covered: false,
          indexer: 'CDI',
        },
      },
      'fundo-multimercado': {
        name: 'Fundo Multimercado',
        description: 'Fundo que pode investir em diversas classes de ativos',
        category: 'fundos',
        expectedReturn: 14.0,
        riskLevel: 3,
        liquidity: 'monthly',
        minimumInvestment: 500,
        pros: [
          'Potencial de rentabilidade superior',
          'Gestão ativa profissional',
          'Diversificação entre ativos',
        ],
        cons: [
          'Taxa de administração e performance',
          'Risco moderado a alto',
          'Pode ter perdas',
        ],
        additionalInfo: {
          taxable: true,
          covered: false,
          indexer: 'Variável',
        },
      },
    };
  }

  /**
   * Generate investment suggestions based on user profile and financial situation
   */
  generateSuggestions(profile, financialHealth) {
    const suggestions = [];

    // 1. ALWAYS suggest emergency fund first if not complete
    if (!profile.hasEmergencyFund || profile.emergencyFundAmount < this.calculateEmergencyFundTarget(profile, financialHealth)) {
      suggestions.push(this.suggestEmergencyFund(profile, financialHealth));
    }

    // 2. Calculate available amount for investments
    const availableForInvestment = financialHealth.savingsCapacity;

    if (availableForInvestment > 0) {
      // 3. Suggest based on risk profile and goals
      const riskBasedSuggestions = this.getSuggestionsByRiskProfile(
        profile,
        financialHealth,
        availableForInvestment
      );

      suggestions.push(...riskBasedSuggestions);

      // 4. Goal-based suggestions
      if (profile.goals && profile.goals.length > 0) {
        const goalSuggestions = this.getSuggestionsByGoals(
          profile,
          financialHealth,
          availableForInvestment
        );
        suggestions.push(...goalSuggestions);
      }
    }

    // Sort by priority and match score
    suggestions.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return b.matchScore - a.matchScore;
    });

    return suggestions.slice(0, 6); // Return top 6 suggestions
  }

  /**
   * Suggest emergency fund
   */
  suggestEmergencyFund(profile, financialHealth) {
    const target = this.calculateEmergencyFundTarget(profile, financialHealth);
    const current = profile.emergencyFundAmount || 0;
    const needed = Math.max(0, target - current);

    const product = this.products['emergency-fund'];

    return {
      productType: 'emergency-fund',
      productName: product.name,
      description: product.description,
      category: product.category,
      expectedReturn: product.expectedReturn,
      riskLevel: product.riskLevel,
      liquidity: product.liquidity,
      minimumInvestment: product.minimumInvestment,
      suggestedAmount: Math.min(needed, financialHealth.savingsCapacity),
      recommendedTerm: 12,
      matchScore: 100,
      priority: 5,
      reason: `Prioridade máxima! Você precisa de R$ ${target.toFixed(2)} de reserva de emergência. Faltam R$ ${needed.toFixed(2)}.`,
      pros: product.pros,
      cons: product.cons,
      relatedGoal: 'Segurança Financeira',
      additionalInfo: product.additionalInfo,
    };
  }

  /**
   * Get suggestions by risk profile
   */
  getSuggestionsByRiskProfile(profile, financialHealth, availableAmount) {
    const suggestions = [];
    const riskProfile = profile.riskProfile || 'moderate';

    // Conservative: Focus on safety
    if (riskProfile === 'conservative') {
      suggestions.push(
        this.createSuggestion('tesouro-selic', availableAmount * 0.6, profile, 85),
        this.createSuggestion('cdb', availableAmount * 0.3, profile, 80)
      );
    }

    // Moderate: Balance between safety and returns
    else if (riskProfile === 'moderate') {
      if (availableAmount >= 1000) {
        suggestions.push(
          this.createSuggestion('cdb', availableAmount * 0.4, profile, 90),
          this.createSuggestion('tesouro-ipca', availableAmount * 0.3, profile, 85),
          this.createSuggestion('tesouro-selic', availableAmount * 0.2, profile, 75)
        );
      } else {
        suggestions.push(
          this.createSuggestion('tesouro-selic', availableAmount * 0.5, profile, 90),
          this.createSuggestion('tesouro-ipca', availableAmount * 0.4, profile, 85)
        );
      }
    }

    // Aggressive: Higher returns, higher risk
    else if (riskProfile === 'aggressive') {
      if (availableAmount >= 5000) {
        suggestions.push(
          this.createSuggestion('lci-lca', availableAmount * 0.3, profile, 85),
          this.createSuggestion('fundo-multimercado', availableAmount * 0.3, profile, 80),
          this.createSuggestion('tesouro-ipca', availableAmount * 0.2, profile, 75)
        );
      } else if (availableAmount >= 500) {
        suggestions.push(
          this.createSuggestion('fundo-multimercado', availableAmount * 0.5, profile, 85),
          this.createSuggestion('tesouro-ipca', availableAmount * 0.3, profile, 80)
        );
      } else {
        suggestions.push(
          this.createSuggestion('tesouro-ipca', availableAmount * 0.6, profile, 85),
          this.createSuggestion('fundo-renda-fixa', availableAmount * 0.3, profile, 75)
        );
      }
    }

    return suggestions.filter(s => s.suggestedAmount >= s.minimumInvestment);
  }

  /**
   * Get suggestions based on financial goals
   */
  getSuggestionsByGoals(profile, financialHealth, availableAmount) {
    const suggestions = [];

    profile.goals.forEach(goal => {
      const monthsToGoal = goal.deadline
        ? Math.max(1, Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24 * 30)))
        : 60;

      let productType;
      let matchScore = 70;

      // Short term (< 12 months): High liquidity
      if (monthsToGoal < 12) {
        productType = 'tesouro-selic';
        matchScore = 85;
      }
      // Medium term (1-3 years): Balanced
      else if (monthsToGoal < 36) {
        productType = profile.riskProfile === 'aggressive' ? 'tesouro-ipca' : 'cdb';
        matchScore = 80;
      }
      // Long term (3+ years): Growth focused
      else {
        productType = profile.riskProfile === 'aggressive' ? 'fundo-multimercado' : 'tesouro-ipca';
        matchScore = 85;
      }

      const amountNeeded = goal.targetAmount - (goal.currentAmount || 0);
      const monthlyNeed = amountNeeded / monthsToGoal;

      suggestions.push({
        ...this.createSuggestion(productType, monthlyNeed, profile, matchScore),
        relatedGoal: goal.name,
        recommendedTerm: monthsToGoal,
      });
    });

    return suggestions;
  }

  /**
   * Create a suggestion from product type
   */
  createSuggestion(productType, amount, profile, matchScore) {
    const product = this.products[productType];

    if (!product) return null;

    const priority = this.calculatePriority(productType, profile);

    return {
      productType,
      productName: product.name,
      description: product.description,
      category: product.category,
      expectedReturn: product.expectedReturn,
      riskLevel: product.riskLevel,
      liquidity: product.liquidity,
      minimumInvestment: product.minimumInvestment,
      suggestedAmount: Math.max(product.minimumInvestment, amount),
      recommendedTerm: this.getRecommendedTerm(productType, profile),
      matchScore,
      priority,
      reason: this.generateReason(productType, profile),
      pros: product.pros,
      cons: product.cons,
      additionalInfo: product.additionalInfo,
    };
  }

  /**
   * Calculate emergency fund target
   */
  calculateEmergencyFundTarget(profile, financialHealth) {
    const months = profile.riskProfile === 'conservative' ? 12 : profile.riskProfile === 'aggressive' ? 4 : 6;
    return financialHealth.monthlyExpenses * months;
  }

  /**
   * Calculate priority for product type
   */
  calculatePriority(productType, profile) {
    if (productType === 'emergency-fund') return 5;
    if (productType === 'tesouro-selic') return 4;
    if (productType === 'cdb' || productType === 'lci-lca') return 3;
    if (productType === 'tesouro-ipca') return 3;
    return 2;
  }

  /**
   * Get recommended term for product
   */
  getRecommendedTerm(productType, profile) {
    const terms = {
      'emergency-fund': 0,
      'tesouro-selic': 6,
      'cdb': 24,
      'tesouro-ipca': 60,
      'lci-lca': 24,
      'fundo-renda-fixa': 12,
      'fundo-multimercado': 24,
    };
    return terms[productType] || 12;
  }

  /**
   * Generate reason for suggestion
   */
  generateReason(productType, profile) {
    const reasons = {
      'emergency-fund': 'Essencial para sua segurança financeira em caso de imprevistos.',
      'tesouro-selic': 'Ideal para sua reserva de emergência com liquidez diária e baixo risco.',
      'cdb': `Adequado ao seu perfil ${this.getRiskProfileText(profile.riskProfile)} com boa rentabilidade e segurança do FGC.`,
      'tesouro-ipca': 'Protege seu poder de compra contra inflação, ideal para objetivos de longo prazo.',
      'lci-lca': 'Isento de IR, oferece rentabilidade líquida atrativa para seu perfil.',
      'fundo-renda-fixa': 'Gestão profissional com liquidez diária e diversificação automática.',
      'fundo-multimercado': 'Potencial de retornos superiores com gestão ativa profissional.',
    };
    return reasons[productType] || 'Recomendado para seu perfil de investidor.';
  }

  /**
   * Get risk profile text
   */
  getRiskProfileText(riskProfile) {
    const texts = {
      conservative: 'conservador',
      moderate: 'moderado',
      aggressive: 'arrojado',
    };
    return texts[riskProfile] || 'moderado';
  }
}

module.exports = new InvestmentRecommender();
