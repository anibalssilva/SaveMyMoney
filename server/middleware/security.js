const helmet = require('helmet');

// Configure Helmet with custom options
const securityMiddleware = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://brapi.dev', 'https://query1.finance.yahoo.com'],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  // Cross Origin Resource Policy
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },
  // Frame Guard (prevent clickjacking)
  frameguard: { action: 'deny' },
  // Hide Powered By header
  hidePoweredBy: true,
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  // IE No Open
  ieNoOpen: true,
  // No Sniff
  noSniff: true,
  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // XSS Filter
  xssFilter: true,
});

module.exports = securityMiddleware;
