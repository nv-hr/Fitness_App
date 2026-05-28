---
quick_id: 260528-l8c
status: complete
date: 2026-05-28
commit: 81753c6
---

# Quick Task: Update backend/.env.example

**Date:** 2026-05-28
**Commit:** 81753c6

## What Was Done

Added missing env vars to `backend/.env.example`:
- `PORT` — server port (default 3001)
- `GOOGLE_CALLBACK_URL` — OAuth redirect URL
- `DATABASE_URL_TEST` — integration test isolation schema
- Smoke test vars (commented): `SMOKE_IMAGE_TAG`, `SKIP_DOCKER_BUILD`, `SMOKE_PORT`
