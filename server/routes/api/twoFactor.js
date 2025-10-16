const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { validate } = require('../../middleware/validator');
const twoFactorService = require('../../services/twoFactorService');
const User = require('../../models/User');
const bcrypt = require('bcrypt');

// @route   POST api/2fa/setup
// @desc    Setup 2FA for user
// @access  Private
router.post('/setup', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        error: '2FA is already enabled for this account'
      });
    }

    // Generate secret and QR code
    const { secret, otpauthUrl } = twoFactorService.generateSecret(user.email);
    const qrCode = await twoFactorService.generateQRCode(otpauthUrl);

    // Store secret temporarily (will be confirmed when user verifies)
    user.twoFactorSecret = secret;
    await user.save();

    res.json({
      message: 'Scan this QR code with your authenticator app',
      qrCode,
      secret, // Also send secret for manual entry
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: 'Server error during 2FA setup' });
  }
});

// @route   POST api/2fa/verify
// @desc    Verify and enable 2FA
// @access  Private
router.post('/verify', [auth, validate('twoFactorSetup')], async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user.id);

    if (!user.twoFactorSecret) {
      return res.status(400).json({
        error: 'Please setup 2FA first'
      });
    }

    // Verify the token
    const isValid = twoFactorService.verifyToken(user.twoFactorSecret, token);

    if (!isValid) {
      return res.status(400).json({
        error: 'Invalid verification code'
      });
    }

    // Enable 2FA and generate backup codes
    const backupCodes = twoFactorService.generateBackupCodes();
    const hashedBackupCodes = backupCodes.map(code => ({
      code: twoFactorService.hashBackupCode(code),
      used: false
    }));

    user.twoFactorEnabled = true;
    user.backupCodes = hashedBackupCodes;
    await user.save();

    res.json({
      message: '2FA enabled successfully',
      backupCodes, // Show these only once
      warning: 'Save these backup codes in a safe place. You will not be able to see them again.'
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ error: 'Server error during 2FA verification' });
  }
});

// @route   POST api/2fa/disable
// @desc    Disable 2FA
// @access  Private
router.post('/disable', [auth, validate('twoFactorSetup')], async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user.id);

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        error: '2FA is not enabled for this account'
      });
    }

    // Verify the token before disabling
    const isValid = twoFactorService.verifyToken(user.twoFactorSecret, token);

    if (!isValid) {
      return res.status(400).json({
        error: 'Invalid verification code'
      });
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.backupCodes = [];
    await user.save();

    res.json({
      message: '2FA disabled successfully'
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ error: 'Server error during 2FA disable' });
  }
});

// @route   POST api/2fa/backup-code
// @desc    Login using backup code
// @access  Public
router.post('/backup-code', async (req, res) => {
  try {
    const { email, backupCode } = req.body;

    if (!email || !backupCode) {
      return res.status(400).json({
        error: 'Email and backup code are required'
      });
    }

    const user = await User.findOne({ email });

    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({
        error: 'Invalid credentials'
      });
    }

    // Check backup codes
    let codeFound = false;
    for (let i = 0; i < user.backupCodes.length; i++) {
      const backup = user.backupCodes[i];

      if (backup.used) continue;

      const isValid = await twoFactorService.verifyBackupCode(
        backupCode,
        backup.code
      );

      if (isValid) {
        // Mark code as used
        user.backupCodes[i].used = true;
        await user.save();
        codeFound = true;
        break;
      }
    }

    if (!codeFound) {
      return res.status(400).json({
        error: 'Invalid or already used backup code'
      });
    }

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          message: 'Logged in successfully using backup code',
          warning: 'Consider regenerating backup codes soon'
        });
      }
    );
  } catch (error) {
    console.error('Backup code login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET api/2fa/status
// @desc    Check if 2FA is enabled
// @access  Private
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('twoFactorEnabled');
    res.json({
      enabled: user.twoFactorEnabled || false
    });
  } catch (error) {
    console.error('2FA status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
