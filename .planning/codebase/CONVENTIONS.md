# Conventions

- **Language & Runtime**: Uses modern JavaScript (ESM) across frontend and backend.
- **Workspaces**: Uses npm workspaces to manage `frontend` and `backend` in a monorepo.
- **API Design**: RESTful APIs returning standardized JSON responses.
- **Data Access**: Direct PostgreSQL queries using the `pg` driver instead of an ORM.
- **Security**: Environment variables for secrets, Helmet for HTTP headers, rate limiting.
- **Deployment**: Docker containerization serving built frontend and Express API together.
