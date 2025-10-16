const Joi = require('joi');

// Validation schemas
const schemas = {
  // User registration validation
  register: Joi.object({
    name: Joi.string().min(2).max(50).required().trim(),
    email: Joi.string().email().required().lowercase().trim(),
    password: Joi.string()
      .min(8)
      .max(100)
      .required()
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'))
      .messages({
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number and one special character'
      })
  }),

  // User login validation
  login: Joi.object({
    email: Joi.string().email().required().lowercase().trim(),
    password: Joi.string().required()
  }),

  // Transaction validation
  transaction: Joi.object({
    description: Joi.string().min(1).max(200).required().trim(),
    amount: Joi.number().positive().precision(2).required(),
    date: Joi.date().max('now').required(),
    category: Joi.string().valid(
      'Alimentação', 'Transporte', 'Saúde', 'Educação',
      'Lazer', 'Moradia', 'Vestuário', 'Outros', 'Salário',
      'Investimentos', 'Freelance'
    ).required(),
    type: Joi.string().valid('expense', 'income').required()
  }),

  // Budget validation
  budget: Joi.object({
    category: Joi.string().required().trim(),
    limit: Joi.number().positive().precision(2).required(),
    warningThreshold: Joi.number().min(1).max(100).default(80),
    alertEnabled: Joi.boolean().default(true),
    period: Joi.string().valid('monthly', 'weekly', 'yearly').default('monthly')
  }),

  // Investor profile validation
  investorProfile: Joi.object({
    riskProfile: Joi.string().valid('conservative', 'moderate', 'aggressive').required(),
    age: Joi.number().integer().min(18).max(100).required(),
    monthlyIncome: Joi.number().positive().required(),
    savingsRate: Joi.number().min(0).max(100).required(),
    investmentExperience: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
    hasEmergencyFund: Joi.boolean().required(),
    emergencyFundAmount: Joi.number().min(0).default(0),
    preferences: Joi.object({
      lowLiquidity: Joi.boolean().default(false),
      taxBenefits: Joi.boolean().default(true),
      sustainableInvestments: Joi.boolean().default(false)
    }).default({})
  }),

  // Asset validation
  asset: Joi.object({
    symbol: Joi.string().uppercase().min(1).max(20).required().trim(),
    name: Joi.string().min(1).max(100).required().trim(),
    type: Joi.string().valid('stock', 'etf', 'crypto', 'reit', 'fund', 'bond', 'other').required(),
    quantity: Joi.number().positive().required(),
    averagePrice: Joi.number().positive().precision(2).required(),
    currency: Joi.string().length(3).uppercase().default('BRL'),
    notes: Joi.string().max(500).allow('').optional()
  }),

  // Asset transaction validation
  assetTransaction: Joi.object({
    type: Joi.string().valid('buy', 'sell', 'dividend').required(),
    quantity: Joi.number().positive().required(),
    price: Joi.number().positive().precision(2).required(),
    date: Joi.date().max('now').required(),
    description: Joi.string().max(200).allow('').optional(),
    notes: Joi.string().max(500).allow('').optional()
  }),

  // 2FA validation
  twoFactorSetup: Joi.object({
    token: Joi.string().length(6).pattern(/^[0-9]+$/).required()
  }),

  // 2FA verification
  twoFactorVerify: Joi.object({
    email: Joi.string().email().required().lowercase().trim(),
    password: Joi.string().required(),
    token: Joi.string().length(6).pattern(/^[0-9]+$/).required()
  })
};

// Middleware function to validate request body
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schemas[schema].validate(req.body, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true // Remove unknown keys from the object
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

// Custom validators
const validators = {
  // Validate MongoDB ObjectId
  isValidObjectId: (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  },

  // Sanitize string to prevent XSS
  sanitizeString: (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/[<>]/g, '') // Remove < and >
      .trim();
  },

  // Validate file upload
  validateFileUpload: (file, allowedTypes, maxSize) => {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    // Check file type
    if (!allowedTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    // Check file size (maxSize in MB)
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${maxSize}MB`
      };
    }

    return { valid: true };
  }
};

module.exports = {
  validate,
  validators,
  schemas
};
