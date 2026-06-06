/**
 * ProtectedRoute.jsx
 *
 * Why: Extracted from Router.jsx so that guard logic lives in its own
 * focused file. This makes it easy to add role-based checks or token
 * refresh logic without touching routing configuration.
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth.jsx';
import Loader from '../../shared/ui/Loader.jsx';

/**
 * Route guard that redirects unauthenticated users to /login.
 * Renders a loading spinner while the auth state is being determined.
 *
 * @param {object}          props
 * @param {React.ReactNode} props.children - The protected page to render.
 * @returns {JSX.Element}
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader message="Verifying authentication..." />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}


