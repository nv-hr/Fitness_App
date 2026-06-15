/**
 * Router.jsx — Application routing configuration.
 *
 * Why: This file is intentionally kept to routing concerns only.
 * Layout (AppShell, AuthLayout), route guards (ProtectedRoute, PublicRoute),
 * and the dashboard page all live in their own focused files.
 *
 * HomeRoute is kept here because it needs awareness of both auth state and
 * routing simultaneously — it is genuinely a routing concern, not a page.
 */

import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth.jsx';

// Layout wrappers
import AppShell   from './layout/AppShell.jsx';
import AuthLayout from './layout/AuthLayout.jsx';

// Route guards
import ProtectedRoute from './guards/ProtectedRoute.jsx';
import PublicRoute    from './guards/PublicRoute.jsx';
import PasswordGuard  from './guards/PasswordGuard.jsx';

// Shared UI
import Loader from '../shared/ui/Loader.jsx';

// Feature pages
import { LoginForm, RegisterForm, SetupPassword } from '../features/auth/index.js';
import { ProfileForm }  from '../features/profile/index.js';
import { DashboardPage }              from '../features/dashboard/index.js';
import { FoodLogPage }                from '../features/food-log/index.js';
import { ActivityPage }               from '../features/activities/index.js';
import { ProgressPage }               from '../features/progress/index.js';
import { BMICalculator, TDEECalculator } from '../features/calculators/index.js';
import { LandingPage }                from '../features/landing/index.js';
import { SettingsPage, ChangePasswordPage } from '../features/settings/index.js';

/**
 * Renders the landing page for guests and the dashboard for authenticated users.
 * Kept in Router.jsx because it straddles auth state and routing simultaneously.
 *
 * @returns {JSX.Element}
 */
function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Loader message="Loading..." />;
  if (!user) return <LandingPage />;
  if (user.has_password === false || user.has_password === 'false' || user.has_password === null || user.has_password === undefined) {
    return <Navigate to="/setup-password" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}


/**
 * Root router. Wraps every authenticated route in AppShell and every
 * auth form in AuthLayout.
 *
 * @returns {JSX.Element}
 */
export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth forms — centred card layout */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <AuthLayout><LoginForm /></AuthLayout>
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <AuthLayout><RegisterForm /></AuthLayout>
            </PublicRoute>
          }
        />

        {/* Set Password Flow (Only accessible if logged in AND has no password) */}
        <Route
          path="/setup-password"
          element={
            <ProtectedRoute>
              {/* If they already have a password, redirect them away to dashboard */}
              <HasPasswordRedirect>
                <AuthLayout><SetupPassword /></AuthLayout>
              </HasPasswordRedirect>
            </ProtectedRoute>
          }
        />

        {/* Change Password Flow (AuthLayout instead of AppShell) */}
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <PasswordGuard>
                <AuthLayout><ChangePasswordPage /></AuthLayout>
              </PasswordGuard>
            </ProtectedRoute>
          }
        />

        {/* Protected app pages — full authenticated shell wrapped in PasswordGuard */}
        <Route
          element={
            <ProtectedRoute>
              <PasswordGuard>
                <AppShell>
                  <Outlet />
                </AppShell>
              </PasswordGuard>
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfileForm />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/bmi" element={<BMICalculator />} />
          <Route path="/tdee" element={<TDEECalculator />} />
          <Route path="/food-log" element={<FoodLogPage />} />
          <Route path="/activities" element={<ActivityPage />} />
          <Route path="/progress" element={<ProgressPage />} />
        </Route>

        {/* Redirect legacy meal-calendar path */}
        <Route path="/meal-calendar" element={<Navigate to="/food-log" replace />} />

        {/* Home: landing for guests, dashboard for authenticated users */}
        <Route
          path="/"
          element={<HomeRoute />}
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

/**
 * Redirects users who already have a password away from /setup-password.
 */
function HasPasswordRedirect({ children }) {
  const { user } = useAuth();
  if (user && user.has_password !== false && user.has_password !== 'false' && user.has_password !== null && user.has_password !== undefined) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}


