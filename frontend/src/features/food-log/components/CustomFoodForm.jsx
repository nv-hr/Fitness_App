import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createCustomFood } from '../api/foodLogApi.js';
import { t } from '../../../shared/i18n/translations.js';

const schema = z.object({
  name: z.string().min(1, t('validation.required')).max(100, 'Maximum 100 characters'),
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
      setMessage(t('foodLog.customFoodSaved'));
      reset();
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMsg(err.message || t('foodLog.customFoodError'));
    }
  };

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1rem',
      background: '#fafafa',
    }}>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>{t('foodLog.addCustomFood')}</h3>

      {message && <p style={{ color: '#16a34a', fontSize: '0.875rem' }}>{message}</p>}
      {errorMsg && <p style={{ color: 'red', fontSize: '0.875rem' }}>{errorMsg}</p>}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="customFoodName">{t('foodLog.customFoodName')}</label>
          <input
            id="customFoodName"
            type="text"
            {...register('name')}
            style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem', boxSizing: 'border-box' }}
          />
          {errors.name && <p style={{ color: 'red', fontSize: '0.875rem' }}>{errors.name.message}</p>}
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="caloriesPer100g">{t('foodLog.caloriesPer100g')}</label>
          <input
            id="caloriesPer100g"
            type="number"
            {...register('calories_per_100g')}
            style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem', boxSizing: 'border-box' }}
          />
          {errors.calories_per_100g && <p style={{ color: 'red', fontSize: '0.875rem' }}>{errors.calories_per_100g.message}</p>}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{ padding: '0.5rem 1rem', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
          >
            {isSubmitting ? t('auth.loading') : t('foodLog.addCustomFood')}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
            >
              {t('auth.cancel')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
