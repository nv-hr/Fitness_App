import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createProfile, getProfile, updateProfile } from '../api/profileApi.js';
import BmiResult from './BmiResult.jsx';
import { t } from '../../../shared/i18n/translations.js';

const schema = z.object({
  weightKg: z.coerce.number().min(2, t('profile.weightMin')).max(300, t('profile.weightMax')),
  heightCm: z.coerce.number().min(50, t('profile.heightMin')).max(250, t('profile.heightMax')),
  age: z.coerce.number().min(5, t('profile.ageMin')).max(120, t('profile.ageMax')),
  gender: z.enum(['male', 'female', 'other'], { message: t('profile.genderRequired') }),
  fitnessGoal: z.enum(['lose_weight', 'maintain', 'gain_weight'], { message: t('profile.fitnessGoalRequired') }),
});

export default function ProfileForm() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: 'male',
      fitnessGoal: 'maintain',
    },
  });

  const [existingProfile, setExistingProfile] = useState(null);
  const [bmiResult, setBmiResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await getProfile();
        const profile = response.data.profile;
        setExistingProfile(profile);
        setValue('weightKg', profile.weight_kg);
        setValue('heightCm', profile.height_cm);
        setValue('age', profile.age);
        setValue('gender', profile.gender);
        setValue('fitnessGoal', profile.fitness_goal);
        setBmiResult({ bmi: response.data.bmi, bmiCategory: response.data.bmiCategory });
      } catch {
        // No profile exists yet
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [setValue]);

  const onSubmit = async (data) => {
    try {
      setError('');
      const response = existingProfile
        ? await updateProfile(data)
        : await createProfile(data);

      setBmiResult({ bmi: response.data.bmi, bmiCategory: response.data.bmiCategory });
      if (!existingProfile) {
        setExistingProfile(response.data.profile);
      }
    } catch (err) {
      setError(err.message || t('profile.profileError'));
    }
  };

  if (loading) {
    return <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '1rem' }}>{t('auth.loading')}</div>;
  }

  const isUpdate = !!existingProfile;

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '1rem' }}>
      <h2>{t('profile.title')}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="weightKg">{t('profile.weight')}</label>
          <input
            id="weightKg"
            type="number"
            step="0.1"
            {...register('weightKg')}
            style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem', boxSizing: 'border-box' }}
          />
          {errors.weightKg && <p style={{ color: 'red', fontSize: '0.875rem' }}>{errors.weightKg.message}</p>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="heightCm">{t('profile.height')}</label>
          <input
            id="heightCm"
            type="number"
            step="0.1"
            {...register('heightCm')}
            style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem', boxSizing: 'border-box' }}
          />
          {errors.heightCm && <p style={{ color: 'red', fontSize: '0.875rem' }}>{errors.heightCm.message}</p>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="age">{t('profile.age')}</label>
          <input
            id="age"
            type="number"
            {...register('age')}
            style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem', boxSizing: 'border-box' }}
          />
          {errors.age && <p style={{ color: 'red', fontSize: '0.875rem' }}>{errors.age.message}</p>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="gender">{t('profile.gender')}</label>
          <select
            id="gender"
            {...register('gender')}
            style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem', boxSizing: 'border-box' }}
          >
            <option value="male">{t('profile.male')}</option>
            <option value="female">{t('profile.female')}</option>
            <option value="other">{t('profile.other')}</option>
          </select>
          {errors.gender && <p style={{ color: 'red', fontSize: '0.875rem' }}>{errors.gender.message}</p>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="fitnessGoal">{t('profile.fitnessGoal')}</label>
          <select
            id="fitnessGoal"
            {...register('fitnessGoal')}
            style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem', boxSizing: 'border-box' }}
          >
            <option value="lose_weight">{t('profile.loseWeight')}</option>
            <option value="maintain">{t('profile.maintain')}</option>
            <option value="gain_weight">{t('profile.gainWeight')}</option>
          </select>
          {errors.fitnessGoal && <p style={{ color: 'red', fontSize: '0.875rem' }}>{errors.fitnessGoal.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
        >
          {isSubmitting ? t('auth.loading') : (isUpdate ? t('profile.updateProfile') : t('profile.saveProfile'))}
        </button>
      </form>

      {bmiResult && (
        <BmiResult bmi={bmiResult.bmi} bmiCategory={bmiResult.bmiCategory} />
      )}
    </div>
  );
}
