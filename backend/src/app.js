import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js';
import authRoutes from './routes/auth.routes.js';
import authController from './controllers/auth.controller.js';
import profileRoutes from './routes/profile.routes.js';
import foodRoutes from './routes/food.routes.js';
import activityRoutes from './routes/activity.routes.js';
import weeklyPlanRoutes from './routes/weeklyPlan.routes.js';
import dailyMealPlanRoutes from './routes/dailyMealPlan.routes.js';
import progressRoutes from './routes/progress.routes.js';
import docsRoutes from './routes/docs.routes.js';
import { errorResponse } from './utils/response.js';

const app = express();

// Trust the first proxy to enable accurate IP detection for express-rate-limit
app.set('trust proxy', 1);

// Validate and sanitize FRONTEND_URL for CORS and OAuth redirects (WR-02)
const parseFrontendUrl = () => {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  try {
    const parsed = new URL(FRONTEND_URL);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid FRONTEND_URL protocol');
    }
    return FRONTEND_URL;
  } catch {
    console.error('Invalid FRONTEND_URL:', FRONTEND_URL);
    return 'http://localhost:5173'; // safe fallback
  }
};
const FRONTEND_URL = parseFrontendUrl();

// Rate limiter helper to reduce boilerplate (IN-01)
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 1 * 60 * 1000,
    max = 7,
    message = 'Too many requests',
    testMax = 1000,
    testWindowMs = 1000,
  } = options;
  const isTest = process.env.NODE_ENV === 'test';
  return rateLimit({
    windowMs: isTest ? testWindowMs : windowMs,
    max: isTest ? testMax : max,
    message: { success: false, error: { message, code: 'RATE_LIMITED' } },
    validate: { xForwardedForHeader: false, trustProxy: false, default: true },
  });
};

// Global aggregate rate limiter — counts ALL requests toward one bucket, regardless of IP
const isTestGlobal = process.env.NODE_ENV === 'test';
const globalLimiter = rateLimit({
  windowMs: isTestGlobal ? 1000 : 1 * 60 * 1000,
  max: isTestGlobal ? 3333 : 600,
  keyGenerator: () => 'global',
  validate: { xForwardedForHeader: false, trustProxy: false, default: true },
  message: { success: false, error: { message: 'Global rate limit exceeded. Please try again later.', code: 'RATE_LIMITED' } },
});
app.use(globalLimiter);

// === Middleware (order matters) ===

// 1. Security headers
app.use(helmet());

// 2. CORS with credentials (required for httpOnly cookie sending)
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// 3. Gzip compression
app.use(compression());

// 4. Request logging
app.use(morgan('dev'));

// 5. Body parsing
app.use(express.json());

// 6. Cookie parsing (required for httpOnly JWT cookie reading)
app.use(cookieParser());

// 7. Passport initialization
app.use(passport.initialize());

// 8. General rate limiter for /api/ routes
const limiter = createRateLimiter({ max: 300 });
app.use('/api/', limiter);

// 9. Stricter rate limiter for auth endpoints (T-01-06, T-01-10)
const authLimiter = createRateLimiter({ max: 10, message: 'Too many auth attempts', testMax: 100 });
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Health check — must be before SPA catch-all and 404 handler
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API documentation — no auth or rate limiting required
app.use('/api/docs', docsRoutes);

// === Routes ===

// Auth API routes
app.use('/api/auth', authRoutes);

// Profile API routes — stricter rate limiter for user data endpoints
const profileLimiter = createRateLimiter({ max: 60, message: 'Too many profile requests' });
app.use('/api/profile', profileLimiter);
app.use('/api/profile', profileRoutes);

// Food API routes — higher rate limit for search-as-you-type (T-04-08)
const foodLimiter = createRateLimiter({ max: 60, message: 'Too many food requests' });
app.use('/api/food', foodLimiter);
app.use('/api/food', foodRoutes);

// Activity API routes — rate limiter for ORDER BY RAND() queries (T-05-07)
const activityLimiter = createRateLimiter({ max: 20, message: 'Too many activity requests' });
app.use('/api/activities', activityLimiter);
app.use('/api/activities', activityRoutes);

// Weekly plan routes — rate limited via middleware (D-20)
app.use('/api/weekly-plans', weeklyPlanRoutes);

// Daily meal plan routes (v1.5 per-day generation)
app.use('/api/daily-meal-plans', dailyMealPlanRoutes);

// Activity plan routes

// Progress routes (weight logging, goal tracking)
app.use('/api/progress', progressRoutes);

// Google OAuth routes (must be separate from authRoutes for Passport middleware)
app.get(
  '/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
app.get(
  '/api/auth/google/callback',
  (req, res, next) => {
    const cb = passport.authenticate('google', {
      session: false,
      failureRedirect: FRONTEND_URL + '/login?error=google_auth_failed',
    });
    cb(req, res, (err) => {
      if (err) {
        console.error('Google OAuth callback error:', err.message);
        return res.redirect(`${FRONTEND_URL}/login?error=google_auth_error`);
      }
      next();
    });
  },
  authController.googleCallback
);

// === Static Files & SPA Catch-all (Phase 11: Docker Restructure) ===

// Serve React static build artifacts
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

// SPA catch-all
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(frontendDist, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return next();
  }
  res.sendFile(indexPath);
});

// === Error Handling ===

// 404 handler
app.use((req, res) => {
  errorResponse(res, 'Route not found', 404, 'NOT_FOUND');
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  // Convert camelCase error names to UPPER_SNAKE_CASE (e.g. HTTPServerError → HTTP_SERVER_ERROR)
  const errorCode = (err.code || err.name || 'INTERNAL_ERROR')
    // Insert underscore between lowercase/number and uppercase
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    // Insert underscore between consecutive uppercase and lowercase (e.g., HTTPServer → HTTP_Server)
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toUpperCase();
  errorResponse(res, err.message, statusCode, errorCode);
});

export default app;
