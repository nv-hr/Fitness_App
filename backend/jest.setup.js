/**
 * Jest setup file — runs before any test modules are imported.
 *
 * Sets NODE_ENV=test and overrides DATABASE_URL with DATABASE_URL_TEST
 * so the app's database pool and rate limiters are configured correctly
 * before any module is evaluated (setupFiles runs before imports).
 *
 * @see .planning/phases/12-testing-validation/12-CONTEXT.md (D-02)
 */
process.env.NODE_ENV = 'test';

if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}
