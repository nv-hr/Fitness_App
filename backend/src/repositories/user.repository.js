import { pool } from '../config/database.js';
import { AppError } from '../utils/errors.js';

export async function create({ email, passwordHash, googleId = null, pdpConsent = false }) {
  try {
    const pdpConsentDate = pdpConsent ? new Date() : null;
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash, google_id, pdp_consent, pdp_consent_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [email, passwordHash, googleId, pdpConsent, pdpConsentDate]
    );
    return rows[0] || null;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to create user: ${err.message}`, 500);
  }
}

export async function findByEmail(email) {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, password_hash, google_id, pdp_consent, created_at FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    return rows[0] || null;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to find user by email: ${err.message}`, 500);
  }
}

export async function findById(id) {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, google_id, pdp_consent, created_at FROM users WHERE id = $1 LIMIT 1',
      [id]
    );
    return rows[0] || null;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to find user by id: ${err.message}`, 500);
  }
}

export async function findByGoogleId(googleId) {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, google_id, pdp_consent, created_at FROM users WHERE google_id = $1 LIMIT 1',
      [googleId]
    );
    return rows[0] || null;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to find user by Google ID: ${err.message}`, 500);
  }
}

export async function updatePdpConsent(userId, consent) {
  try {
    const { rows } = await pool.query(
      'UPDATE users SET pdp_consent = $1, pdp_consent_date = NOW() WHERE id = $2 RETURNING id, pdp_consent, pdp_consent_date',
      [consent, userId]
    );
    return { success: true };
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to update PDP consent: ${err.message}`, 500);
  }
}
