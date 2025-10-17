const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const axios = require('axios');

// ML API URL
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

// Log ML API URL on startup (hide sensitive parts)
const displayUrl = ML_API_URL.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
console.log(`🤖 ML API configured: ${displayUrl}`);

// @route   POST api/predictions/predict
// @desc    Get expense predictions for user
// @access  Private
router.post('/predict', auth, async (req, res) => {
  try {
    const { category, days_ahead = 30, model_type = 'linear' } = req.body;

    // Call ML API
    const response = await axios.post(`${ML_API_URL}/api/predictions/predict`, {
      user_id: req.user.id,
      category: category || null,
      days_ahead: parseInt(days_ahead),
      model_type: model_type
    });

    res.json(response.data);
  } catch (err) {
    console.error('ML API error:', err.response?.data || err.message);
    if (err.response) {
      return res.status(err.response.status).json({
        msg: err.response.data.detail || 'Error getting predictions'
      });
    }
    res.status(500).json({ msg: 'ML service unavailable' });
  }
});

// @route   GET api/predictions/insights
// @desc    Get spending insights across categories
// @access  Private
router.get('/insights', auth, async (req, res) => {
  try {
    const { days_ahead = 30 } = req.query;

    const response = await axios.get(
      `${ML_API_URL}/api/predictions/insights/${req.user.id}`,
      {
        params: { days_ahead: parseInt(days_ahead) }
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error('ML API error:', err.response?.data || err.message);
    if (err.response) {
      return res.status(err.response.status).json({
        msg: err.response.data.detail || 'Error getting insights'
      });
    }
    res.status(500).json({ msg: 'ML service unavailable' });
  }
});

// @route   GET api/predictions/category/:category
// @desc    Get predictions for specific category
// @access  Private
router.get('/category/:category', auth, async (req, res) => {
  try {
    const { category } = req.params;
    const { days_ahead = 30, model_type = 'linear' } = req.query;

    const response = await axios.get(
      `${ML_API_URL}/api/predictions/category/${req.user.id}/${category}`,
      {
        params: {
          days_ahead: parseInt(days_ahead),
          model_type: model_type
        }
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error('ML API error:', err.response?.data || err.message);
    if (err.response) {
      return res.status(err.response.status).json({
        msg: err.response.data.detail || 'Error getting category predictions'
      });
    }
    res.status(500).json({ msg: 'ML service unavailable' });
  }
});

// @route   GET api/predictions/compare
// @desc    Compare Linear vs LSTM predictions
// @access  Private
router.get('/compare', auth, async (req, res) => {
  try {
    const { days_ahead = 30 } = req.query;

    const response = await axios.get(
      `${ML_API_URL}/api/predictions/compare/${req.user.id}`,
      {
        params: { days_ahead: parseInt(days_ahead) }
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error('ML API error:', err.response?.data || err.message);
    if (err.response) {
      return res.status(err.response.status).json({
        msg: err.response.data.detail || 'Error comparing models'
      });
    }
    res.status(500).json({ msg: 'ML service unavailable' });
  }
});

// @route   GET api/predictions/health
// @desc    Check ML API health
// @access  Public
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${ML_API_URL}/health`, {
      timeout: 5000
    });
    res.json({
      status: 'connected',
      ml_api: response.data
    });
  } catch (err) {
    res.status(503).json({
      status: 'disconnected',
      error: 'ML API is not available'
    });
  }
});

module.exports = router;
