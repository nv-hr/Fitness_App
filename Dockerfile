# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

# Stage 1: Build the React frontend
# Install ALL dependencies (including devDeps like Vite) — D-04 applies only to production stage
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci

# Build the React app (output: frontend/dist/)
COPY frontend/ ./
RUN npm run build

# ─────────────────────────────────────────────────

FROM node:20-alpine AS development

# Stage 2: Development — hot-reload backend, no frontend build
# (Frontend runs via Vite dev server on host or separate container during dev)
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
ENV PORT=80
EXPOSE 80

CMD ["npm", "run", "dev"]

# ─────────────────────────────────────────────────

FROM node:20-alpine AS production

# Stage 3: Production — serves both Express API and built React frontend

# Install curl for HEALTHCHECK per D-08
RUN apk add --no-cache curl

WORKDIR /app

# Install only production dependencies per D-04
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend source code
COPY backend/ ./

# Copy built frontend from builder stage to ./public (served by Express.static per D-02)
COPY --from=builder /app/frontend/dist ./public

# Default to port 80 per D-06
ENV PORT=80
EXPOSE 80

# HEALTHCHECK per D-08 — curl hits /api/health on container's localhost:80
# Standard defaults: 30s interval, 3s timeout, 10s start period, 3 retries
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:80/api/health || exit 1

# Production CMD per D-03 — uses "npm start" (maps to "node src/server.js" per backend/package.json)
CMD ["npm", "start"]
