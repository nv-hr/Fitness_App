import { describe, it, expect, beforeAll } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { generateToken } from '../../src/services/auth.service.js';

describe('generateToken', () => {
  const JWT_SECRET = 'test-secret-for-jwt-signing';

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  it('returns a string', () => {
    const token = generateToken({ id: 1, email: 'test@example.com' });
    expect(typeof token).toBe('string');
  });

  it('contains three dot-separated parts (header.payload.signature)', () => {
    const token = generateToken({ id: 1, email: 'test@example.com' });
    expect(token.split('.')).toHaveLength(3);
  });

  it('contains the correct userId and email in the payload', () => {
    const token = generateToken({ id: 42, email: 'user@example.com' });
    const decoded = jwt.verify(token, JWT_SECRET);
    expect(decoded.userId).toBe(42);
    expect(decoded.email).toBe('user@example.com');
  });

  it('has an expiration time set in the future', () => {
    const token = generateToken({ id: 1, email: 'test@example.com' });
    const decoded = jwt.verify(token, JWT_SECRET);
    expect(decoded.exp).toBeDefined();
    expect(typeof decoded.exp).toBe('number');
    // Token should expire in the future (7d from now)
    expect(decoded.exp * 1000).toBeGreaterThan(Date.now());
  });

  it('can be verified with the secret', () => {
    const token = generateToken({ id: 1, email: 'test@example.com' });
    const decoded = jwt.verify(token, JWT_SECRET);
    expect(decoded).toBeDefined();
    expect(decoded.iat).toBeDefined();
  });

  it('rejects token signed with a different secret', () => {
    const token = generateToken({ id: 1, email: 'test@example.com' });
    expect(() => jwt.verify(token, 'wrong-secret')).toThrow();
  });

});
