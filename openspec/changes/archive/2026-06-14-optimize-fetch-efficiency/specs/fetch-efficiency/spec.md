## ADDED Requirements

### Requirement: Unified Food Log Fetching
The system SHALL unify initial and mutation-based fetching in the food log to avoid triplicating network requests.

#### Scenario: Food log mount
- **WHEN** the food log component mounts
- **THEN** it fetches daily logs, recent foods, and history exactly once.

#### Scenario: Food log mutation
- **WHEN** the user logs or deletes a food item
- **THEN** only the daily logs and daily summary are refetched, while history remains cached and recent foods is only refetched on a new log.

### Requirement: Calendar Fetch Optimization
The system SHALL NOT use blind short-interval polling for the activity and meal calendars, utilizing SSE or exponential backoff instead.

#### Scenario: Wait for weekly plan generation
- **WHEN** the backend returns a 409 indicating plan generation is in progress
- **THEN** the frontend utilizes Server-Sent Events (SSE) or exponential backoff to await the result rather than polling at a static 3-second interval.

### Requirement: Weekly Plan Caching
The system SHALL cache weekly plan payloads on the frontend to avoid re-fetching when navigating between days within the same week.

#### Scenario: Intra-week navigation
- **WHEN** the user navigates to a different day within the currently loaded week
- **THEN** the weekly plan is read from the frontend cache without triggering a new backend request.

### Requirement: Contextual Health System Updates
The system SHALL dispatch typed health system updates to prevent unrelated components from unnecessarily re-fetching data.

#### Scenario: Selective listener refresh
- **WHEN** a `health-system-update` event with `detail: { type: 'food-log' }` is dispatched
- **THEN** only the food-related hooks refresh their data, while activity calendars ignore the event.

### Requirement: Combined Daily Food Endpoint
The backend SHALL expose a combined endpoint that returns both daily food logs and the daily summary to halve the number of round-trips.

#### Scenario: Fetching daily food data
- **WHEN** the frontend requests daily food data on load
- **THEN** a single `GET /api/food/daily` request returns both the logs array and the summary data.

### Requirement: Backend Profile Caching
The backend SHALL cache the user profile in-memory for a short duration to prevent redundant database lookups during concurrent summary queries.

#### Scenario: Concurrent summary fetches
- **WHEN** the food summary and activity summary are requested simultaneously on page load
- **THEN** the profile is fetched from the database once, and the concurrent request reads it from the in-memory cache.
