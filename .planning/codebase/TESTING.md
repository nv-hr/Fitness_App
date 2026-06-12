# Testing

- **Backend**: Uses Jest and Supertest.
  - Test suites are located in `backend/tests/`.
  - Scripts available for unit tests (`test:unit`) and integration tests (`test:integration`).
  - Integration tests use a separate database defined by `DATABASE_URL_TEST`.
- **Frontend**: Currently relies on manual testing, though Vite provides fast feedback.
