import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../auth/hooks/useAuth.jsx';
import { useState } from 'react';
import { Lock, ArrowRight, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
  pdpConsent: z.literal(true, {
    errorMap: () => ({ message: 'You must consent to the processing of your data to continue' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

/**
 * ChangePasswordPage
 *
 * Allows authenticated users to change their password by confirming consent
 * and calling the set-password API endpoint.
 *
 * @returns {JSX.Element}
 */
export default function ChangePasswordPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      password: '',
      confirmPassword: '',
      pdpConsent: false,
    }
  });

  const { setPassword } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      setError('');
      setSuccess('');
      await setPassword({
        password: data.password,
        pdpConsent: data.pdpConsent,
      });
      setSuccess('Password changed successfully!');
      setTimeout(() => {
        navigate('/settings');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to change password');
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-in py-8">
      <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-2xl border border-[#2d2d2d] shadow-lux space-y-6">
        <div className="text-center">
          <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">
            Change Password
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1.5 leading-relaxed">
            Enter your new password below and re-confirm consent to update your security credentials.
          </p>
        </div>

        {error && (
          <div className="flex gap-2.5 p-3 rounded-xl bg-rose-950/20 text-rose-450 border border-rose-900/30 text-xs sm:text-sm items-start">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex gap-2.5 p-3 rounded-xl bg-emerald-950/20 text-emerald-450 border border-emerald-900/30 text-xs sm:text-sm items-start">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-500 mt-0.5" />
            <span className="font-medium">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4 text-slate-500" />
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className={`block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-900/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                  errors.password
                    ? 'border-rose-500/50 focus:ring-rose-500/20 focus:bg-[#1a1a1a]'
                    : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20 focus:bg-[#1a1a1a]'
                }`}
              />
            </div>
            {errors.password && (
              <p className="text-rose-500 text-xs mt-1 font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4 text-slate-500" />
              </div>
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
                className={`block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-900/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                  errors.confirmPassword
                    ? 'border-rose-500/50 focus:ring-rose-500/20 focus:bg-[#1a1a1a]'
                    : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20 focus:bg-[#1a1a1a]'
                }`}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-rose-500 text-xs mt-1 font-medium">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* PDP Consent Checkbox */}
          <div className="space-y-1 pt-1">
            <label className="relative flex items-start gap-3 cursor-pointer p-0.5 select-none text-xs text-slate-400 leading-normal font-sans">
              <input
                type="checkbox"
                {...register('pdpConsent')}
                className="mt-0.5 w-4.5 h-4.5 text-emerald-500 border-slate-700 rounded focus:ring-emerald-500/20 focus:ring-2 accent-emerald-500 transition-all flex-shrink-0"
              />
              <span>
                I consent to the collection and processing of my health, physical activity, and diet metrics to receive personalized recommendations (PDP Consent).
              </span>
            </label>
            {errors.pdpConsent && (
              <p className="text-rose-500 text-xs mt-1 font-medium">{errors.pdpConsent.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-red-700 hover:bg-red-800 active:scale-[0.98] transition-all cursor-pointer shadow-sm disabled:bg-[#333] disabled:cursor-not-allowed disabled:active:scale-100 mt-4 border-none font-sans"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                Saving Password...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                Save Password &amp; Continue <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* Back Link */}
        <p className="text-center text-xs sm:text-sm text-slate-500 mt-2">
          <button
            onClick={() => navigate('/settings')}
            className="font-semibold text-emerald-500 hover:text-emerald-400 underline underline-offset-4 bg-transparent border-none p-0 cursor-pointer"
          >
            Back to Settings
          </button>
        </p>
      </div>
    </div>
  );
}
