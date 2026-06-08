# Testing Strategy

## Backend
- **Framework**: Jest
- **Location**: `backend/tests/`
- **Setup**: Configured via `backend/jest.setup.js`.
- Run tests regularly to ensure business logic and integrations are sound.

## Frontend
- **Strategy**: Manual testing by the user or using dedicated testing libraries.
- **Restriction**: Automated browser agents (e.g., Puppeteer/Playwright scripts driven by LLMs) should **not** be used for frontend testing to save token usage, per project rules. Let the user test it or write static testing library tests.
