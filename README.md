# Fitness App

A full-stack web application for monitoring body condition through BMI and TDEE calculation, tracking daily food intake and calories, and receiving personalized physical activity recommendations.

Built with React 19, Express 5, and Supabase PostgreSQL.

## Access
You can test the app here at 
[fit health](https://sample.biz.id)

## Features

- **BMI Calculator** — Calculate Body Mass Index from height and weight with health category classification.
- **TDEE Calculator** — Estimate Total Daily Energy Expenditure based on BMR (Mifflin-St Jeor) and activity level.
- **Food Logging** — Search a database of 200+ ingredients, log by ingredient and weight in grams, calculate exact calorie and macronutrient values.
- **Calorie Tracking** — Daily summary with caloric balance, history view, and progress bar toward your TDEE goal.
- **Activity Logging** — Log completed activities with duration and intensity, track daily active minutes and calories burned.
- **Activity Calendar** — Month-grid view of your weekly activity plan with color-coded days, per-day detail panel, activity swap, and completion toggle. Past days read-only.
- **Meal Calendar** — Month-grid view of your daily meal plan with per-meal-type log buttons, auto-generation, and past-day read-only.
- **Weight Tracking** — Log weight with date and notes, set target weight and goal date, auto-log on profile update with UPSERT pattern.
- **Progress Dashboard** — Centralized `/progress` view with weight entry form, trend chart, history table, and goal status.
- **Weight Trend Chart** — Recharts LineChart with 30/60/90 day date range filter, goal reference line, and all-state handling (empty/loading/insufficient/normal).
- **Trend Prediction** — OLS linear regression estimates target completion date with color-coded status (green/amber/red).
- **LLM Weekly Activity Plans** — AI-generated variable-day (4-6) activity plans streamed in real-time (SSE), powered by OpenRouter, personalized to your profile, fitness goal, and history.
- **LLM Daily Meal Plans** — AI-generated 1-day meal recommendations streamed in real-time (SSE) with auto-calculated portions to meet your calorie target.
- **Auto-Logging** — Generated activities and meals auto-save to their respective logs with one-click completion toggle and batch-log support.
- **Per-Activity Swap** — Swap individual activities or meal items with LLM-generated replacements without regenerating the entire plan.

## Tech Stack

| Layer       | Technology                                                                 |
|-------------|---------------------------------------------------------------------------|
| Frontend    | React 19, Vite 8, React Router 7, TanStack React Query, React Hook Form, Zod |
| Backend     | Express 5 (ESM), Passport (JWT + Google OAuth), Helmet, express-rate-limit |
| Database    | Supabase PostgreSQL 17 (pg driver, no ORM)                                |
| Auth        | Email/password registration + login, Google OAuth, httpOnly JWT cookies   |
| LLM         | OpenRouter API (free-tier models), node-cache                             |
| Deployment  | Docker multi-stage build (single container, Express serves built frontend) |

## Quick Start

### Prerequisites

- Node.js 20+
- npm
- A Supabase PostgreSQL database (free tier works)

### 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your settings:

| Variable               | Description                            |
|------------------------|----------------------------------------|
| `NODE_ENV`             | `development`                          |
| `PORT`                 | Backend port (default: `3001`)         |
| `FRONTEND_URL`         | Frontend origin (dev: `http://localhost:3000`) |
| `JWT_SECRET`           | Secret key for signing JWT tokens      |
| `GOOGLE_CLIENT_ID`     | Google OAuth 2.0 client ID             |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 client secret         |
| `GOOGLE_CALLBACK_URL`  | OAuth callback URL                     |
| `OPENROUTER_API_KEY`   | OpenRouter API key for LLM features    |
| `OPENROUTER_BASE_URL`  | `https://openrouter.ai/api/v1`         |
| `LLM_MODEL`            | Primary model for weekly plan generation |
| `LLM_FALLBACK_MODEL`   | Fallback model when primary unavailable |
| `DATABASE_URL`         | Supabase PostgreSQL connection string  |
| `DATABASE_URL_TEST`    | Supabase PostgreSQL connection string for integration testing |

### 2. Install dependencies

```bash
npm install
```

### 3. Start development servers

Start both backend and frontend development servers simultaneously using:

```bash
npm run dev
```

The frontend dev server (port 3000) proxies `/api` requests to the backend (port 3001). Open `http://localhost:3000`.

## Docker Deployment

```bash
# Build the production image
docker build -t fitness-app .

# Run the container (injecting your .env file)
docker run -p 3001:3001 --env-file .env fitness-app
```

This builds a multi-stage Docker image:

1. **Builder stage** — Installs all dependencies and builds the React frontend with Vite.
2. **Production stage** — Installs only production dependencies, copies the built frontend to `./public`, and serves both the Express API and static frontend on port 80 (or port mapping configured in run command).

The container includes a health check at `GET /api/health`.

## API Documentation

The REST API provides 20+ endpoints for auth, calculations, food logging, and activity data.

- **In-app docs:** Visit `GET /api/docs` when the server is running.
- **Full reference:** See [`backend/docs/API.md`](./backend/docs/API.md).

## Project Structure

```
fitness-app/
├── backend/                  # Express 5 API server
│   ├── src/
│   │   ├── config/           # Database, Passport configuration
│   │   ├── controllers/      # Request handlers
│   │   ├── middlewares/      # Auth, validation, error handling
│   │   ├── repositories/     # Database queries (pg)
│   │   ├── routes/           # Route definitions
│   │   ├── services/         # Business logic
│   │   └── utils/            # Error helpers, response formatting
│   ├── tests/                # Jest test suites
│   └── docs/API.md           # API reference
├── frontend/                 # React 19 + Vite SPA
│   ├── src/
│   │   ├── app/              # App root, providers, router
│   │   ├── features/         # Feature modules (auth, food-log, activities, profile, progress)
│   │   └── shared/           # Shared components and utilities
│   │       ├── calendar/     # CalendarGrid, MonthNav, DayDetailPanel, hooks, utils
│   │       └── hooks/        # useResponsive, etc.
│   └── vite.config.js        # Vite config (dev proxy included)
├── scripts/                  # Utility scripts (db-init.js, start-all.sh, remove_postman_folder.js)
├── Dockerfile                # Multi-stage production build
└── LICENSE                   # GNU General Public License v3
```

## License

This project is licensed under the GNU General Public License v3. See [LICENSE](./LICENSE) for details.
