import { pool } from '../config/database.js';
import { AppError } from '../utils/errors.js';

export async function create({ email, passwordHash, googleId = null, pdpConsent = false }) {
  try {
    const pdpConsentDate = pdpConsent ? new Date() : null;
    await pool.query(
      'INSERT INTO users (email, password_hash, google_id, pdp_consent, pdp_consent_date) VALUES (?, ?, ?, ?, NOW())',
      [email, passwordHash, googleId, pdpConsent ? 1 : 0]
    );
    const [rows] = await pool.query('SELECT * FROM users WHERE id = LAST_INSERT_ID()');
    return rows[0] || null;
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError('DuplicateError', 'Email or Google ID already exists', 409);
    }
    throw new AppError('DatabaseError', `Failed to create user: ${err.message}`, 500);
  }
}

export async function findByEmail(email) {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, password_hash, google_id, pdp_consent, created_at FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    return rows[0] || null;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to find user by email: ${err.message}`, 500);
  }
}

export async function findById(id) {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, google_id, pdp_consent, created_at FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to find user by id: ${err.message}`, 500);
  }
}

export async function findByGoogleId(googleId) {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, google_id, pdp_consent, created_at FROM users WHERE google_id = ? LIMIT 1',
      [googleId]
    );
    return rows[0] || null;
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to find user by Google ID: ${err.message}`, 500);
  }
}

export async function updatePdpConsent(userId, consent) {
  try {
    await pool.query(
      'UPDATE users SET pdp_consent = ?, pdp_consent_date = NOW() WHERE id = ?',
      [consent ? 1 : 0, userId]
    );
    return { success: true };
  } catch (err) {
    throw new AppError('DatabaseError', `Failed to update PDP consent: ${err.message}`, 500);
  }
}
