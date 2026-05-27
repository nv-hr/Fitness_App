import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js';
import authRoutes from './routes/auth.routes.js';
import authController from './controllers/auth.controller.js';
import profileRoutes from './routes/profile.routes.js';
import foodRoutes from './routes/food.routes.js';
import activityRoutes from './routes/activity.routes.js';
import { errorResponse } from './utils/response.js';

const app = express();

// === Middleware (order matters) ===

// 1. Security headers
app.use(helmet());

// 2. CORS with credentials (required for httpOnly cookie sending)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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
const limiterConfig = (process.env.NODE_ENV === 'test')
  ? { windowMs: 1000, max: 1000 }
  : { windowMs: 15 * 60 * 1000, max: 100 };
const limiter = rateLimit({
  ...limiterConfig,
  message: 'Too many requests',
});
app.use('/api/', limiter);

// 9. Stricter rate limiter for auth endpoints (T-01-06, T-01-10)
const authLimiterConfig = (process.env.NODE_ENV === 'test')
  ? { windowMs: 1000, max: 100 }
  : { windowMs: 15 * 60 * 1000, max: 10 };
const authLimiter = rateLimit({
  ...authLimiterConfig,
  message: 'Too many auth attempts',
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// === Routes ===

// Auth API routes
app.use('/api/auth', authRoutes);

// Profile API routes — stricter rate limiter for user data endpoints
const profileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: 'Too many profile requests',
});
app.use('/api/profile', profileLimiter);
app.use('/api/profile', profileRoutes);

// Food API routes — higher rate limit for search-as-you-type (T-04-08)
const foodLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: 'Too many food requests',
});
app.use('/api/food', foodLimiter);
app.use('/api/food', foodRoutes);

// Activity API routes — rate limiter for ORDER BY RAND() queries (T-05-07)
const activityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  message: 'Too many activity requests',
});
app.use('/api/activities', activityLimiter);
app.use('/api/activities', activityRoutes);

// Google OAuth routes (must be separate from authRoutes for Passport middleware)
app.get(
  '/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
app.get(
  '/api/auth/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: (process.env.FRONTEND_URL || 'http://localhost:5173') + '/login',
  }),
  authController.googleCallback
);

// === Error Handling ===

// 404 handler
app.use((req, res) => {
  errorResponse(res, 'Route not found', 404, 'NOT_FOUND');
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  // Convert camelCase error names to UPPER_SNAKE_CASE (e.g. AuthenticationError → AUTHENTICATION_ERROR)
  const errorCode = (err.code || err.name || 'INTERNAL_ERROR')
    .replace(/([A-Z])/g, '_$1')
    .replace(/^_/, '')
    .toUpperCase();
  errorResponse(res, err.message, statusCode, errorCode);
});

export default app;
