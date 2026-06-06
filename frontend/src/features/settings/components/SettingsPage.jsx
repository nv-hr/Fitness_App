import { useAuth } from '../../auth/hooks/useAuth.jsx';
import { useNavigate } from 'react-router-dom';

/**
 * SettingsPage
 *
 * Renders user account security options, displaying the logged-in user email
 * and providing a route to change the password.
 *
 * @returns {JSX.Element}
 */
export default function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="font-display font-extrabold text-3xl tracking-tight text-white">
          Account Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1 leading-relaxed">
          Manage your account preferences and login security settings.
        </p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-2xl border border-[#2d2d2d] shadow-lux space-y-6">
        <h2 className="font-display font-bold text-lg text-white border-b border-[#2d2d2d] pb-3 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-emerald-500 rounded-full inline-block"></span>
          Profile &amp; Security
        </h2>

        <div className="divide-y divide-[#2d2d2d]">
          {/* User Email Row */}
          <div className="py-4 flex justify-between items-center first:pt-0">
            <div>
              <p className="text-xs text-white font-bold uppercase tracking-wider">Account Email</p>
              <p className="text-sm font-semibold text-slate-400 mt-1">{user?.email}</p>
            </div>
            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#1e1e1e] text-slate-400 border border-[#2d2d2d]">
              OAuth Verified
            </span>
          </div>

          {/* Change Password Row */}
          <div className="py-4 flex justify-between items-center last:pb-0">
            <div>
              <p className="text-xs text-white font-bold uppercase tracking-wider">Security</p>
              <p className="text-sm font-semibold text-slate-400 mt-1">Change Password</p>
            </div>
            <button
              onClick={() => navigate('/change-password')}
              className="flex items-center gap-1 px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-lg transition-all cursor-pointer border-none font-sans active:scale-95 shadow-sm"
            >
              Modify
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
