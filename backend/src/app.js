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
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests',
});
app.use('/api/', limiter);

// 9. Stricter rate limiter for auth endpoints (T-01-06, T-01-10)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
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
  errorResponse(res, err.message, statusCode, err.code || 'INTERNAL_ERROR');
});

export default app;
