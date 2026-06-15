## Context

The `/change-password` page is currently rendered within the dashboard layout wrapper, which includes the dashboard top bar and left navigation. The auth pages (login, register) use a simpler, centered layout. The goal is to bring the `/change-password` page into alignment with the auth pages to improve UX and focus.

## Goals / Non-Goals

**Goals:**
- Render the `/change-password` page using the authentication layout instead of the dashboard layout.
- Ensure any container classes on the `ChangePassword` component fit seamlessly into the new layout without breaking styling.

**Non-Goals:**
- Completely redesigning the form fields or changing the underlying authentication logic.
- Affecting other dashboard pages.

## Decisions

- **Routing Change**: Update the routing setup in `Router.jsx` to move the `/change-password` route out of `<AppShell>` and into `<AuthLayout>`, while keeping it within `<ProtectedRoute>` and `<PasswordGuard>`.
- **Styling**: Strip the inner card and container styling (e.g., `bg-[#1a1a1a]`, `border`, `shadow-lux`) from `ChangePasswordPage.jsx`. `<AuthLayout>` already provides the card UI, so `ChangePasswordPage` should just render its form contents exactly like `LoginForm` and `RegisterForm`.
- **Navigation Flow**: Change the post-success redirect to `/dashboard` instead of `/settings`, and update the "Back" link to point to the Dashboard.

## Risks / Trade-offs

- **Risk**: Moving the route breaks the expected flow if the user was inside settings.
  - **Mitigation**: As decided, the flow will consistently resolve by taking the user back to the `/dashboard`, which provides a clean slate after a major security action.
