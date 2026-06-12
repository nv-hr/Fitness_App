# Codebase Structure

```text
fitness-app/
├── backend/                  # Express 5 API server
│   ├── src/
│   │   ├── config/           # DB & Passport config
│   │   ├── controllers/      # Handlers
│   │   ├── middlewares/      # Auth & validations
│   │   ├── repositories/     # Data access
│   │   ├── routes/           # Endpoints
│   │   ├── services/         # Business logic
│   │   └── utils/            # Helpers
│   ├── tests/                # Test suites
│   └── docs/                 # API documentation
├── frontend/                 # React 19 + Vite SPA
│   ├── src/
│   │   ├── app/              # App root and router
│   │   ├── features/         # Feature modules
│   │   └── shared/           # Common components
│   └── vite.config.js        # Vite config
├── scripts/                  # Utility scripts
├── package.json              # Root workspace config
└── Dockerfile                # Multi-stage production build
```
