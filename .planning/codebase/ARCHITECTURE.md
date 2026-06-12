# Architecture

## High-Level Architecture
The project is a monorepo containing a full-stack web application:
- **Frontend**: Single Page Application built with React and Vite. It communicates with the backend via REST API. Features are organized modularly (auth, food-log, activities, profile, progress).
- **Backend**: RESTful API built with Express 5 using ESM. It acts as the orchestration layer and data provider.
- **Database**: PostgreSQL hosted on Supabase.

## Backend Architecture
Follows a layered approach:
- `routes/`: Defines the API endpoints.
- `controllers/`: Handles incoming requests and orchestrates logic.
- `middlewares/`: Handles cross-cutting concerns like auth, validation, error handling.
- `services/`: Contains core business logic and integration with external APIs (like OpenRouter).
- `repositories/`: Handles raw database queries using the `pg` driver without an ORM.

## Frontend Architecture
Follows feature-based folder structure:
- `app/`: Global providers and routing setup.
- `features/`: Specific domain modules (e.g., auth, calendar, food-log).
- `shared/`: Shared components, utilities, and hooks across features.
