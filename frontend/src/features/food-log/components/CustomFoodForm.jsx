import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createCustomFood } from '../api/foodLogApi.js';
import { Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Maximum 100 characters'),
  calories_per_100g: z.coerce.number().min(0, 'Minimum 0 kcal').max(5000, 'Maximum 5000 kcal'),
});

export default function CustomFoodForm({ onSuccess, onCancel }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const onSubmit = async (data) => {
    try {
      setMessage('');
      setErrorMsg('');
      await createCustomFood(data);
      setMessage('Custom food successfully added!');
      reset();
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add custom food');
    }
  };

  // Why dark-themed inline styles: To visually match the manual food logging form and maintain design consistency.
  return (
    <div className="space-y-4 pt-1">
      {message && (
        <div className="flex gap-2.5 p-3.5 rounded-xl text-sm items-center animate-fade-in" style={{ background: 'rgba(6,78,59,0.25)', border: '1px solid rgba(52,211,153,0.3)', color: '#6ee7b7' }}>
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#34d399' }} />
          <span className="font-medium">{message}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex gap-2.5 p-3.5 rounded-xl text-sm items-center animate-fade-in" style={{ background: 'rgba(153,27,27,0.25)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#f87171' }} />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="custom_food_name_field" className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#666' }}>
            Food / Dish Name
          </label>
          <input
            id="custom_food_name_field"
            type="text"
            placeholder="e.g. Grilled Chicken Skewers"
            {...register('name')}
            className="block w-full px-3.5 py-2 text-sm rounded-lg focus:outline-none transition-all placeholder-slate-500"
            style={{ background: '#222', border: '1px solid #333', color: '#fff' }}
          />
          {errors.name && (
            <p className="text-rose-600 text-[11px] mt-1 font-medium">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="custom_food_calories_field" className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#666' }}>
            Calorie Content per 100 grams (kcal)
          </label>
          <input
            id="custom_food_calories_field"
            type="number"
            placeholder="e.g. 350"
            {...register('calories_per_100g')}
            className="block w-full px-3.5 py-2 text-sm rounded-lg focus:outline-none transition-all font-mono placeholder-slate-500"
            style={{ background: '#222', border: '1px solid #333', color: '#fff' }}
          />
          {errors.calories_per_100g && (
            <p className="text-rose-600 text-[11px] mt-1 font-medium">{errors.calories_per_100g.message}</p>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t" style={{ borderColor: '#222' }}>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-2 flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#b91c1c' }}
            onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background = '#dc2626'; }}
            onMouseLeave={e => { if (!isSubmitting) e.currentTarget.style.background = '#b91c1c'; }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Adding...
              </>
            ) : (
              'Save New Food'
            )}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 px-4 rounded-xl text-xs font-semibold cursor-pointer text-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ border: '1px solid #333', color: '#888', background: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#222'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
