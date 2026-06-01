import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth.jsx';
import LoginForm from '../features/auth/components/LoginForm.jsx';
import RegisterForm from '../features/auth/components/RegisterForm.jsx';
import ProfileForm from '../features/profile/components/ProfileForm.jsx';
import { FoodLogPage } from '../features/food-log/index.js';
import { ActivityPage } from '../features/activities/index.js';
import { ProgressPage } from '../features/progress/index.js';
import { getProfile } from '../features/profile/api/profileApi.js';

import { useResponsive } from '../shared/hooks/useResponsive.js';

function ResponsiveLayout({ children }) {
  const { isMobile } = useResponsive();
  return (
    <div style={{
      maxWidth: isMobile ? '100%' : '600px',
      margin: '0 auto',
      padding: isMobile ? '1rem' : '2rem 1rem',
      minHeight: '100vh',
    }}>
      {children}
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>{'Loading...'}</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>{'Loading...'}</div>;
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

  if (!checked) return <div>{'Loading...'}</div>;
  if (!hasProfile) return <Navigate to="/profile" />;
  return children;
}

function DashboardPlaceholder() {
  const { user, logout } = useAuth();
  const { isMobile } = useResponsive();
  return (
    <div style={{ maxWidth: isMobile ? '100%' : '400px', margin: '2rem auto', padding: '1rem', textAlign: 'center' }}>
      <h2>{'Welcome'}, {user?.email}</h2>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center' }}>
        <Link to="/profile" style={{ padding: '0.75rem 1rem', border: '1px solid #ccc', borderRadius: '4px', textDecoration: 'none', color: '#333', minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}>
          {'Profile, BMI & TDEE'}
        </Link>
        <Link to="/food-log" style={{ padding: '0.75rem 1rem', border: '1px solid #ccc', borderRadius: '4px', textDecoration: 'none', color: '#333', minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}>
          {'Log Food'}
        </Link>
        <Link to="/progress" style={{ padding: '0.75rem 1rem', border: '1px solid #ccc', borderRadius: '4px', textDecoration: 'none', color: '#333', minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}>
          {'Progress'}
        </Link>
        <Link to="/activities" style={{ padding: '0.75rem 1rem', border: '1px solid #ccc', borderRadius: '4px', textDecoration: 'none', color: '#333', minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}>
          {'Activity Recommendations'}
        </Link>
      </div>
      <button onClick={logout} style={{ padding: '0.75rem 1rem', minHeight: '44px', cursor: 'pointer' }}>{'Sign Out'}</button>
    </div>
  );
}

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<ResponsiveLayout><PublicRoute><LoginForm /></PublicRoute></ResponsiveLayout>} />
        <Route path="/register" element={<ResponsiveLayout><PublicRoute><RegisterForm /></PublicRoute></ResponsiveLayout>} />
        <Route path="/profile" element={<ResponsiveLayout><ProtectedRoute><ProfileForm /></ProtectedRoute></ResponsiveLayout>} />
        <Route path="/food-log" element={<ResponsiveLayout><ProtectedRoute><FoodLogPage /></ProtectedRoute></ResponsiveLayout>} />
        <Route path="/meal-calendar" element={<Navigate to="/food-log" replace />} />
        <Route path="/activities" element={<ResponsiveLayout><ProtectedRoute><ActivityPage /></ProtectedRoute></ResponsiveLayout>} />
        <Route path="/progress" element={<ResponsiveLayout><ProtectedRoute><ProgressPage /></ProtectedRoute></ResponsiveLayout>} />
        <Route path="/" element={<ResponsiveLayout><ProtectedRoute><ProfileGuard><DashboardPlaceholder /></ProfileGuard></ProtectedRoute></ResponsiveLayout>} />
      </Routes>
    </BrowserRouter>
  );
}
