const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');
require('dotenv').config();

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post(
  '/register',
  [
    check('name', 'Nome é obrigatório').trim().not().isEmpty().isLength({ min: 2, max: 50 }),
    check('email', 'Por favor, insira um email válido').isEmail().normalizeEmail(),
    check('password', 'A senha deve ter no mínimo 6 caracteres').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;

    try {
      // Check if user already exists
      let user = await User.findOne({ email: email.toLowerCase() });

      if (user) {
        return res.status(400).json({
          error: 'Este email já está cadastrado. Por favor, faça login ou use outro email.',
          field: 'email'
        });
      }

      // Validate password strength
      if (password.length < 6) {
        return res.status(400).json({
          error: 'A senha deve ter no mínimo 6 caracteres',
          field: 'password'
        });
      }

      // Create new user
      user = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
      });

      // Hash password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // Save user
      await user.save();

      // Create JWT payload
      const payload = {
        user: {
          id: user.id,
        },
      };

      // Sign JWT and return
      jwt.sign(
        payload,
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '100h' },
        (err, token) => {
          if (err) {
            console.error('JWT Error:', err);
            return res.status(500).json({ error: 'Erro ao gerar token de autenticação' });
          }

          res.json({
            token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email
            },
            message: 'Cadastro realizado com sucesso!'
          });
        }
      );
    } catch (err) {
      console.error('Register Error:', err.message);

      // Handle duplicate key error
      if (err.code === 11000) {
        return res.status(400).json({
          error: 'Este email já está cadastrado',
          field: 'email'
        });
      }

      res.status(500).json({
        error: 'Erro no servidor. Por favor, tente novamente mais tarde.'
      });
    }
  }
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Por favor, insira um email válido').isEmail().normalizeEmail(),
    check('password', 'Senha é obrigatória').exists().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    try {
      // Find user by email (case-insensitive)
      let user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return res.status(400).json({
          error: 'Email ou senha incorretos',
          field: 'email'
        });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        // Increment failed login attempts (future feature)
        return res.status(400).json({
          error: 'Email ou senha incorretos',
          field: 'password'
        });
      }

      // Update last login
      user.lastLogin = new Date();
      user.failedLoginAttempts = 0;
      await user.save();

      // Create JWT payload
      const payload = {
        user: {
          id: user.id,
        },
      };

      // Sign JWT and return
      jwt.sign(
        payload,
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '100h' },
        (err, token) => {
          if (err) {
            console.error('JWT Error:', err);
            return res.status(500).json({ error: 'Erro ao gerar token de autenticação' });
          }

          res.json({
            token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              twoFactorEnabled: user.twoFactorEnabled || false
            },
            message: 'Login realizado com sucesso!'
          });
        }
      );
    } catch (err) {
      console.error('Login Error:', err.message);
      res.status(500).json({
        error: 'Erro no servidor. Por favor, tente novamente mais tarde.'
      });
    }
  }
);

module.exports = router;
