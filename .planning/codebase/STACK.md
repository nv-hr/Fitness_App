---
title: "Tech Stack"
last_updated: "2026-05-31"
focus: tech
---

# STACK.md — Technology Stack

## Overview

Fitness_App is a full-stack web application for fitness tracking — BMI/TDEE calculation, food logging, activity tracking, LLM-powered weekly activity plans, and LLM-powered meal recommendations.

## Languages

- **JavaScript** (Node.js 20+) — Both backend (ESM) and frontend (ESM via Vite)
- **SQL** — PostgreSQL queries via `pg` driver (raw SQL, parameterized)

## Runtime / Platform

- **Node.js 20+** — Backend API server (Express 5)
- **Browser** — React 19 SPA served by Vite 8 (dev) or Express static (production)
- **Docker** — Multi-stage production container (Express serves built frontend)

## Frameworks

| Layer | Framework | Version |
|-------|-----------|---------|
| Frontend | React | 19 |
| Frontend | Vite | 8 |
| Frontend | React Router | 7 |
| Backend | Express | 5 (ESM) |
| Testing (backend) | Jest | — |
| Testing (frontend) | Vitest | — |

## Database

- **Supabase PostgreSQL 17** — Managed PostgreSQL with connection pooling (via `pg` driver)
- **Migrations**: `node-pg-migrate` for schema versioning
- **No ORM** — Raw SQL queries in repository layer

## Authentication

- **Passport.js** — Local strategy (email/password) + Google OAuth 2.0
- **JWT** — HS256 httpOnly cookies (7-day expiry)
- **bcrypt** — Password hashing

## Key Dependencies

### Backend
| Package | Purpose |
|---------|---------|
| `express` | HTTP server framework |
| `passport`, `passport-local`, `passport-google-oauth20` | Auth strategies |
| `jsonwebtoken` | JWT signing/verification |
| `pg` | PostgreSQL client (raw queries) |
| `node-pg-migrate` | Database migrations |
| `bcrypt` | Password hashing |
| `helmet` | Security headers |
| `express-rate-limit` | Rate limiting |
| `openai` | OpenAI SDK (OpenRouter API) |
| `node-cache` | In-memory plan caching |
| `zod` | Request validation schemas |
| `jest` | Testing framework |

### Frontend
| Package | Purpose |
|---------|---------|
| `react`, `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `@tanstack/react-query` | Server state management |
| `react-hook-form` | Form handling |
| `zod`, `@hookform/resolvers` | Form validation |
| `@vitejs/plugin-react` | Vite React plugin |
| `vitest`, `@testing-library/react` | Testing |

## Configuration Files

| File | Purpose |
|------|---------|
| `backend/.env` | Environment variables (DB, JWT, OAuth, OpenRouter) |
| `backend/.env.example` | Template with documented variables |
| `backend/package.json` | Backend dependencies and scripts |
| `frontend/package.json` | Frontend dependencies and scripts |
| `frontend/vite.config.js` | Vite config with API proxy |
| `Dockerfile` | Multi-stage production build |
| `docker-compose.yml` | Container orchestration |
| `supabase/migrations/` | Database schema migrations |

## Build / Tooling

- **Vite 8** — Frontend bundler and dev server
- **Docker** — Multi-stage build (builder + production stages)
- **Jest** — Backend unit/integration tests
- **Vitest** — Frontend component tests
- **Total tests**: 239 (backend 114 + frontend 125)

## LLM Integration

- **Provider**: OpenRouter API (OpenAI-compatible)
- **SDK**: `openai` (v6+) npm package
- **Primary model**: `nvidia/nemotron-3-nano-30b-a3b:free`
- **Fallback model**: `openai/gpt-oss-20b:free`
- **Caching**: `node-cache` (1-hour TTL) for in-memory plan caching
- **Rate limiting (Activity Plans)**: 5 req/15 min for generate, 5 req/15 min for regenerate-day
- **Rate limiting (Meal Plans)**: 5 req/15 min for generate, 3 req/30 min for regenerate-day, 30 req/15 min for log-day

## Notes

- Repository is hosted at `https://github.com/nv-hr/Fitness_App.git`
- Milestone v1.3 (Activity Tracking & Smart Suggestions) is complete and shipped
- Milestone v1.4 (LLM Food Recommendations) is complete and shipped — 6 phases (18-23)
- Meal Plan feature: LLM-powered daily meal recommendations based on fitness goal, ingredients from existing database, auto-calculated portions to meet calorie target, fuzzy ingredient matching, correction loop with template fallback
- Deployed via Docker single-container setup (Express serves built frontend)
