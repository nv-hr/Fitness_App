# Phase 43: Weight Logging & Goal Setting - Context

**Gathered:** 2026-06-01
**Status:** Ready for planning
**Mode:** Smart discuss (auto-accepted)

<domain>
## Phase Boundary

Users can log weight entries and set weight goals with target date; weight auto-logs on profile updates.

Deliverables:
- Weight logging backend API (POST, GET, DELETE)
- Goal fields in profile form (target_weight_kg, target_date)
- Auto-log weight on profile update (non-blocking)
- Weight history display with source badges
- Goal validation server-side (range, date, direction)
- Initial weight seed on profile creation

</domain>

<decisions>
## Implementation Decisions

### Backend API Design
- Weight logging endpoint: `POST /api/progress/weight` — follows food/activity REST pattern
- Weight history endpoint: `GET /api/progress/weight?limit=N` — returns list sorted DESC with source badges
- Weight delete endpoint: `DELETE /api/progress/weight/:id` — follows existing pattern
- Auto-log integration point: In `profile.service.js` — after profile update succeeds (non-blocking, catches errors)
- New repository: `backend/src/repositories/weightLog.repository.js` following existing pattern

### Frontend — Progress Page Structure
- Weight/goal UI lives on new `/progress` page (components created in Phase 43, dashboard assembled in Phase 45)
- Weight entry form: inline card with date picker + weight input + notes
- Weight history display: table with Date, Weight, Source badge, Delete button — sorted DESC
- Goal fields: Add `targetWeightKg` + `targetDate` fields at bottom of existing ProfileForm

### Data Flow & Validation
- Auto-log after `updateProfile` success in service layer — weight_log INSERT fires after profile UPDATE succeeds
- Auto-log on profile create: seed initial weight entry
- Goal validation: in `profile.service.js` via Zod — `targetWeightKg` 2-300kg, `targetDate >= today`, direction check
- Weight logging via new `weightLog.repository.js`

### The Agent's Discretion
- Exact limit parameter for GET endpoint
- Styling details of the weight entry card
- Date picker implementation approach
- Loading/error state UX patterns

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ProfileForm.jsx` — existing React Hook Form pattern with Zod schema
- `ProfileApi.js` — existing profile API calls (can extend for weight logging)
- `FoodLogForm.jsx` — food log entry form pattern (inline card with date, inputs)
- `foodLogApi.js` — existing API pattern for POST/GET/DELETE
- `profile.service.js` — existing service pattern, extension point for auto-log
- `profile.controller.js` — existing controller pattern

### Established Patterns
- Route: backend/src/routes/ → Controller → Service → Repository
- Frontend: feature/api/ → React Query or direct API calls
- Forms: React Hook Form + Zod resolver + @hookform/resolvers
- Styling: Inline styles (no CSS framework)
- Data fetching: Direct API calls via shared http.js

### Integration Points
- `backend/src/routes/profile.routes.js` — add progress/weight routes
- `frontend/src/features/profile/components/ProfileForm.jsx` — add goal fields
- `backend/src/services/profile.service.js` — add auto-log hook
- New route file: `backend/src/routes/progress.routes.js`

</code_context>

<specifics>
## Specific Ideas

- Follow existing controller/service/repository pattern for weight logging
- ProfileForm already has weightKg field — auto-log when this changes
- Goal fields go at the bottom of profile form (after calorieRate)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
