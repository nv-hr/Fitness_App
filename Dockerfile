# syntax=docker/dockerfile:1

# Stage 1: Build the React frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
# Copy workspace package files
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install all dependencies (workspaces will link them)
RUN npm install

# Copy frontend source code
COPY frontend/ ./frontend/

# Build the frontend using workspace command
RUN npm run build --workspace=frontend

# Stage 2: Production release
FROM node:20-alpine AS production

# Install curl for optional healthcheck or debugging
RUN apk add --no-cache curl

WORKDIR /app

# Copy root package files
COPY package*.json ./
# Copy workspace package files
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install only production dependencies for the entire workspace
RUN npm install --omit=dev

# Copy backend source code
COPY backend/ ./backend/

# Copy built frontend from builder stage to /app/frontend/dist
# This aligns exactly with the path backend/src/app.js resolves: path.resolve(__dirname, '../../frontend/dist')
COPY --from=builder /app/frontend/dist /app/frontend/dist

# Secure configuration: run as non-root node user (standard in alpine node images)
# We ensure the files are owned by node user
RUN chown -R node:node /app

USER node

# Heroku will inject PORT environment variable dynamically, which backend/src/server.js uses
ENV NODE_ENV=production

WORKDIR /app/backend
CMD ["npm", "start"]
