## 1. State Management Update

- [ ] 1.1 Add `const [isPolling, setIsPolling] = useState(false)` to `useMealCalendar.js`.
- [ ] 1.2 Update the derived `isBusy` state to include `isPolling`: `!!(loggingMeal || regeneratingCat || generating || isPolling)`.
- [ ] 1.3 Update `pollForDailyPlan` to set `setIsPolling(true)` when started, and `setIsPolling(false)` on success or timeout.
- [ ] 1.4 Ensure `useMealCalendar` returns the updated lock state to components without breaking existing behavior.

## 2. Verification

- [ ] 2.1 Verify generation UI buttons disable immediately upon click and remain disabled during a 409 Conflict and subsequent polling loop.
- [ ] 2.2 Ensure the generation UI buttons correctly re-enable only when the entire background polling sequence succeeds or encounters a terminal error.
