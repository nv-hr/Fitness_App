# Concerns

- **Frontend Testing**: The frontend lacks a formalized automated testing suite (e.g., Vitest or Cypress).
- **Type Safety**: While TypeScript is present, the project is largely JS/ESM, so full type safety might be lacking.
- **OpenRouter API Dependency**: Heavy reliance on LLMs (via OpenRouter) might present rate-limiting or latency issues depending on model availability.
- **Raw SQL Queries**: Direct use of raw SQL (`pg`) requires careful parameterized queries to prevent SQL injection and strict schema management.
