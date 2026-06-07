/**
 * DashboardPage.jsx
 *
 * Why: The "DashboardPlaceholder" was an anonymous component inside Router.jsx
 * mixed in with routing config. Moving it here gives the dashboard its own
 * feature directory, making it easy to add sub-routes, a dedicated hook, or
 * a real data layer later.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth.jsx';
import { getProfile } from '../../profile/api/profileApi.js';
import Loader from '../../../shared/ui/Loader.jsx';
import OnboardingModal from './OnboardingModal.jsx';
import {
  User,
  Apple,
  Dumbbell,
  LineChart,
  Activity,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

/** Quick-access cards shown on the dashboard. */
const SHORTCUTS = [
  {
    to: '/profile',
    title: 'Profile & TDEE Advice',
    desc: 'Update your biometrics, calorie target, and calculate BMI precisely.',
    icon: User,
    color: 'from-emerald-500 to-teal-500',
    badge: 'Health Goal',
  },
  {
    to: '/food-log',
    title: 'Calorie & Food Logs',
    desc: 'Easily track daily intake and manage your calorie budget.',
    icon: Apple,
    color: 'from-amber-500 to-orange-500',
    badge: 'Calorie Deficit',
  },
  {
    to: '/activities',
    title: 'Workout Recommendations',
    desc: 'Get customized weekly AI workout plans matching your biometrics.',
    icon: Dumbbell,
    color: 'from-blue-500 to-indigo-500',
    badge: 'Fat Burn',
  },
  {
    to: '/progress',
    title: 'Weight Progress Charts',
    desc: 'Monitor long-term weight fluctuations and achieve your ideal weight.',
    icon: LineChart,
    color: 'from-violet-500 to-purple-500',
    badge: 'Metrics Chart',
  },
];

/**
 * The authenticated home/dashboard page.
 * Fetches the user's profile to show a personalised welcome banner and
 * quick-stat grid, then renders shortcut cards for each feature.
 *
 * @returns {JSX.Element}
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    getProfile()
      .then((data) => setProfile(data.data.profile))
      .catch(() => {/* profile may not exist yet */})
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  useEffect(() => {
    const handleUpdate = () => {
      setRefreshTrigger((prev) => prev + 1);
    };
    window.addEventListener('health-system-update', handleUpdate);
    return () => {
      window.removeEventListener('health-system-update', handleUpdate);
    };
  }, []);

  if (loading) {
    return <Loader message="Connecting biometrics profile..." />;
  }

  const needsOnboarding = !profile;

  const welcomeName = profile?.name || user?.email?.split('@')[0] || 'Member';
  const bmi = profile
    ? (profile.weight_kg / ((profile.height_cm / 100) ** 2)).toFixed(1)
    : null;

  return (
    <>
      {needsOnboarding && (
        <OnboardingModal onSaveSuccess={(newProfile) => setProfile(newProfile)} />
      )}
      <div className="space-y-8 animate-fade-in">
        {/* ── Hero Welcome Banner ── */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-10 shadow-elevated border border-[#2a2a2a]"
        style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #1f1516 50%, #1a1a1a 100%)' }}
      >
        {/* Decorative crimson glow */}
        <div
          className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #b91c1c 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
        />
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Activity className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <h1
            className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight"
            style={{ color: '#fff' }}
          >
            Welcome, <span className="bg-gradient-to-r from-red-400 to-rose-300 bg-clip-text text-transparent">{welcomeName}</span>! 👋
          </h1>
          <p className="mt-3 text-[#a3a3a3] text-sm sm:text-base leading-relaxed">
            Let's make progress today! Track your food intake, follow daily workout recommendations, and maintain a healthy lifestyle.
          </p>

          {/* Quick stats */}
          {profile && (
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-[#2d2d2d] pt-6">
              <div>
                <p className="text-xs text-[#8c8c8c] uppercase tracking-wider">Actual Weight</p>
                <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
                  {profile.weight_kg} <span className="text-xs font-sans text-[#8c8c8c]">kg</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-[#8c8c8c] uppercase tracking-wider">Biometric BMI</p>
                <p className="text-xl font-bold font-mono text-sky-400 mt-1">{bmi}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs text-[#8c8c8c] uppercase tracking-wider">Target Calories / TDEE</p>
                <p className="text-xl font-bold font-mono text-amber-400 mt-1">
                  {Math.round(profile.tdee || 2000)} <span className="text-xs font-sans text-[#8c8c8c]">kcal</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Shortcuts Grid ── */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="font-display font-bold text-2xl tracking-tight" style={{ color: '#fff' }}>
              Explore Health Features
            </h2>
            <p className="text-sm text-[#8c8c8c]">Choose a tracker module below to start logging your daily progress.</p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[#7b7b7b] text-xs">
            <TrendingUp className="w-4 h-4 text-red-500" />
            <span>Planned Performance</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SHORTCUTS.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <Link
                key={shortcut.to}
                to={shortcut.to}
                className="group relative flex flex-col justify-between p-6 bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] shadow-lux hover:shadow-elevated hover:border-[#3a3a3a] transition-all cursor-pointer overflow-hidden"
              >
                {/* Hover glow */}
                <div
                  className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"
                  style={{ background: 'radial-gradient(circle, rgba(185,28,28,0.08) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
                />

                <div className="relative z-10 flex gap-4 items-start">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${shortcut.color} text-white shadow-md group-hover:scale-105 transition-transform flex-shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#242424] text-[#8c8c8c] border border-[#333]">
                        {shortcut.badge}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-lg group-hover:text-red-400 transition-colors pt-1.5" style={{ color: '#fff' }}>
                      {shortcut.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#8c8c8c] leading-relaxed pt-0.5">{shortcut.desc}</p>
                  </div>
                </div>

                <div className="relative z-10 flex justify-end items-center text-xs font-semibold text-[#666666] group-hover:text-red-400 transition-colors mt-4 pt-4 border-t border-[#242424]">
                  <span>Get Started</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
    </>
  );
}
