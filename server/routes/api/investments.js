const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const InvestorProfile = require('../../models/InvestorProfile');
const InvestmentSuggestion = require('../../models/InvestmentSuggestion');
const financialAnalyzer = require('../../services/financialAnalyzer');
const investmentRecommender = require('../../services/investmentRecommender');

// @route   GET api/investments/profile
// @desc    Get user's investor profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    let profile = await InvestorProfile.findOne({ user: req.user.id });

    if (!profile) {
      // Create default profile
      profile = new InvestorProfile({
        user: req.user.id,
        riskProfile: 'moderate',
        investmentExperience: 'beginner',
      });
      await profile.save();
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/investments/profile
// @desc    Create or update investor profile
// @access  Private
router.post('/profile', auth, async (req, res) => {
  const {
    riskProfile,
    age,
    monthlyIncome,
    savingsRate,
    goals,
    investmentExperience,
    hasEmergencyFund,
    emergencyFundAmount,
    preferences,
  } = req.body;

  try {
    const profileFields = {
      user: req.user.id,
    };

    if (riskProfile) profileFields.riskProfile = riskProfile;
    if (age) profileFields.age = age;
    if (monthlyIncome !== undefined) profileFields.monthlyIncome = monthlyIncome;
    if (savingsRate !== undefined) profileFields.savingsRate = savingsRate;
    if (goals) profileFields.goals = goals;
    if (investmentExperience) profileFields.investmentExperience = investmentExperience;
    if (hasEmergencyFund !== undefined) profileFields.hasEmergencyFund = hasEmergencyFund;
    if (emergencyFundAmount !== undefined) profileFields.emergencyFundAmount = emergencyFundAmount;
    if (preferences) profileFields.preferences = preferences;

    let profile = await InvestorProfile.findOneAndUpdate(
      { user: req.user.id },
      { $set: profileFields },
      { new: true, upsert: true }
    );

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/investments/analysis
// @desc    Get financial analysis
// @access  Private
router.get('/analysis', auth, async (req, res) => {
  try {
    const profile = await InvestorProfile.findOne({ user: req.user.id });
    const financialHealth = await financialAnalyzer.calculateFinancialHealth(req.user.id, profile);
    const categoryAnalysis = await financialAnalyzer.analyzeSpendingByCategory(req.user.id);

    // Calculate emergency fund info
    const emergencyFundInfo = financialAnalyzer.calculateEmergencyFund(
      financialHealth.monthlyExpenses,
      profile?.riskProfile || 'moderate'
    );

    res.json({
      financialHealth,
      categoryAnalysis,
      emergencyFund: {
        ...emergencyFundInfo,
        currentAmount: profile?.emergencyFundAmount || 0,
        hasEmergencyFund: profile?.hasEmergencyFund || false,
        completionPercentage: profile?.emergencyFundAmount
          ? (profile.emergencyFundAmount / emergencyFundInfo.recommendedAmount) * 100
          : 0,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/investments/suggestions
// @desc    Get personalized investment suggestions
// @access  Private
router.get('/suggestions', auth, async (req, res) => {
  try {
    // Get or create profile
    let profile = await InvestorProfile.findOne({ user: req.user.id });

    if (!profile) {
      profile = new InvestorProfile({
        user: req.user.id,
        riskProfile: 'moderate',
        investmentExperience: 'beginner',
      });
      await profile.save();
    }

    // Analyze financial situation
    const financialHealth = await financialAnalyzer.calculateFinancialHealth(req.user.id, profile);

    // Generate suggestions
    const suggestions = investmentRecommender.generateSuggestions(profile, financialHealth);

    // Clear old suggestions
    await InvestmentSuggestion.deleteMany({ user: req.user.id });

    // Save new suggestions
    const savedSuggestions = await InvestmentSuggestion.insertMany(
      suggestions.map(s => ({
        ...s,
        user: req.user.id,
      }))
    );

    res.json({
      suggestions: savedSuggestions,
      profile: {
        riskProfile: profile.riskProfile,
        investmentExperience: profile.investmentExperience,
        hasEmergencyFund: profile.hasEmergencyFund,
      },
      financialSummary: {
        monthlyIncome: financialHealth.monthlyIncome,
        monthlyExpenses: financialHealth.monthlyExpenses,
        savingsCapacity: financialHealth.savingsCapacity,
        healthScore: financialHealth.score,
        healthRating: financialHealth.rating,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/investments/goals
// @desc    Add financial goal
// @access  Private
router.post('/goals', auth, async (req, res) => {
  const { name, type, targetAmount, deadline, priority } = req.body;

  if (!name || !type || !targetAmount) {
    return res.status(400).json({ msg: 'Please provide name, type, and target amount' });
  }

  try {
    const profile = await InvestorProfile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found. Create profile first.' });
    }

    const newGoal = {
      name,
      type,
      targetAmount,
      deadline: deadline ? new Date(deadline) : undefined,
      priority: priority || 1,
      currentAmount: 0,
    };

    profile.goals.push(newGoal);
    await profile.save();

    res.json(profile.goals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/investments/goals/:goalId
// @desc    Update financial goal
// @access  Private
router.put('/goals/:goalId', auth, async (req, res) => {
  try {
    const profile = await InvestorProfile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    const goal = profile.goals.id(req.params.goalId);

    if (!goal) {
      return res.status(404).json({ msg: 'Goal not found' });
    }

    // Update goal fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        goal[key] = req.body[key];
      }
    });

    await profile.save();
    res.json(profile.goals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/investments/goals/:goalId
// @desc    Delete financial goal
// @access  Private
router.delete('/goals/:goalId', auth, async (req, res) => {
  try {
    const profile = await InvestorProfile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    profile.goals = profile.goals.filter(g => g._id.toString() !== req.params.goalId);

    await profile.save();
    res.json(profile.goals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/investments/quiz
// @desc    Get investment profile quiz questions
// @access  Private
router.get('/quiz', auth, async (req, res) => {
  const quiz = {
    title: 'Descubra seu Perfil de Investidor',
    description: 'Responda as perguntas abaixo para receber sugestões personalizadas',
    questions: [
      {
        id: 'age',
        type: 'number',
        question: 'Qual sua idade?',
        min: 18,
        max: 100,
      },
      {
        id: 'monthlyIncome',
        type: 'number',
        question: 'Qual sua renda mensal aproximada? (R$)',
        min: 0,
      },
      {
        id: 'investmentExperience',
        type: 'select',
        question: 'Qual sua experiência com investimentos?',
        options: [
          { value: 'beginner', label: 'Iniciante - Nunca investi' },
          { value: 'intermediate', label: 'Intermediário - Já invisto há algum tempo' },
          { value: 'advanced', label: 'Avançado - Tenho experiência significativa' },
        ],
      },
      {
        id: 'riskTolerance',
        type: 'select',
        question: 'Como você se sente em relação a riscos nos investimentos?',
        options: [
          { value: 'conservative', label: 'Prefiro segurança, mesmo com rentabilidade menor' },
          { value: 'moderate', label: 'Aceito algum risco para obter melhores retornos' },
          { value: 'aggressive', label: 'Aceito riscos maiores em busca de rentabilidade alta' },
        ],
      },
      {
        id: 'hasEmergencyFund',
        type: 'boolean',
        question: 'Você já possui uma reserva de emergência?',
      },
      {
        id: 'emergencyFundAmount',
        type: 'number',
        question: 'Se sim, qual o valor da sua reserva? (R$)',
        conditional: 'hasEmergencyFund',
        min: 0,
      },
      {
        id: 'investmentGoal',
        type: 'select',
        question: 'Qual seu principal objetivo com investimentos?',
        options: [
          { value: 'emergency', label: 'Criar reserva de emergência' },
          { value: 'short-term', label: 'Curto prazo (até 1 ano)' },
          { value: 'medium-term', label: 'Médio prazo (1-5 anos)' },
          { value: 'long-term', label: 'Longo prazo (5+ anos)' },
          { value: 'retirement', label: 'Aposentadoria' },
        ],
      },
    ],
  };

  res.json(quiz);
});

module.exports = router;
