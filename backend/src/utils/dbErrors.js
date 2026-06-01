/**
 * Normalize PostgreSQL error codes to meaningful names.
 * Decouples controllers from database-specific error codes.
 *
 * @param {import('pg').DatabaseError} err - PostgreSQL error object
 * @returns {{ code: string, message: string, sqlState: string, table?: string, constraint?: string, detail?: string }}
 */
export function normalizeDbError(err) {
  const CODE_MAP = {
    '23505': 'UNIQUE_VIOLATION',
    '23503': 'FOREIGN_KEY_VIOLATION',
    '23502': 'NOT_NULL_VIOLATION',
    '23514': 'CHECK_VIOLATION',
  };

  return {
    code: CODE_MAP[err.code] || err.code || 'UNKNOWN_DATABASE_ERROR',
    message: err.message || 'Database error occurred',
    sqlState: err.code || null,
    table: err.table || null,
    constraint: err.constraint || null,
    detail: err.detail || null,
  };
}
