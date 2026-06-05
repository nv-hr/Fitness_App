/**
 * PublicRoute.jsx
 *
 * Why: Extracted from Router.jsx to isolate the "redirect authenticated users
 * away from login/register" logic. Keeping guards separate makes it trivial
 * to add social-login redirects or post-registration flows later.
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth.jsx';
import Loader from '../../shared/ui/Loader.jsx';

/**
 * Route guard that redirects already-authenticated users to the home page.
 * Renders a loading spinner while the auth state is being determined.
 *
 * @param {object}          props
 * @param {React.ReactNode} props.children - The public-only page to render.
 * @returns {JSX.Element}
 */
export default function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader message="Preparing portal..." />;
  if (user) return <Navigate to="/" replace />;
  return children;
}
