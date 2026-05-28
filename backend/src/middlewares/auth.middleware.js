import jwt from 'jsonwebtoken';
import { AuthenticationError } from '../utils/errors.js';

/**
 * JWT verification middleware.
 * Reads token from httpOnly cookie (per D-01), NOT from Authorization header.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function authenticateToken(req, res, next) {
  try {
    // D-01: Read token from httpOnly cookie
    const token = req.cookies?.token;

    if (!token) {
      throw new AuthenticationError('Authentication required');
    }

    // Verify token with HS256 algorithm (T-01-12: prevent algorithm confusion)
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });

    // Attach decoded user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (err) {
    if (err instanceof AuthenticationError) {
      return next(err);
    }
    if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
      return next(new AuthenticationError('Invalid or expired token'));
    }
    next(err);
  }
}
