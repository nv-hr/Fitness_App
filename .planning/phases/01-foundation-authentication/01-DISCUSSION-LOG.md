# Phase 1: Foundation & Authentication - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-17
**Phase:** 01-Foundation & Authentication
**Areas discussed:** JWT storage strategy, PDP consent flow, Monorepo structure, User schema & password, Dev environment, API dev communication

---

## JWT Storage Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| httpOnly cookies (Recommended) | Server sets cookie, browser sends automatically. Most secure against XSS. | ✓ |
| localStorage | Store in localStorage, attach to requests manually. Simpler but XSS-vulnerable. | |
| Both — cookie + localStorage | httpOnly cookie for auth, localStorage for non-sensitive client state | |

**User's choice:** httpOnly cookies (Recommended)
**Notes:** User accepted the recommended option. Research confirmed httpOnly cookies are most secure against XSS attacks.

---

## PDP Consent Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Checkbox during registration (Recommended) | Checkbox on registration form: 'I agree to PDP terms' with link to terms page | ✓ |
| Separate consent page | After registration, before first use — dedicated page explaining data usage | |
| Both — registration + before data entry | Checkbox at registration + again before first health data entry (BMI/TDEE) | |

**User's choice:** Checkbox during registration (Recommended)
**Notes:** Single consent point during registration. PDP terms page needs to be created with Indonesian language content.

---

## Monorepo Structure

| Option | Description | Selected |
|--------|-------------|----------|
| frontend/ + backend/ at root (Recommended) | frontend/ and backend/ at root, each with own package.json. Vite proxies API to Express in dev. | ✓ |
| apps/ + packages/ structure | apps/frontend, apps/backend, packages/shared — more structure, more complexity | |
| Single package.json, nested folders | Express serves React build in production, separate dev servers | |

**User's choice:** frontend/ + backend/ at root (Recommended)
**Notes:** Simple structure matching project's stated preference. No shared packages for v1.

---

## User Schema & Password

| Option | Description | Selected |
|--------|-------------|----------|
| bcrypt (Recommended) | Industry standard, widely used, good for web apps. bcrypt 6.0 available. | ✓ |
| scrypt | More memory-hard, better against GPU attacks. Slightly slower. | |
| Argon2 | Modern, Argon2id variant recommended. Best resistance to attacks. | |

**User's choice:** bcrypt (Recommended)
**Notes:** Standard choice for web applications. bcrypt 6.0 is current version.

### Email Verification

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — required (Recommended) | Send verification email, account limited until verified. Standard practice. | |
| No — skip for v1 | Skip for v1, add later. Faster to ship. | ✓ |

**User's choice:** No — skip for v1
**Notes:** Email verification deferred to v2. Account active immediately after registration.

---

## Dev Setup

| Option | Description | Selected |
|--------|-------------|----------|
| Docker Compose for MySQL only (Recommended) | docker-compose.yml with MySQL + adminer. Frontend/backend run locally with npm dev (hot reload). | ✓ |
| Full Docker (all services) | Everything in containers — frontend, backend, MySQL. Slower dev cycle but consistent. | |
| No Docker — local install | No Docker for dev. Install MySQL locally, run npm dev directly. | |

**User's choice:** Docker Compose for MySQL only (Recommended)
**Notes:** Only database containerized. Frontend and backend run natively for faster hot reload.

---

## API Dev Communication

| Option | Description | Selected |
|--------|-------------|----------|
| Vite proxy to Express (Recommended) | Vite dev server proxies /api/* to Express backend. Single origin, no CORS issues. | ✓ |
| CORS — separate origins | Backend sends CORS headers, frontend calls backend directly on different port. | |
| Mock Service Worker in dev | Use MSW (Mock Service Worker) in dev, real API in staging/production. | |

**User's choice:** Vite proxy to Express (Recommended)
**Notes:** Simplest dev setup. No CORS configuration needed during development.

---

## the agent's Discretion

- CSRF token implementation details (standard Express CSRF middleware)
- Exact Docker Compose configuration (ports, volumes, network setup)
- Database migration strategy (raw SQL scripts vs migration tool)
- Google OAuth client ID setup process (user must create Google Cloud project)

## Deferred Ideas

- Email verification flow — deferred to v2 (NOTF-01, NOTF-02)
- Password reset functionality — not in v1 requirements, belongs in v2
- Multi-device session management — out of scope for v1
- Cloudflare Tunnel setup for production — belongs in deployment phase
