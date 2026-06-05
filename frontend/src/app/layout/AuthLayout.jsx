/**
 * AuthLayout.jsx
 *
 * Why: The centred card wrapper for unauthenticated forms (/login, /register)
 * was embedded inline inside ResponsiveLayout in Router.jsx. Extracting it
 * makes the auth UI independently testable and keeps Router.jsx focused on
 * routing config only.
 */

import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

/**
 * Full-page centred layout for authentication forms.
 * Renders the FitLife logo above a card that wraps the supplied children.
 *
 * @param {object}          props
 * @param {React.ReactNode} props.children - The login or register form.
 * @returns {JSX.Element}
 */
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center mb-6">
          <Link to="/" className="flex items-center gap-2 text-inherit no-underline group">
            <Activity className="w-[22px] h-[22px]" style={{ color: '#ffffff' }} />
            <span className="font-display font-extrabold text-[1.35rem] tracking-[-0.03em] text-white">
              Fit<span className="font-normal text-white">Life</span>
            </span>
          </Link>
        </div>
      </div>

      {/* Card */}
      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#161616] backdrop-blur-md py-8 px-4 shadow-lux rounded-2xl border border-[#2a2a2a] sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
