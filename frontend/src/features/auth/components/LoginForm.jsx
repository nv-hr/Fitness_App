import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth.js';
import { t } from '../../../shared/i18n/translations.js';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

const schema = z.object({
  email: z.string().email(t('validation.invalidEmail')),
  password: z.string().min(8, t('validation.minLength').replace('{{min}}', '8')),
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
      setError(err.message || t('auth.loginFailed'));
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '1rem' }}>
      <h2>{t('auth.loginTitle')}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email">{t('auth.email')}</label>
          <input
            id="email"
            type="email"
            {...register('email')}
            style={{ display: 'block', width: '100%', padding: '0.75rem 0.5rem', marginTop: '0.25rem', boxSizing: 'border-box', minHeight: '44px' }}
          />
          {errors.email && <p style={{ color: 'red', fontSize: '0.875rem' }}>{errors.email.message}</p>}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password">{t('auth.password')}</label>
          <input
            id="password"
            type="password"
            {...register('password')}
            style={{ display: 'block', width: '100%', padding: '0.75rem 0.5rem', marginTop: '0.25rem', boxSizing: 'border-box', minHeight: '44px' }}
          />
          {errors.password && <p style={{ color: 'red', fontSize: '0.875rem' }}>{errors.password.message}</p>}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{ width: '100%', padding: '0.75rem 1rem', marginBottom: '1rem', minHeight: '44px', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
        >
          {isSubmitting ? t('auth.loading') : t('auth.loginButton')}
        </button>
      </form>
      <a
        href="/api/auth/google"
        style={{ display: 'block', textAlign: 'center', marginBottom: '1rem', padding: '0.75rem 1rem', minHeight: '44px', lineHeight: '44px' }}
      >
        {t('auth.loginWithGoogle')}
      </a>
      <p style={{ textAlign: 'center' }}>
        {t('auth.noAccount')} <Link to="/register">{t('auth.register')}</Link>
      </p>
    </div>
  );
}
