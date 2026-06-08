import { register as registerUser, login as loginUser, handleGoogleOAuth, generateToken } from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { ValidationError, AuthenticationError } from '../utils/errors.js';
import { findById, updatePasswordHash } from '../repositories/user.repository.js';
import bcrypt from 'bcryptjs';

/**
 * Cookie options for httpOnly JWT cookie (per D-01).
 */
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

/**
 * POST /api/auth/register
 * Register a new user with email, password, and PDP consent.
 */
export async function register(req, res, next) {
  try {
    const { email, password, pdpConsent } = req.body;
    const { user, token } = await registerUser({ email, password, pdpConsent });

    // D-01: Set httpOnly JWT cookie
    res.cookie('token', token, cookieOptions);

    return successResponse(res, { user }, 201);
  } catch (err) {
    if (err instanceof ValidationError) {
      return errorResponse(res, err.message, 400, 'VALIDATION_ERROR');
    }
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Login with email and password.
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { user, token } = await loginUser({ email, password });

    // D-01: Set httpOnly JWT cookie
    res.cookie('token', token, cookieOptions);

    return successResponse(res, { user });
  } catch (err) {
    if (err instanceof AuthenticationError) {
      return errorResponse(res, err.message, 401, 'AUTHENTICATION_ERROR');
    }
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * Clear the session cookie.
 */
export async function logout(req, res) {
  res.clearCookie('token', cookieOptions);
  return successResponse(res, { message: 'Logged out successfully' });
}

/**
 * GET /api/auth/me
 * Get current authenticated user (protected route).
 */
export async function getMe(req, res, next) {
  try {
    const user = await findById(req.user.userId);
    if (!user) {
      return errorResponse(res, 'User not found', 404, 'NOT_FOUND');
    }
    return successResponse(res, {
      id: user.id,
      email: user.email,
      pdp_consent: user.pdp_consent === true,
      created_at: user.created_at,
      has_password: user.has_password === true,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/set-password
 * Setup password for a password-less/OAuth account.
 */
export async function setPassword(req, res, next) {
  try {
    const { password, pdpConsent } = req.body;
    if (!password || password.length < 8) {
      return errorResponse(res, 'Password must be at least 8 characters long', 400, 'VALIDATION_ERROR');
    }
    if (pdpConsent !== true) {
      return errorResponse(res, 'PDP consent is required', 400, 'VALIDATION_ERROR');
    }
    const userId = req.user.userId;

    const hashedPassword = await bcrypt.hash(password, 10);
    await updatePasswordHash(userId, hashedPassword);

    return successResponse(res, { message: 'Password set successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/google/callback
 * Handle Google OAuth callback — set JWT cookie and redirect to frontend.
 */
export async function googleCallback(req, res, next) {
  try {
    // req.user is set by Passport after successful OAuth
    const token = generateToken(req.user);

    // D-01: Set httpOnly JWT cookie
    res.cookie('token', token, cookieOptions);

    // Redirect to frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(frontendUrl);
  } catch (err) {
    next(err);
  }
}


