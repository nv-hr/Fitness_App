# Codebase Concerns & Technical Debt

## Conflicting/Multiple AI SDKs
- The root `package.json` includes `@google/genai` (Google Gemini).
- The `backend/package.json` includes `openai`.
- **Action**: Check if the project is migrating from OpenAI to Gemini or using both simultaneously. Clean up unused dependencies to save space and reduce complexity.

## Environment Variables
- `DATABASE_URL` is used for `db:migrate` scripts in the backend. Ensure a robust mechanism is in place for managing this securely, avoiding `.env` in source control as per project rules.

## .agent Directory
- Ensure `.agent` folder is strictly ignored in version control (`.gitignore` check required) as per global project rules.

## Token Usage
- Global rules heavily emphasize token efficiency. Ensure all code blocks and prompts are concise and modular.
