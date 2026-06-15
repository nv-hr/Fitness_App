## 1. Backend Implementation

- [x] 1.1 Add `activeGenerations` Map to `llm.service.js`
- [x] 1.2 Implement lock checking in `generateWeeklyPlan`
- [x] 1.3 Add a `finally` block to `generateWeeklyPlan` to release the lock
- [x] 1.4 Implement lock checking in `generateDailyPlan`
- [x] 1.5 Add a `finally` block to `generateDailyPlan` to release the lock
- [x] 1.6 Ensure a 409 Conflict error is returned when a lock collision occurs

## 2. Frontend Handling

- [x] 2.1 Update frontend generation API calls to handle 409 Conflict errors gracefully
- [x] 2.2 Implement "Smart Polling" logic on 409: set a polling state and ping the backend every ~3 seconds
- [x] 2.3 Stop polling and update UI when backend returns 200 OK (plan generated)
- [x] 2.4 Add a reasonable timeout (e.g., 60 seconds) to stop polling if the generation gets stuck
