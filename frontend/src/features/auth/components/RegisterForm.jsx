import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth.jsx';

import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

const schema = z
  .object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Minimum 8 characters'),
    confirmPassword: z.string(),
    pdpConsent: z.literal(true, {
      errorMap: () => ({ message: 'You must agree to the processing of personal data to continue' }),
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
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '1rem' }}>
      <h2>{'Create a New Account'}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email">{'Email'}</label>
          <input
            id="email"
            type="email"
            {...register('email')}
            style={{ display: 'block', width: '100%', padding: '0.75rem 0.5rem', marginTop: '0.25rem', boxSizing: 'border-box', minHeight: '44px' }}
          />
          {errors.email && <p style={{ color: 'red', fontSize: '0.875rem' }}>{errors.email.message}</p>}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password">{'Password'}</label>
          <input
            id="password"
            type="password"
            {...register('password')}
            style={{ display: 'block', width: '100%', padding: '0.75rem 0.5rem', marginTop: '0.25rem', boxSizing: 'border-box', minHeight: '44px' }}
          />
          {errors.password && <p style={{ color: 'red', fontSize: '0.875rem' }}>{errors.password.message}</p>}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="confirmPassword">{'Confirm Password'}</label>
          <input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword')}
            style={{ display: 'block', width: '100%', padding: '0.75rem 0.5rem', marginTop: '0.25rem', boxSizing: 'border-box', minHeight: '44px' }}
          />
          {errors.confirmPassword && <p style={{ color: 'red', fontSize: '0.875rem' }}>{errors.confirmPassword.message}</p>}
        </div>
        <div style={{ marginBottom: '1rem', minHeight: '44px', display: 'flex', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" {...register('pdpConsent')} style={{ width: '20px', height: '20px' }} />
            {" I agree to the processing of my personal data in accordance with the Personal Data Protection Act"}
          </label>
          {errors.pdpConsent && <p style={{ color: 'red', fontSize: '0.875rem' }}>{errors.pdpConsent.message}</p>}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{ width: '100%', padding: '0.75rem 1rem', marginBottom: '1rem', minHeight: '44px', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
        >
          {isSubmitting ? 'Loading...' : 'Sign Up'}
        </button>
      </form>
      <p style={{ textAlign: 'center' }}>
        {'Already have an account?'} <Link to="/login">{'Sign In'}</Link>
      </p>
    </div>
  );
}
