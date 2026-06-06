import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Mail, Lock, ArrowRight, ShieldAlert, KeyRound } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function LoginForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    try {
      setError('');
      await login(data);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Incorrect email or password');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-display font-extrabold text-2xl text-slate-800 tracking-tight">
          Log In to Your Account
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-1.5 leading-relaxed">
          Take control of your nutrition and daily activity with our automated health platform.
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-[#121212] bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 border-2 border-slate-900/40 border-t-slate-900 rounded-full animate-spin"></span>
              Connecting...
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              Log In <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-4 flex py-1 items-center">
        <div className="flex-grow border-t border-slate-200/60"></div>
        <span className="flex-shrink mx-4 text-slate-400 text-xs font-medium uppercase tracking-wider">Or Log In With</span>
        <div className="flex-grow border-t border-slate-200/60"></div>
      </div>

      {/* Google Login Web Proxy */}
      <a
        href="/api/auth/google"
        className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all font-semibold text-sm shadow-xs"
      >
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        <span>Google Account</span>
      </a>

      {/* Register Link */}
      <p className="text-center text-xs sm:text-sm text-slate-500 mt-2">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700 underline underline-offset-4">
          Register now
        </Link>
      </p>
    </div>
  );
}
