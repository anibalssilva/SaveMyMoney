try {
  require('dotenv').config();
  const express = require('express');
  const cors = require('cors');
  const morgan = require('morgan');

  const connectDB = require('./config/db');
  const securityMiddleware = require('./middleware/security');
  const { apiLimiter } = require('./middleware/rateLimiter');
  const logger = require('./config/logger');

  // Connect Database
  connectDB();

  const app = express();
  const port = process.env.PORT || 3001;

  // Trust proxy - Required for Render.com and rate limiting
  // This allows Express to trust the X-Forwarded-For header
  app.set('trust proxy', 1);

  // Security Middleware
  app.use(securityMiddleware);

  // CORS Configuration
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  // Allow all Render.com subdomains in production
  const corsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow all *.onrender.com domains
      if (origin.match(/\.onrender\.com$/)) {
        return callback(null, true);
      }

      // Reject other origins
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200
  };

  app.use(cors(corsOptions));

  // Body Parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging Middleware
  if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined', { stream: logger.stream }));
  } else {
    app.use(morgan('dev'));
  }

  // Rate Limiting
  app.use('/api/', apiLimiter);

  // Define Routes
  app.use('/api/auth', require('./routes/api/auth'));
  app.use('/api/2fa', require('./routes/api/twoFactor'));
  app.use('/api/transactions', require('./routes/api/transactions'));
  app.use('/api/budgets', require('./routes/api/budgets'));
  app.use('/api/predictions', require('./routes/api/predictions'));
  app.use('/api/investments', require('./routes/api/investments'));
  app.use('/api/market', require('./routes/api/market'));
  app.use('/api/portfolio', require('./routes/api/portfolio'));

  // Health Check
  app.get('/api/ping', (req, res) => {
    res.json({ message: 'pong', timestamp: new Date().toISOString() });
  });

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

    res.status(err.status || 500).json({
      error: process.env.NODE_ENV === 'production'
        ? 'An error occurred'
        : err.message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  app.listen(port, () => {
    logger.info(`Server is running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`Server is running on port ${port}`);
  });

} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}