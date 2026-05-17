import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth.js';
import { t } from '../../../shared/i18n/translations.js';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

const schema = z
  .object({
    email: z.string().email(t('validation.invalidEmail')),
    password: z.string().min(8, t('validation.minLength').replace('{{min}}', '8')),
    confirmPassword: z.string(),
    pdpConsent: z.literal(true, {
      errorMap: () => ({ message: t('auth.pdpConsentRequired') }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t('auth.passwordMismatch'),
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
      setError(err.message || t('auth.registerFailed'));
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '1rem' }}>
      <h2>{t('auth.registerTitle')}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email">{t('auth.email')}</label>
          <input
            id="email"
            type="email"
            {...register('email')}
            style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
          {errors.email && <p style={{ color: 'red', fontSize: '0.875rem' }}>{errors.email.message}</p>}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password">{t('auth.password')}</label>
          <input
            id="password"
            type="password"
            {...register('password')}
            style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
          {errors.password && <p style={{ color: 'red', fontSize: '0.875rem' }}>{errors.password.message}</p>}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
          <input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword')}
            style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
          {errors.confirmPassword && <p style={{ color: 'red', fontSize: '0.875rem' }}>{errors.confirmPassword.message}</p>}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            <input type="checkbox" {...register('pdpConsent')} />
            {' '}{t('auth.pdpConsent')}
          </label>
          {errors.pdpConsent && <p style={{ color: 'red', fontSize: '0.875rem' }}>{errors.pdpConsent.message}</p>}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
        >
          {isSubmitting ? t('auth.loading') : t('auth.registerButton')}
        </button>
      </form>
      <p style={{ textAlign: 'center' }}>
        {t('auth.hasAccount')} <Link to="/login">{t('auth.login')}</Link>
      </p>
    </div>
  );
}
