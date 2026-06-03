import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth.jsx';
import LoginForm from '../features/auth/components/LoginForm.jsx';
import RegisterForm from '../features/auth/components/RegisterForm.jsx';
import ProfileForm from '../features/profile/components/ProfileForm.jsx';
import { FoodLogPage } from '../features/food-log/index.js';
import { ActivityPage } from '../features/activities/index.js';
import { ProgressPage } from '../features/progress/index.js';
import { getProfile } from '../features/profile/api/profileApi.js';
import { BMICalculator, TDEECalculator } from '../features/calculators/index.js';
import { LandingPage } from '../features/landing/index.js';

import { useResponsive } from '../shared/hooks/useResponsive.js';
import { 
  LayoutDashboard, 
  User, 
  Apple, 
  Dumbbell, 
  LineChart, 
  LogOut, 
  Activity,
  ChevronRight,
  TrendingUp,
  Flame,
  Settings,
  HelpCircle,
  Mail,
  UserCheck,
  Scale
} from 'lucide-react';

function Loader({ message = 'Loading health system...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute w-6 h-6 bg-emerald-100 rounded-full animate-ping opacity-75"></div>
      </div>
      <p className="mt-5 text-slate-500 text-sm font-medium tracking-wide animate-pulse">{message}</p>
    </div>
  );
}

function ResponsiveLayout({ children }) {
  const { isMobile } = useResponsive();
  const { user, logout } = useAuth();
  const location = useLocation();

  const [profileMissing, setProfileMissing] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    if (user) {
      getProfile()
        .then((res) => {
          const p = res?.data?.profile;
          if (!p || !p.weight_kg || !p.height_cm || !p.age || !p.gender) {
            setProfileMissing(true);
          } else {
            setProfileMissing(false);
          }
          setCheckingProfile(false);
        })
        .catch(() => {
          setProfileMissing(true);
          setCheckingProfile(false);
        });
    } else {
      setCheckingProfile(false);
      setProfileMissing(false);
    }
  }, [user]);

  const handleProfileSaveSuccess = () => {
    setProfileMissing(false);
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/bmi', label: 'BMI Calculator', icon: Scale },
    { path: '/tdee', label: 'TDEE Calculator', icon: Flame },
    { path: '/food-log', label: 'Food Tracker', icon: Apple },
    { path: '/activities', label: 'Activities', icon: Activity },
    { path: '/progress', label: 'Progress', icon: LineChart },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '#', label: 'About', icon: HelpCircle, dummy: true },
    { path: '#', label: 'Contact', icon: Mail, dummy: true },
  ];

  // For unauthenticated flow — landing page is full-bleed,
  // login / register get the centred card wrapper.
  if (!user) {
    const isAuthForm = location.pathname === '/login' || location.pathname === '/register';
    if (!isAuthForm) {
      return <>{children}</>;
    }
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center items-center gap-2 mb-2">
            <div className="p-2 bg-emerald-500 rounded-xl shadow-md text-white">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-white">
              Fit<span className="text-emerald-500">Life</span>
            </span>
          </div>
        </div>
        <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white/80 backdrop-blur-md py-8 px-4 shadow-lux rounded-2xl border border-slate-200/50 sm:px-10">
            {children}
          </div>
        </div>
      </div>
    );
  }

  if (checkingProfile) {
    return <Loader message="Verifying profile completion..." />;
  }

  return (
    <div className="min-h-screen bg-[#121212] font-sans flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-[#801414] border-b border-[#991b1b]/30 shadow-md">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <Activity className="w-5 h-5 text-white" />
              <span className="font-display font-extrabold text-xl tracking-tight text-white">
                Fit<span className="font-light">Life</span>
              </span>
            </Link>

            {/* Header Right Action Items */}
            <div className="flex items-center gap-4">
              {!isMobile && (
                <div className="text-right text-white">
                  <p className="text-[10px] opacity-75">Logged in as</p>
                  <p className="text-xs font-semibold max-w-[150px] truncate">{user?.email}</p>
                </div>
              )}
              <button
                className="text-white hover:opacity-80 transition-opacity cursor-pointer"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={logout}
                className="flex items-center justify-center p-2 rounded-xl text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Grid / Flex */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Sidebar on desktop */}
        {!isMobile ? (
          <aside className="w-64 bg-[#151515] border-r border-[#222] flex flex-col justify-between py-6 shrink-0">
            <nav className="flex flex-col space-y-1 px-3">
              {navItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = item.dummy ? false : (
                  (item.path === '/' && location.pathname === '/') ||
                  (item.path !== '/' && location.pathname.startsWith(item.path))
                );
                return (
                  <Link
                    key={idx}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-500 text-white font-semibold shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="px-6 pt-4 border-t border-[#222]">
              <p className="text-[10px] text-slate-500">© FitLife App</p>
            </div>
          </aside>
        ) : (
          /* Mobile Navigation */
          <div className="w-full border-b border-[#222] bg-[#1a1a1a] overflow-x-auto scrollbar-none flex px-4 py-2 space-x-2">
            {navItems.filter(item => !item.dummy).map((item, idx) => {
              const Icon = item.icon;
              const isActive = (item.path === '/' && location.pathname === '/') ||
                (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={idx}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                    isActive
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-400 bg-[#222] hover:bg-[#333]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 bg-[#121212] py-8 px-4 sm:px-6 lg:px-8">
          <div>
            {children}
          </div>
        </main>
      </div>

      {/* Biometrics overlay modal */}
      {profileMissing && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#181818] border border-[#2d2d2d] rounded-3xl max-w-5xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="mb-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-500 mb-3">
                <UserCheck className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="font-display font-extrabold text-2xl text-white">Complete Your Health Profile</h2>
              <p className="text-slate-400 text-xs mt-1">
                Please enter your biometrics below to unlock the features of FitLife.
              </p>
            </div>
            <ProfileForm onSaveSuccess={handleProfileSaveSuccess} isOverlay={true} />
          </div>
        </div>
      )}
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader message="Verifying authentication..." />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/**
 * HomeRoute — renders the marketing LandingPage for unauthenticated
 * visitors and the authenticated dashboard for logged-in users.
 * Why: keeps '/' as the single entry point for everyone while
 * avoiding a redirect loop between '/' and '/login'.
 */
function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Loader message="Loading..." />;
  if (!user) return <LandingPage />;
  return <ProfileGuard><DashboardPlaceholder /></ProfileGuard>;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader message="Preparing portal..." />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function ProfileGuard({ children }) {
  return children;
}

function DashboardPlaceholder() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile()
      .then((data) => {
        setProfile(data.data.profile);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const shortcuts = [
    {
      to: '/profile',
      title: 'Profile & TDEE Advice',
      desc: 'Update your biometrics, calorie target, and calculate BMI precisely.',
      icon: User,
      color: 'from-emerald-500 to-teal-500',
      badge: 'Health Goal'
    },
    {
      to: '/food-log',
      title: 'Calorie & Food Logs',
      desc: 'Easily track daily intake and manage your calorie budget.',
      icon: Apple,
      color: 'from-amber-500 to-orange-500',
      badge: 'Calorie Deficit'
    },
    {
      to: '/activities',
      title: 'Workout Recommendations',
      desc: 'Get customized weekly AI workout plans matching your biometrics.',
      icon: Dumbbell,
      color: 'from-blue-500 to-indigo-500',
      badge: 'Fat Burn'
    },
    {
      to: '/progress',
      title: 'Weight Progress Charts',
      desc: 'Monitor long-term weight fluctuations and achieve your ideal weight.',
      icon: LineChart,
      color: 'from-violet-500 to-purple-500',
      badge: 'Metrics Chart'
    }
  ];

  if (loading) {
    return <Loader message="Connecting biometrics profile..." />;
  }

  const welcomeName = profile?.name || user?.email?.split('@')[0] || 'Member';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-elevated border border-slate-800">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Activity className="w-64 h-64" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight">
            Welcome, <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">{welcomeName}</span>! 👋
          </h1>
          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            Let's make progress today! Track your food intake, follow daily workout recommendations, and maintain a healthy lifestyle.
          </p>

          {/* Quick Stats Grid inside Hero */}
          {profile && (
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-slate-700/50 pt-6">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Actual Weight</p>
                <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{profile.weight_kg} <span className="text-xs font-sans text-slate-300">kg</span></p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Biometric BMI</p>
                <p className="text-xl font-bold font-mono text-teal-400 mt-1">
                  {((profile.weight_kg / ((profile.height_cm / 100) * (profile.height_cm / 100))) || 0).toFixed(1)}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Target Calories / TDEE</p>
                <p className="text-xl font-bold font-mono text-amber-400 mt-1">{Math.round(profile.tdee || 2000)} <span className="text-xs font-sans text-slate-300 font-mono font-sans text-slate-300">kcal</span></p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Menu Sections Grid header */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="font-display font-bold text-2xl text-slate-800 tracking-tight">Explore Health Features</h2>
            <p className="text-sm text-slate-500">Choose a tracker module below to start logging your daily progress.</p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-slate-400 text-xs">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Planned Performance</span>
          </div>
        </div>

        {/* Shortcuts Bento-Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {shortcuts.map((shortcut, idx) => {
            const Icon = shortcut.icon;
            return (
              <Link
                key={shortcut.to}
                to={shortcut.to}
                className="group relative flex flex-col justify-between p-6 bg-white rounded-2xl border border-slate-200/50 shadow-lux hover:shadow-elevated hover:border-emerald-200 transition-all cursor-pointer overflow-hidden"
              >
                {/* Background glowing touch on hover */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform duration-500 ease-out pointer-events-none z-0"></div>

                <div className="relative z-10 flex gap-4 items-start">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${shortcut.color} text-white shadow-md group-hover:scale-105 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                        {shortcut.badge}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-lg text-slate-800 group-hover:text-emerald-600 transition-colors pt-1.5">
                      {shortcut.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed pt-0.5">
                      {shortcut.desc}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 flex justify-end items-center text-xs font-semibold text-slate-400 group-hover:text-emerald-500 transition-colors mt-4 pt-4 border-t border-slate-100">
                  <span>Get Started</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Router() {
  return (
    <BrowserRouter>
      <ResponsiveLayout>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginForm /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterForm /></PublicRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfileForm /></ProtectedRoute>} />
          <Route path="/bmi" element={<ProtectedRoute><BMICalculator /></ProtectedRoute>} />
          <Route path="/tdee" element={<ProtectedRoute><TDEECalculator /></ProtectedRoute>} />
          <Route path="/food-log" element={<ProtectedRoute><FoodLogPage /></ProtectedRoute>} />
          <Route path="/meal-calendar" element={<Navigate to="/food-log" replace />} />
          <Route path="/activities" element={<ProtectedRoute><ActivityPage /></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
          <Route path="/" element={<HomeRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ResponsiveLayout>
    </BrowserRouter>
  );
}
