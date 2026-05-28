import { describe, it, expect } from '@jest/globals';
import { normalizeDbError } from '../../src/utils/dbErrors.js';

describe('normalizeDbError', () => {
  describe('known PostgreSQL error codes', () => {
    it('23505 -> UNIQUE_VIOLATION with all fields', () => {
      const err = { code: '23505', message: 'duplicate key', table: 'users', constraint: 'users_email_key', detail: 'Key (email)=...' };
      const result = normalizeDbError(err);
      expect(result.code).toBe('UNIQUE_VIOLATION');
      expect(result.message).toBe('duplicate key');
      expect(result.sqlState).toBe('23505');
      expect(result.table).toBe('users');
      expect(result.constraint).toBe('users_email_key');
      expect(result.detail).toBe('Key (email)=...');
    });

    it('23503 -> FOREIGN_KEY_VIOLATION', () => {
      const err = { code: '23503', message: 'insert or update violates foreign key', table: 'food_logs', constraint: 'food_logs_food_id_fkey', detail: 'Key (food_id)=(999) is not present' };
      const result = normalizeDbError(err);
      expect(result.code).toBe('FOREIGN_KEY_VIOLATION');
      expect(result.sqlState).toBe('23503');
    });

    it('23502 -> NOT_NULL_VIOLATION', () => {
      const err = { code: '23502', message: 'null value in column "email"', table: 'users', constraint: 'users_email_not_null', detail: 'Failing row contains null' };
      const result = normalizeDbError(err);
      expect(result.code).toBe('NOT_NULL_VIOLATION');
      expect(result.sqlState).toBe('23502');
    });

    it('23514 -> CHECK_VIOLATION', () => {
      const err = { code: '23514', message: 'new row violates check constraint', table: 'profiles', constraint: 'profiles_weight_check', detail: 'Failing row contains (1, -5)' };
      const result = normalizeDbError(err);
      expect(result.code).toBe('CHECK_VIOLATION');
      expect(result.sqlState).toBe('23514');
    });
  });

  describe('unknown / missing error codes', () => {
    it('unknown code returns the raw code', () => {
      const err = { code: 'XX000', message: 'internal error' };
      expect(normalizeDbError(err).code).toBe('XX000');
    });

    it('missing code returns UNKNOWN_DATABASE_ERROR', () => {
      const err = { message: 'oops' };
      expect(normalizeDbError(err).code).toBe('UNKNOWN_DATABASE_ERROR');
    });

    it('empty error returns fallback message and null fields', () => {
      const err = {};
      const result = normalizeDbError(err);
      expect(result.message).toBe('Database error occurred');
      expect(result.table).toBeNull();
      expect(result.constraint).toBeNull();
      expect(result.detail).toBeNull();
    });
  });
});
