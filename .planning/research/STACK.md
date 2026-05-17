# Technology Stack

**Project:** Fitness_App
**Researched:** 2026-05-17
**Confidence:** HIGH (all versions verified via npm registry + Context7 official docs)

## Recommended Stack

### Runtime

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Node.js | 22.x LTS (Alpine) | JavaScript runtime | Current LTS, long-term support until 2027. Alpine image keeps Docker images small (~180MB vs ~1GB for full Debian). |

### Frontend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 19.2.x | UI library | Latest stable. React 19 removed deprecated APIs (propTypes, defaultProps, string refs), uses new JSX transform. No create-react-app — use Vite. |
| Vite | 8.0.x | Build tool + dev server | CRA is deprecated. Vite is the official recommendation from React docs. Instant HMR, native ESM, optimized builds. `@vitejs/plugin-react` 6.0.x for React Fast Refresh. |
| `@vitejs/plugin-react` | 6.0.x | React Fast Refresh in Vite | Required for React HMR in Vite. Uses Babel under the hood for Fast Refresh. |

### Backend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Express | 5.2.x | Web framework | Express 5 is stable and released. Supports async/await natively in route handlers, improved error handling, and modern middleware patterns. |
| `mysql2` | 3.22.x | MySQL driver | Promise-based API, prepared statements, connection pooling. The standard MySQL client for Node.js. Use `mysql2/promise` import for async/await. |
| `cors` | 2.8.x | CORS middleware | Required for frontend-to-backend communication during development. Configure with specific origin (not `*`) in production. |
| `helmet` | 8.1.x | Security headers | Sets HTTP headers to prevent common attacks (XSS, clickjacking, MIME sniffing). Essential for any Express API. |
| `express-rate-limit` | 8.5.x | Rate limiting | Prevents brute-force attacks on auth endpoints. Critical for login/register routes. |
| `express-validator` | 7.3.x | Input validation | Validator.js-based middleware for Express. Validate BMI/TDEE inputs, food log entries before they hit the database. |
| `morgan` | 1.10.x | HTTP request logging | Development logging. Use `dev` format in dev, `combined` in production. |
| `compression` | 1.8.x | Response compression | gzip/deflate compression for API responses. Reduces bandwidth for food database queries. |
| `dotenv` | 17.4.x | Environment variables | Load `.env` files. Use for DB credentials, JWT secrets, OAuth keys. Never commit `.env`. |

### Authentication

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `passport` | 0.7.x | Auth middleware framework | Industry-standard Express auth middleware. Extensible strategy system. |
| `passport-local` | 1.0.x | Email/password strategy | Handles email/password login flow. Works with bcrypt for password verification. |
| `passport-google-oauth20` | 2.0.x | Google OAuth2 strategy | Official Google OAuth2 strategy for Passport. Handles the OAuth2 flow: redirect to Google, receive callback, extract profile. |
| `jsonwebtoken` | 9.0.x | JWT creation/verification | Auth0-maintained. Sign tokens with HS256 (shared secret) or RS256 (key pair). Use HS256 for simplicity — sufficient for this app scale. |
| `bcrypt` | 6.0.x | Password hashing | Native C++ bindings — faster than bcryptjs. Use 10 salt rounds. Async API to avoid blocking the event loop. |

### Development

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `nodemon` | 3.1.x | Auto-restart on file change | Watches backend source files, restarts Express server on save. Essential DX for development. |

### Infrastructure

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Docker | latest | Containerization | Consistent dev/prod environments. Multi-stage builds for production images. |
| MySQL | 8.4.x (Docker) | Database | LTS release. Use `mysql:8.4` Docker image (not `latest`). Supports `utf8mb4` for Indonesian characters. |
| Cloudflare Tunnel | 2026.x (Docker) | Secure public exposure | No port forwarding needed. Outbound-only connection to Cloudflare edge. Free tier, handles TLS termination automatically. |

## Installation

```bash
# Backend dependencies
cd backend
npm install express mysql2 cors helmet express-rate-limit express-validator morgan compression dotenv passport passport-local passport-google-oauth20 jsonwebtoken bcrypt

# Backend dev dependencies
npm install -D nodemon

# Frontend dependencies
cd frontend
npm create vite@latest . -- --template react
npm install
npm install -D @vitejs/plugin-react
```

## Architecture Decisions

### Why Express 5 (not 4)?

Express 5.2.x is stable and has been released. Key improvements over v4:
- Native async/await support in route handlers (errors auto-caught)
- Improved error handling middleware
- Better Promise support throughout
- Most Express 4 middleware works unchanged

**Confidence: HIGH** — verified via Context7 `/expressjs/express` with versions `v5.1.0`, `v5.2.0` listed.

### Why Vite (not Create React App)?

Create React App is officially deprecated. Vite is the recommended tool in React 19 documentation. Benefits:
- Instant dev server startup (no webpack bundling)
- Fast HMR via native ESM
- Smaller production bundles with Rollup
- Better TypeScript support out of the box

**Confidence: HIGH** — React 19 docs explicitly recommend Vite. CRA removed from React docs.

### Why `bcrypt` (not `bcryptjs`)?

`bcrypt` uses native C++ bindings via `node-addon-api`, making it ~3x faster than the pure-JS `bcryptjs`. For a production app with password hashing on every login, this matters. The native dependency requires build tools (Python, C++ compiler) during `npm install`, but Docker handles this cleanly with `node:22-alpine` + `apk add python3 make g++`.

If build-time dependencies are a blocker, `bcryptjs` (v2.4.x) is an acceptable fallback — zero dependencies, works everywhere, just slower.

**Confidence: HIGH** — verified via Context7. `bcrypt` 6.0.x is current.

### Why HS256 (not RS256) for JWT?

HS256 uses a single shared secret for signing and verification. RS256 uses a public/private key pair. For this app:
- Single backend service (no microservices)
- No third-party token verification needed
- HS256 is simpler: one `JWT_SECRET` env var

RS256 is better when multiple services need to verify tokens without sharing a secret, or when tokens are issued by a separate auth service. Neither applies here.

**Confidence: HIGH** — standard JWT guidance for single-service architectures.

### Why `mysql2` (not an ORM)?

For v1 with simple CRUD operations (users, BMI records, TDEE records, food logs, food database), raw SQL with `mysql2` promise API is sufficient. An ORM adds complexity without benefit at this scale.

If the project grows to include complex relationships, migrations, and type-safe queries, consider adding **Drizzle ORM** (lightweight, ~7.4kb, supports MySQL) in a later phase.

**Confidence: HIGH** — `mysql2` 3.22.x is the standard MySQL driver for Node.js.

## What NOT to Use

| Technology | Why Not | What to Use Instead |
|------------|---------|---------------------|
| Create React App | Deprecated, slow builds, webpack-based | Vite with `@vitejs/plugin-react` |
| `mysql` (legacy package) | Unmaintained, callback-only API | `mysql2` with promise API |
| `express-session` for JWT apps | Session-based auth conflicts with stateless JWT | Use `jsonwebtoken` + custom auth middleware |
| `crypto` for password hashing | Not designed for password hashing (no salt rounds, no timing-safe comparison) | `bcrypt` with 10 salt rounds |
| `latest` Docker tags | Unpredictable builds, can break on minor updates | Pin to major.minor: `mysql:8.4`, `node:22-alpine` |
| `cors: { origin: '*' }` in production | Allows any origin to access your API | Set specific origin: `{ origin: 'https://your-domain.com' }` |
| Sequelize ORM | Heavy (~200kb+), complex, learning curve | `mysql2` raw queries for v1; Drizzle ORM if needed later |

## Auth Flow Architecture

### Email/Password Registration + Login

```
1. POST /api/auth/register
   → Validate input (express-validator)
   → Hash password (bcrypt, 10 rounds)
   → Insert user into MySQL
   → Generate JWT (jsonwebtoken, HS256, 7d expiry)
   → Return { token, user }

2. POST /api/auth/login
   → Validate input
   → Find user by email
   → Compare password (bcrypt.compare)
   → Generate JWT
   → Return { token, user }
```

### Google OAuth2 Login

```
1. GET /api/auth/google
   → Passport redirects to Google consent screen

2. GET /api/auth/google/callback
   → Google redirects back with auth code
   → Passport exchanges code for profile
   → FindOrCreate user in MySQL by Google profile ID
   → Generate JWT
   → Redirect to frontend with token (or set httpOnly cookie)
```

### JWT Middleware

```
1. Frontend stores JWT (localStorage or httpOnly cookie)
2. Every API request includes: Authorization: Bearer <token>
3. Backend middleware verifies token (jwt.verify)
4. If valid: attach user to req.user, proceed
5. If invalid/expired: return 401
```

## Docker Configuration

### Development (`docker-compose.yml`)

```yaml
services:
  mysql:
    image: mysql:8.4
    container_name: fitness_mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: fitness_app
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./backend/db/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - fitness_net
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: development
    container_name: fitness_backend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=fitness_app
      - JWT_SECRET=${JWT_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
    volumes:
      - ./backend:/app
      - /app/node_modules
    networks:
      - fitness_net
    depends_on:
      mysql:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: development
    container_name: fitness_frontend
    restart: unless-stopped
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:3001
    volumes:
      - ./frontend:/app
      - /app/node_modules
    networks:
      - fitness_net
    depends_on:
      - backend

  cloudflared:
    image: cloudflare/cloudflared:2026.3.0
    container_name: fitness_tunnel
    restart: unless-stopped
    command: tunnel --no-autoupdate run --token ${TUNNEL_TOKEN}
    environment:
      - TUNNEL_TOKEN=${TUNNEL_TOKEN}
    networks:
      - fitness_net
    depends_on:
      - backend

volumes:
  mysql_data:

networks:
  fitness_net:
    driver: bridge
```

### Backend Dockerfile (multi-stage)

```dockerfile
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS development
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npx", "nodemon", "src/index.js"]

FROM base AS production
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "src/index.js"]
```

### Frontend Dockerfile (multi-stage)

```dockerfile
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS development
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM base AS builder
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Vite Proxy Config (dev only)

In `frontend/vite.config.js`, proxy API requests to the backend during development:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://backend:3001',
        changeOrigin: true,
      },
    },
  },
})
```

## Cloudflare Tunnel Setup

### Steps

1. **Create tunnel** in Cloudflare Zero Trust dashboard: `one.dash.cloudflare.com` → Networks → Tunnels → Create Tunnel → Cloudflared
2. **Copy the tunnel token** from the Docker installation command
3. **Add token to `.env`**: `TUNNEL_TOKEN=eyJh...`
4. **Configure public hostname** in dashboard:
   - Subdomain: `fitness` (or your choice)
   - Domain: your Cloudflare-managed domain
   - Service Type: `HTTP`
   - URL: `http://backend:3001` (Docker service name, not localhost)
5. **Run**: `docker compose up -d`

### Key Points

- **No ports exposed to host** — cloudflared makes outbound-only connections on ports 443/7844
- **No SSL certificates needed** — Cloudflare terminates TLS at the edge
- **No port forwarding** — firewall can remain closed
- **Use Docker service names** as tunnel URLs (e.g., `http://backend:3001`), not `localhost`
- **SSL/TLS mode**: Set to "Full" in Cloudflare dashboard (not "Flexible")

## Environment Variables

### `.env` (root directory, never commit)

```env
# Database
DB_ROOT_PASSWORD=your-secure-root-password
DB_USER=fitness_user
DB_PASSWORD=your-secure-db-password

# JWT
JWT_SECRET=your-256-bit-secret-minimum-32-chars

# Google OAuth2
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Cloudflare Tunnel
TUNNEL_TOKEN=eyJh...
```

## Database Initialization

### `backend/db/init.sql`

```sql
CREATE DATABASE IF NOT EXISTS fitness_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fitness_app;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  google_id VARCHAR(255) UNIQUE,
  display_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User profiles (weight, height, age, gender, activity level)
CREATE TABLE IF NOT EXISTS user_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  age INT,
  gender ENUM('male', 'female', 'other'),
  activity_level ENUM('sedentary', 'light', 'moderate', 'active', 'very_active'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Food logs
CREATE TABLE IF NOT EXISTS food_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  food_name VARCHAR(255) NOT NULL,
  calories INT NOT NULL,
  log_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Pre-seeded Indonesian food database
CREATE TABLE IF NOT EXISTS food_database (
  id INT AUTO_INCREMENT PRIMARY KEY,
  food_name VARCHAR(255) NOT NULL,
  calories_per_serving INT NOT NULL,
  serving_size VARCHAR(100),
  category VARCHAR(100),
  is_custom BOOLEAN DEFAULT FALSE
);

-- Seed common Indonesian foods
INSERT INTO food_database (food_name, calories_per_serving, serving_size, category) VALUES
('Nasi Putih', 206, '1 porsi (200g)', 'Karbohidrat'),
('Nasi Goreng', 350, '1 porsi (300g)', 'Karbohidrat'),
('Ayam Goreng', 280, '1 potong (120g)', 'Protein'),
('Tempe Goreng', 170, '2 potong (100g)', 'Protein'),
('Gado-gado', 250, '1 porsi (250g)', 'Sayuran'),
('Soto Ayam', 180, '1 mangkuk (300ml)', 'Sup'),
('Mie Goreng', 320, '1 porsi (250g)', 'Karbohidrat'),
('Bubur Ayam', 200, '1 mangkuk (300g)', 'Karbohidrat'),
('Sate Ayam', 180, '5 tusuk (150g)', 'Protein'),
('Rendang', 310, '1 porsi (150g)', 'Protein');
```

## .dockerignore

### `backend/.dockerignore`
```
node_modules
npm-debug.log
.env
.dockerignore
```

### `frontend/.dockerignore`
```
node_modules
dist
.env
.dockerignore
```

## Sources

- **React 19**: Context7 `/facebook/react/v19_2_0` — changelog, breaking changes, TypeScript updates
- **Express 5**: Context7 `/expressjs/express` — versions `v5.1.0`, `v5.2.0` confirmed stable
- **mysql2**: Context7 `/sidorares/node-mysql2` — connection pool, promise API patterns
- **jsonwebtoken**: Context7 `/auth0/node-jsonwebtoken` — HS256/RS256 signing, verification
- **passport**: Context7 `/jaredhanson/passport` — strategy registration, authenticate middleware
- **bcrypt**: Context7 `/kelektiv/node.bcrypt.js` — async hash/compare, salt rounds
- **cors**: Context7 `/expressjs/cors` — configuration options, origin control
- **Vite**: Context7 `/vitejs/vite` — proxy config, backend integration, versions up to `v8.0.10`
- **npm registry**: All package versions verified via `npm view <package> version` (2026-05-17)
- **Docker Hub**: MySQL 8.4 LTS image confirmed, Node.js 22 Alpine base image
- **Cloudflare docs**: developers.cloudflare.com — tunnel setup, Docker configuration, ingress rules
