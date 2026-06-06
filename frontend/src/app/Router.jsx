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

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth.jsx';

// Layout wrappers
import AppShell   from './layout/AppShell.jsx';
import AuthLayout from './layout/AuthLayout.jsx';

// Route guards
import ProtectedRoute from './guards/ProtectedRoute.jsx';
import PublicRoute    from './guards/PublicRoute.jsx';

// Shared UI
import Loader from '../shared/ui/Loader.jsx';

// Feature pages
import LoginForm    from '../features/auth/components/LoginForm.jsx';
import RegisterForm from '../features/auth/components/RegisterForm.jsx';
import ProfileForm  from '../features/profile/components/ProfileForm.jsx';
import { DashboardPage }              from '../features/dashboard/index.js';
import { FoodLogPage }                from '../features/food-log/index.js';
import { ActivityPage }               from '../features/activities/index.js';
import { ProgressPage }               from '../features/progress/index.js';
import { BMICalculator, TDEECalculator } from '../features/calculators/index.js';
import { LandingPage }                from '../features/landing/index.js';

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
  return <AppShell><DashboardPage /></AppShell>;
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

        {/* Protected app pages — full authenticated shell */}
        <Route
          path="/profile"
          element={<ProtectedRoute><AppShell><ProfileForm /></AppShell></ProtectedRoute>}
        />
        <Route
          path="/bmi"
          element={<ProtectedRoute><AppShell><BMICalculator /></AppShell></ProtectedRoute>}
        />
        <Route
          path="/tdee"
          element={<ProtectedRoute><AppShell><TDEECalculator /></AppShell></ProtectedRoute>}
        />
        <Route
          path="/food-log"
          element={<ProtectedRoute><AppShell><FoodLogPage /></AppShell></ProtectedRoute>}
        />
        <Route
          path="/activities"
          element={<ProtectedRoute><AppShell><ActivityPage /></AppShell></ProtectedRoute>}
        />
        <Route
          path="/progress"
          element={<ProtectedRoute><AppShell><ProgressPage /></AppShell></ProtectedRoute>}
        />

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
