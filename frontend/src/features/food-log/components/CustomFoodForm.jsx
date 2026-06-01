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

  return (
    <div className="space-y-4 pt-1">
      {message && (
        <div className="flex gap-2 p-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs font-semibold items-center">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{message}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex gap-2 p-2.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-100 text-xs font-semibold items-center">
          <AlertCircle className="w-4 h-4 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="custom_food_name_field" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Food / Dish Name
          </label>
          <input
            id="custom_food_name_field"
            type="text"
            placeholder="e.g. Grilled Chicken Skewers"
            {...register('name')}
            className="block w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-705 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all"
          />
          {errors.name && (
            <p className="text-rose-600 text-[11px] mt-1 font-medium">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="custom_food_calories_field" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Calorie Content per 100 grams (kcal)
          </label>
          <input
            id="custom_food_calories_field"
            type="number"
            placeholder="e.g. 350"
            {...register('calories_per_100g')}
            className="block w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-705 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all font-mono"
          />
          {errors.calories_per_100g && (
            <p className="text-rose-600 text-[11px] mt-1 font-medium">{errors.calories_per_100g.message}</p>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer shadow-xs disabled:bg-slate-350 disabled:cursor-not-allowed"
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
              className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-650 text-xs font-semibold cursor-pointer text-center"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
