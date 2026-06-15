import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../auth/hooks/useAuth.jsx';
import { useState } from 'react';
import { ArrowRight, ArrowLeft, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PasswordFields from '../../auth/components/PasswordFields.jsx';

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
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
        pdpConsent: true,
      });
      setSuccess('Password changed successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to change password');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-display font-extrabold text-2xl text-slate-800 tracking-tight">
          Change Password
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-1.5 leading-relaxed">
          Enter your new password below to update your security credentials.
        </p>
      </div>

      {error && (
        <div className="flex gap-2.5 p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 text-xs sm:text-sm items-start">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex gap-2.5 p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs sm:text-sm items-start">
          <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-500 mt-0.5" />
          <span className="font-medium">{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <PasswordFields register={register} errors={errors} />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-[#121212] bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 border-2 border-slate-900/40 border-t-slate-900 rounded-full animate-spin"></span>
              Saving Password...
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              Save Password &amp; Continue <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </button>
      </form>

      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all shadow-xs mt-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>
    </div>
  );
}
