import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth.js';
import LoginForm from '../features/auth/components/LoginForm.jsx';
import RegisterForm from '../features/auth/components/RegisterForm.jsx';
import ProfileForm from '../features/profile/components/ProfileForm.jsx';
import { FoodLogPage } from '../features/food-log/index.js';
import { getProfile } from '../features/profile/api/profileApi.js';
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

function ProfileGuard({ children }) {
  const [checked, setChecked] = useState(false);
  const [hasProfile, setHasProfile] = useState(true);

  useEffect(() => {
    getProfile()
      .then(() => { setHasProfile(true); setChecked(true); })
      .catch(() => { setHasProfile(false); setChecked(true); });
  }, []);

  if (!checked) return <div>{t('auth.loading')}</div>;
  if (!hasProfile) return <Navigate to="/profile" />;
  return children;
}

function DashboardPlaceholder() {
  const { user, logout } = useAuth();
  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '1rem', textAlign: 'center' }}>
      <h2>{t('auth.welcome')}, {user?.email}</h2>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
        <Link to="/profile" style={{ padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: '4px', textDecoration: 'none', color: '#333' }}>
          {t('profile.title')}
        </Link>
        <Link to="/food-log" style={{ padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: '4px', textDecoration: 'none', color: '#333' }}>
          {t('foodLog.title')}
        </Link>
      </div>
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
        <Route path="/profile" element={<ProtectedRoute><ProfileForm /></ProtectedRoute>} />
        <Route path="/food-log" element={<ProtectedRoute><FoodLogPage /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><ProfileGuard><DashboardPlaceholder /></ProfileGuard></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
