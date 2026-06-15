import { Lock } from 'lucide-react';

export default function PasswordFields({ register, errors, showConfirm = true }) {
  return (
    <>
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
      {showConfirm && (
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
      )}
    </>
  );
}
