import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Mail, Lock, ArrowRight, ShieldCheck, ShieldAlert } from 'lucide-react';

const schema = z
  .object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Password confirmation must be at least 8 characters'),
    pdpConsent: z.literal(true, {
      errorMap: () => ({ message: 'You must consent to personal data processing to proceed' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function RegisterForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    try {
      setError('');
      await registerUser({ ...data, pdpConsent: true });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. The email may already be registered.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-display font-extrabold text-2xl text-slate-800 tracking-tight">
          Create a New Account
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-1.5 leading-relaxed">
          Start your healthy journey today, automatically and progressively.
        </p>
      </div>

      {error && (
        <div className="flex gap-2.5 p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 text-xs sm:text-sm items-start">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-slate-600 uppercase tracking-widest mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="email"
              type="email"
              placeholder="name@email.com"
              {...register('email')}
              className={`block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                errors.email
                  ? 'border-rose-300 focus:ring-rose-200 focus:bg-white'
                  : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100 focus:bg-white'
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-rose-600 text-xs mt-1 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-slate-600 uppercase tracking-widest mb-1.5">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className={`block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                errors.password
                  ? 'border-rose-300 focus:ring-rose-200 focus:bg-white'
                  : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100 focus:bg-white'
              }`}
            />
          </div>
          {errors.password && (
            <p className="text-rose-600 text-xs mt-1 font-medium">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-600 uppercase tracking-widest mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              className={`block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                errors.confirmPassword
                  ? 'border-rose-300 focus:ring-rose-200 focus:bg-white'
                  : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100 focus:bg-white'
              }`}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-rose-600 text-xs mt-1 font-medium">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Consent Section */}
        <div className="space-y-1 pt-1">
          <label className="relative flex items-start gap-3 cursor-pointer p-0.5 select-none text-xs text-slate-500 leading-normal">
            <input
              type="checkbox"
              {...register('pdpConsent')}
              className="mt-0.5 w-4.5 h-4.5 text-emerald-500 border-slate-300 rounded focus:ring-emerald-200 focus:ring-2 accent-emerald-500 transition-all flex-shrink-0"
            />
            <span>
              I consent to the processing of my personal data in accordance with the Personal Data Protection (PDP) regulations.
            </span>
          </label>
          {errors.pdpConsent && (
            <p className="text-rose-600 text-xs font-medium">{errors.pdpConsent.message}</p>
          )}
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 mt-2 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
              Registering Account...
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              Register Now <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </button>
      </form>

      {/* Login Navigation Link */}
      <p className="text-center text-xs sm:text-sm text-slate-500 mt-2">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 underline underline-offset-4">
          Log In
        </Link>
      </p>
    </div>
  );
}
