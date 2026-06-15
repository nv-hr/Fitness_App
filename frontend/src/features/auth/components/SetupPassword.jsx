import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth.jsx';
import { useState } from 'react';
import { ArrowRight, ShieldAlert } from 'lucide-react';
import PasswordFields from './PasswordFields.jsx';

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
 * SetupPassword
 *
 * For users authenticated via Google OAuth who need to configure a password
 * and agree to the data processing policy (consent).
 *
 * @returns {JSX.Element}
 */
export default function SetupPassword() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      password: '',
      confirmPassword: '',
      pdpConsent: false,
    }
  });

  const { setPassword, logout } = useAuth();
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    try {
      setError('');
      await setPassword({
        password: data.password,
        pdpConsent: data.pdpConsent,
      });
    } catch (err) {
      setError(err.message || 'Failed to setup password');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-display font-extrabold text-2xl text-slate-800 tracking-tight">
          Secure Your Account
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-1.5 leading-relaxed">
          Create a password for your account and consent to the data processing policy to access FitLife.
        </p>
      </div>

      {error && (
        <div className="flex gap-2.5 p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 text-xs sm:text-sm items-start">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <PasswordFields register={register} errors={errors} />

        {/* PDP Consent Checkbox */}
        <div className="space-y-1 pt-1">
          <label className="relative flex items-start gap-3 cursor-pointer p-0.5 select-none text-xs text-slate-500 leading-normal">
            <input
              type="checkbox"
              {...register('pdpConsent')}
              className="mt-0.5 w-4.5 h-4.5 text-emerald-500 border-slate-300 rounded focus:ring-emerald-200 focus:ring-2 accent-emerald-500 transition-all flex-shrink-0"
            />
            <span>
              I consent to the collection and processing of my health, physical activity, and diet metrics to receive personalized recommendations (PDP Consent).
            </span>
          </label>
          {errors.pdpConsent && (
            <p className="text-rose-600 text-xs mt-1 font-medium">{errors.pdpConsent.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-[#121212] bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed disabled:active:scale-100 mt-4"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 border-2 border-slate-900/40 border-t-slate-900 rounded-full animate-spin"></span>
              Saving Password...
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              Save Password & Continue <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </button>
      </form>

      {/* Log Out Link */}
      <p className="text-center text-xs sm:text-sm text-slate-500 mt-2">
        Want to switch accounts?{' '}
        <button
          onClick={logout}
          className="font-semibold text-emerald-600 hover:text-emerald-700 underline underline-offset-4 bg-transparent border-none p-0 cursor-pointer"
        >
          Log Out
        </button>
      </p>
    </div>
  );
}
