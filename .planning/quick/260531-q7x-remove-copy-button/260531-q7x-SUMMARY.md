---
type: quick
status: complete
description: Remove Copy Plan button from activity front end
created: 2026-05-31
---

## Summary

Removed the "Copy Plan" button and all related code from ActivityPlanSection.jsx:
- Removed `copied` state variable
- Removed `handleCopyPlan` function (clipboard write + fallback)
- Removed Copy Plan button JSX
