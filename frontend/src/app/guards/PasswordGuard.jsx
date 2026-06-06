/**
 * PasswordGuard.jsx
 *
 * Why: A dedicated route guard (middleware) that checks if an authenticated user
 * has a password set. If not, they are automatically redirected to the password
 * setup page. If they already have a password set, they can proceed.
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth.jsx';
import Loader from '../../shared/ui/Loader.jsx';

/**
 * Route guard that redirects authenticated users without a password to /setup-password.
 *
 * @param {object}          props
 * @param {React.ReactNode} props.children - The protected page to render.
 * @returns {JSX.Element}
 */
export default function PasswordGuard({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Loader message="Verifying security status..." />;
  
  // If not logged in, let the ProtectedRoute guard handle it.
  if (!user) return children;

  console.log('PasswordGuard check - user:', user);

  // If logged in but lacks a password, redirect to setup page.
  if (user.has_password === false || user.has_password === 'false' || user.has_password === null || user.has_password === undefined) {
    return <Navigate to="/setup-password" replace />;
  }

  return children;
}

