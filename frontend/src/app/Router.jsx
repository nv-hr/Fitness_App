import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth.js';
import LoginForm from '../features/auth/components/LoginForm.jsx';
import RegisterForm from '../features/auth/components/RegisterForm.jsx';
import { t } from './shared/i18n/translations.js';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>{t('auth.loading')}</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>{t('auth.loading')}</div>;
  if (user) return <Navigate to="/" />;
  return children;
}

function DashboardPlaceholder() {
  const { user, logout } = useAuth();
  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '1rem', textAlign: 'center' }}>
      <h2>{t('auth.welcome')}, {user?.email}</h2>
      <button onClick={logout} style={{ padding: '0.5rem 1rem' }}>{t('auth.logout')}</button>
    </div>
  );
}

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginForm /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterForm /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><DashboardPlaceholder /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
