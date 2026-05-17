import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  create as createUser,
  findByEmail,
  findByGoogleId,
} from '../repositories/user.repository.js';
import { ValidationError, AuthenticationError } from '../utils/errors.js';

/**
 * Register a new user with email, password, and PDP consent.
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {boolean} params.pdpConsent
 * @returns {Promise<{user: Object, token: string}>}
 */
export async function register({ email, password, pdpConsent }) {
  // D-02: PDP consent is required
  if (pdpConsent !== true) {
    throw new ValidationError('PDP consent is required');
  }

  // Check if user already exists
  const existingUser = await findByEmail(email);
  if (existingUser) {
    throw new ValidationError('Email already registered');
  }

  // D-05: Hash password with bcrypt, 10 salt rounds
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await createUser({
    email,
    passwordHash: hashedPassword,
    pdpConsent: true,
  });

  // Generate JWT
  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      pdpConsent: user.pdp_consent === 1,
    },
    token,
  };
}

/**
 * Login with email and password.
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<{user: Object, token: string}>}
 */
export async function login({ email, password }) {
  // Find user by email
  const user = await findByEmail(email);
  if (!user) {
    // Same message for both cases to prevent email enumeration (T-01-06)
    throw new AuthenticationError('Invalid email or password');
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Generate JWT
  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      pdpConsent: user.pdp_consent === 1,
    },
    token,
  };
}

/**
 * Handle Google OAuth: find existing user or create new one.
 * OAuth implies PDP consent (D-02).
 * @param {Object} params
 * @param {string} params.googleId
 * @param {string} params.email
 * @param {string} params.displayName
 * @returns {Promise<{user: Object, token: string}>}
 */
export async function handleGoogleOAuth({ googleId, email, displayName }) {
  // Find existing user by Google ID
  let user = await findByGoogleId(googleId);

  if (!user) {
    // Create new user — OAuth implies consent
    user = await createUser({
      email,
      passwordHash: null,
      googleId,
      pdpConsent: true,
    });
  }

  // Generate JWT
  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      pdpConsent: user.pdp_consent === 1,
    },
    token,
  };
}

/**
 * Generate a JWT token for the given user.
 * Uses HS256 algorithm with 7-day expiry (per CONTEXT.md D-01).
 * @param {Object} user
 * @returns {string}
 */
export function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '7d' }
  );
}
