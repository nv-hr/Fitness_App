/**
 * AppShell.jsx
 *
 * Why: The authenticated application shell (sticky header, responsive sidebar /
 * mobile nav, main content area, profile-completion overlay) was the largest
 * concern buried inside Router.jsx. Extracting it means layout changes never
 * touch routing config and the shell can be unit-tested in isolation.
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/index.js';
import { useResponsive } from '../../shared/hooks/useResponsive.js';
import { getProfile, ProfileForm } from '../../features/profile/index.js';
import Loader from '../../shared/ui/Loader.jsx';
import {
  LayoutDashboard,
  User,
  Apple,
  Activity,
  LineChart,
  LogOut,
  Settings,
  HelpCircle,
  Mail,
  UserCheck,
  Scale,
  Flame,
} from 'lucide-react';

/** Navigation items shown in sidebar and mobile bar. */
/** Navigation items shown in sidebar and mobile bar. */
const NAV_ITEMS = [
  { path: '/',          label: 'Dashboard',       icon: LayoutDashboard },
  { path: '/bmi',       label: 'BMI Calculator',  icon: Scale           },
  { path: '/tdee',      label: 'TDEE Calculator', icon: Flame           },
  { path: '/food-log',  label: 'Food Tracker',    icon: Apple           },
  { path: '/activities',label: 'Activities',      icon: Activity        },
  { path: '/progress',  label: 'Progress',        icon: LineChart       },
  { path: '/profile',   label: 'Profile',         icon: User            },
  { path: '/settings',  label: 'Settings',        icon: Settings },
  { path: '#',          label: 'Log Out',         icon: LogOut,     action: 'logout' },
];

/**
 * Determines whether a nav item is "active" given the current pathname.
 *
 * @param {string}  itemPath     - The nav item's route path.
 * @param {string}  currentPath  - The current browser pathname.
 * @param {boolean} isDummy      - True for placeholder items that should never be active.
 * @returns {boolean}
 */
function isNavActive(itemPath, currentPath, isDummy) {
  if (isDummy) return false;
  if (itemPath === '/') return currentPath === '/';
  return currentPath.startsWith(itemPath);
}

/**
 * The full authenticated application shell: sticky header, desktop sidebar,
 * mobile scroll-nav, main content area, and the profile-completion overlay.
 *
 * @param {object}          props
 * @param {React.ReactNode} props.children - The active page content.
 * @returns {JSX.Element}
 */
export default function AppShell({ children }) {
  const { isMobile } = useResponsive();
  const { user, logout } = useAuth();
  const location = useLocation();

  const [profileMissing, setProfileMissing] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Check whether the user has completed their biometric profile on every login.
  useEffect(() => {
    if (!user) {
      setCheckingProfile(false);
      setProfileMissing(false);
      return;
    }

    getProfile()
      .then((res) => {
        const p = res?.data?.profile;
        const isIncomplete = !p || !p.weight_kg || !p.height_cm || !p.age || !p.gender;
        setProfileMissing(isIncomplete);
      })
      .catch(() => setProfileMissing(true))
      .finally(() => setCheckingProfile(false));
  }, [user]);

  if (checkingProfile) {
    return <Loader message="Verifying profile completion..." />;
  }

  return (
    <div className="min-h-screen bg-[#121212] font-sans flex flex-col">
      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-40 w-full bg-[#801414] border-b border-[#991b1b]/30 shadow-md">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 text-inherit no-underline group">
              <Activity className="w-[22px] h-[22px]" style={{ color: '#ffffff' }} />
              <span className="font-display font-extrabold text-[1.35rem] tracking-[-0.03em] text-white">
                Fit<span className="font-normal text-white">Life</span>
              </span>
            </Link>

            {/* Header right actions (Settings and logout removed per request) */}
            <div className="flex items-center gap-4">
              {!isMobile && (
                <div className="text-right text-white">
                  <p className="text-[10px] opacity-75">Logged in as</p>
                  <p className="text-xs font-semibold max-w-[150px] truncate">{user?.email}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Desktop sidebar */}
        {!isMobile ? (
          <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-64 bg-[#151515] border-r border-[#222] flex flex-col justify-between py-6 shrink-0 z-30">
            <nav className="flex flex-col space-y-1 px-3">
              {NAV_ITEMS.map((item, idx) => {
                const Icon = item.icon;
                const active = isNavActive(item.path, location.pathname, item.dummy);

                if (item.action === 'logout') {
                  return (
                    <button
                      key={idx}
                      onClick={logout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 cursor-pointer text-left border-none bg-transparent"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={idx}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-emerald-500 text-white font-semibold shadow-md'
                        : 'text-slate-400 hover:text-[#ffffff] hover:bg-[#252525]'
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
          /* Mobile horizontal scroll nav */
          <div className="w-full border-b border-[#222] bg-[#1a1a1a] overflow-x-auto scrollbar-none flex px-4 py-2 space-x-2">
            {NAV_ITEMS.filter((i) => !i.dummy).map((item, idx) => {
              const Icon = item.icon;
              const active = isNavActive(item.path, location.pathname, false);

              if (item.action === 'logout') {
                return (
                  <button
                    key={idx}
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 text-slate-400 bg-[#222] hover:bg-[#333] border-none"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              }

              return (
                <Link
                  key={idx}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                    active
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

        {/* Page content */}
        <main className="flex-1 bg-[#121212] py-8 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {/* ── Profile-completion overlay ── */}
      {profileMissing && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#181818] border border-[#2d2d2d] rounded-3xl max-w-5xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="mb-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-500 mb-3">
                <UserCheck className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="font-display font-extrabold text-2xl text-white">
                Complete Your Health Profile
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Please enter your biometrics below to unlock the features of FitLife.
              </p>
            </div>
            <ProfileForm
              onSaveSuccess={() => setProfileMissing(false)}
              isOverlay
            />
          </div>
        </div>
      )}
    </div>
  );
}
