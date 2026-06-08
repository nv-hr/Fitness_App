# Code Conventions

## General Rules
- **Modularity**: Distinct functionality must reside in separate files, not in the main entry point.
- **Documentation**: Every exported function must include JSDoc/TSDoc. Comments should explain 'Why', not 'What'.
- **Security**: Never commit API keys, passwords, or secrets (like `.env`) to version control.
- **Dependencies**: Check for existing utility functions before adding new libraries to reduce footprint.
- **Token Efficiency**: Code and prompts should be optimized for LLM token usage. Do not use browser agents for frontend testing; rely on user testing or testing libraries.

## Frontend
- React 19 with Vite.
- TailwindCSS for styling.
- Check for internal codebase to find shareable components or styles before writing new ones.
- Prioritize human-readable code and clean file organization for easy debugging.

## Backend
- Express.js and Node.js.
- TypeScript is used.
- Tests are written with Jest.
