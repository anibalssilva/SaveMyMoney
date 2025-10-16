const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

function initSentry(app) {
  // Only initialize Sentry in production or if DSN is provided
  if (!process.env.SENTRY_DSN) {
    console.log('Sentry DSN not found, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    // We recommend adjusting this value in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Set profilesSampleRate to 1.0 to profile every transaction
    // We recommend adjusting this value in production
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app }),
      // Enable profiling
      new ProfilingIntegration(),
    ],

    // Ignore certain errors
    ignoreErrors: [
      'NavigationDuplicated',
      'Non-Error promise rejection captured',
      /^No error$/,
    ],

    // Scrub sensitive data
    beforeSend(event, hint) {
      // Don't send events with certain messages
      if (event.message && event.message.includes('password')) {
        return null;
      }

      // Scrub sensitive data from request
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers.Authorization;
          delete event.request.headers.authorization;
        }
      }

      return event;
    },
  });

  console.log('Sentry initialized successfully');
}

function getSentryMiddleware() {
  if (!process.env.SENTRY_DSN) {
    return {
      requestHandler: (req, res, next) => next(),
      tracingHandler: (req, res, next) => next(),
      errorHandler: (err, req, res, next) => next(err),
    };
  }

  return {
    requestHandler: Sentry.Handlers.requestHandler(),
    tracingHandler: Sentry.Handlers.tracingHandler(),
    errorHandler: Sentry.Handlers.errorHandler(),
  };
}

module.exports = {
  initSentry,
  getSentryMiddleware,
  Sentry,
};
