# System Architecture

The application is structured as a full-stack monorepo with distinct frontend and backend workspaces.

## Frontend Workspace (`/frontend`)
- A React Single Page Application (SPA) built with Vite.
- Communicates with the backend REST API.
- Uses TailwindCSS for styling and motion for animations.

## Backend Workspace (`/backend`)
- An Express.js REST API server.
- Handles business logic, database interactions, and external API calls (e.g., Google Gemini).
- Contains a `prompts` directory, indicating prompt engineering is centralized here.

## Communication
- Frontend runs on a development server (default port 3000, exposed to 0.0.0.0).
- Backend runs on a separate development server (port 3001).
- They likely communicate via HTTP REST endpoints.
