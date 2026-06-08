# Directory Structure

```text
/
├── frontend/             # React SPA
│   ├── src/              # React components, contexts, and hooks
│   ├── dist/             # Build output
│   ├── index.html        # Entry HTML
│   ├── vite.config.js    # Vite configuration
│   └── package.json      # Frontend dependencies
├── backend/              # Express API Server
│   ├── src/              # Express controllers, routes, services
│   ├── db/               # Database schemas and connection logic
│   ├── docs/             # API documentation
│   ├── prompts/          # Centralized LLM prompts for Gemini
│   ├── tests/            # Jest test suites
│   ├── jest.setup.js     # Test setup configuration
│   └── package.json      # Backend dependencies
├── adapters/             # Shared adapters or integration layers (purpose TBD based on future implementations)
├── scripts/              # Utility scripts for the monorepo
├── docs/                 # General project documentation
├── package.json          # Root package.json defining workspaces
└── .env                  # Environment variables
```
