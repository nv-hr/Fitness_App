# Developing Fitness App

Welcome to the Fitness App developer documentation! This guide provides all the necessary information to get you set up and running locally, explains the architecture, and details our conventions.

## Local Setup & Tooling

### Prerequisites
- **Node.js**: Make sure you have the recommended Node.js version installed (we recommend using `nvm` and checking the `.nvmrc` if present, or generally Node 18+).
- **Package Manager**: We use `npm` (or `yarn`/`pnpm` as configured).

### Environment Variables
1. Copy the example environment files for both frontend and backend.
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
2. Fill in the required environment variables. You will need your Supabase credentials (URL and anon key).

### Database Initialization
We use Supabase for our database. Ensure you have your local or remote Supabase instance set up and the necessary tables created according to the schema.

### Running Locally
To start the application locally, you typically need to run both the frontend and backend servers.

**Backend**:
```bash
cd backend
npm install
npm run dev
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

## Architecture & Deep Dives

The Fitness App is built with a decoupled architecture:

- **Frontend**: A modern web application (e.g., React/Next.js/Vite) that provides the user interface. It handles user interactions, state management, and makes API calls to the backend.
- **Backend**: A Node.js service (e.g., Express) that provides business logic, handles secure operations, and serves as an intermediary when needed.
- **Supabase**: Our PostgreSQL database and authentication provider. It handles data persistence, user auth, and row-level security.

This separation ensures that the frontend remains lightweight, the backend focuses on business rules, and Supabase manages data integrity.

## Conventions & Workflows

### Coding Conventions
- Write modular, human-readable code.
- Distinct functionality must reside in separate files.
- Every exported function must include JSDoc/TSDoc comments explaining the *why*, not just the *what*.

### Linting and Formatting
- Always ensure your code is linted and formatted before committing. Check for existing utility functions before adding new libraries.
- Avoid committing `.env` files or any secrets (API keys, passwords) to version control.

### Testing
- Write unit tests for your business logic. 
- Avoid relying solely on browser agents for frontend testing; write robust tests using testing libraries to ensure UI reliability and save tokens.

### Pull Requests (PRs)
- Provide context, intent, and constraints in your PR descriptions.
- Keep PRs focused on a single logical change.
- `npm audit --audit-level=moderate` should be kept clean on all PRs.
- Update documentation (like this file) if your PR introduces new tooling or architecture changes.

## Additional Resources

- **[Operational Runbook](docs/runbook.md)**: Procedures for deployment, monitoring, and incident response.
- **[API Documentation](backend/docs/API.md)**: Detailed information about the backend endpoints, request/response formats, and authentication.
