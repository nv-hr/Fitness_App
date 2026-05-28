---
id: 260528-ksa
type: quick
description: Convert log_date to local timezone date string instead of UTC-based toISOString
autonomous: true
depends_on: []
files_modified:
  - backend/src/repositories/food.repository.js
---

<objective>
The previous fix (260528-kj4) used `.toISOString().split('T')[0]` to normalize `log_date` to YYYY-MM-DD. But `.toISOString()` converts to UTC, causing date shift for Indonesian users in UTC+7 (e.g., `2026-05-28` local becomes `2026-05-27` in UTC). Fix by using `toLocaleDateString('en-CA')` which produces YYYY-MM-DD in the local timezone.
</objective>

<tasks>

<task type="auto">
  <name>Task 1: Replace UTC toISOString with local-timezone en-CA formatting</name>
  <files>backend/src/repositories/food.repository.js</files>
  <action>
    In `backend/src/repositories/food.repository.js`, change the `.toISOString().split('T')[0]` to `.toLocaleDateString('en-CA')`:
    
    Current:
    ```js
    return rows.map(r => ({ ...r, log_date: r.log_date.toISOString().split('T')[0] }));
    ```
    
    New:
    ```js
    return rows.map(r => ({ ...r, log_date: r.log_date.toLocaleDateString('en-CA') }));
    ```
    
    `en-CA` locale produces `YYYY-MM-DD` format while respecting the machine's local timezone (not UTC).
  </action>
  <done>
    - `getLogHistory` returns `log_date` as `YYYY-MM-DD` string in local timezone
    - No date shift for Indonesian users (UTC+7)
  </done>
</task>

</tasks>

<verification>
- [ ] grep shows `toLocaleDateString('en-CA')` in food.repository.js, no longer has `toISOString().split('T')[0]`
- [ ] Backend tests still pass
</verification>

<success_criteria>
- `log_date` in API responses matches the local date (not shifted by timezone)
- Backend tests pass
</success_criteria>
