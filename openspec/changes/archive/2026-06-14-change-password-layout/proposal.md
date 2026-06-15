## Why

The `/change-password` page currently uses the dashboard layout, which includes a top bar and left navigation bar. This creates a disjointed user experience. It should use the authentication layout (similar to login/register) to maintain consistency and focus the user on the password change task.

## What Changes

- Update the layout wrapper for the `/change-password` route to use the authentication layout instead of the dashboard layout.
- Ensure the password change form styling aligns with the login and register pages.

## Capabilities

### New Capabilities
None

### Modified Capabilities
None

## Impact

- Frontend routing configuration and layout selection for the `/change-password` page.
- Minor styling adjustments to the `ChangePassword` component to fit the auth layout containers.
