import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createProfile, getProfile, updateProfile } from '../api/profileApi.js';
import BmiResult from './BmiResult.jsx';
import TdeeResult from './TdeeResult.jsx';



const schema = z.object({
  weightKg: z.coerce.number().min(2, 'Weight must be at least 2 kg').max(300, 'Weight must be at most 300 kg'),
  heightCm: z.coerce.number().min(50, 'Height must be at least 50 cm').max(250, 'Height must be at most 250 cm'),
  age: z.coerce.number().min(5, 'Age must be at least 5 years').max(120, 'Age must be at most 120 years'),
  gender: z.enum(['male', 'female', 'other'], { message: 'Gender is required' }),
  fitnessGoal: z.enum(['lose_weight', 'maintain', 'gain_weight'], { message: 'Fitness goal is required' }),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'very_active', 'extra_active']).optional(),
  calorieRate: z.enum(['low', 'medium', 'high']).optional(),
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
      activityLevel: 'moderate',
      calorieRate: 'medium',
    },
  });

  const [existingProfile, setExistingProfile] = useState(null);
  const [bmiResult, setBmiResult] = useState(null);
  const [tdeeResult, setTdeeResult] = useState(null);
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
        if (profile.activity_level) {
          setValue('activityLevel', profile.activity_level);
        }
      setBmiResult({ bmi: response.data.bmi, bmiCategory: response.data.bmiCategory });
      if (response.data.tdee) {
        setTdeeResult({
          tdee: response.data.tdee,
          tdeeRange: response.data.tdeeRange,
          calorieTarget: response.data.calorieTarget,
          activityLevel: data.activityLevel,
          fitnessGoal: data.fitnessGoal,
          calorieRate: data.calorieRate,
        });
      }
        if (response.data.tdee) {
          setTdeeResult({
            tdee: response.data.tdee,
            tdeeRange: response.data.tdeeRange,
            calorieTarget: response.data.calorieTarget,
            activityLevel: profile.activity_level,
            fitnessGoal: profile.fitness_goal,
            calorieRate: profile.calorie_rate,
          });
        }
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
      setError(err.message || 'Failed to save profile');
    }
  };

  if (loading) {
    return <div style={{ maxWidth: '400px', margin: '0 auto', padding: '1rem' }}>{'Loading...'}</div>;
  }

  const isUpdate = !!existingProfile;

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '1rem' }}>
      <h2>{'Profile, BMI & TDEE'}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="weightKg">{'Weight (kg)'}</label>
          <input
            id="weightKg"
            type="number"
            step="0.1"
            {...register('weightKg')}
            style={{ display: 'block', width: '100%', padding: '0.75rem 0.5rem', marginTop: '0.25rem', boxSizing: 'border-box', minHeight: '44px' }}
          />
          {errors.weightKg && <p style={{ color: 'red', fontSize: '0.875rem' }}>{errors.weightKg.message}</p>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="heightCm">{'Height (cm)'}</label>
          <input
            id="heightCm"
            type="number"
            step="0.1"
            {...register('heightCm')}
            style={{ display: 'block', width: '100%', padding: '0.75rem 0.5rem', marginTop: '0.25rem', boxSizing: 'border-box', minHeight: '44px' }}
          />
          {errors.heightCm && <p style={{ color: 'red', fontSize: '0.875rem' }}>{errors.heightCm.message}</p>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="age">{'Age'}</label>
          <input
            id="age"
            type="number"
            {...register('age')}
            style={{ display: 'block', width: '100%', padding: '0.75rem 0.5rem', marginTop: '0.25rem', boxSizing: 'border-box', minHeight: '44px' }}
          />
          {errors.age && <p style={{ color: 'red', fontSize: '0.875rem' }}>{errors.age.message}</p>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="gender">{'Gender'}</label>
          <select
            id="gender"
            {...register('gender')}
            style={{ display: 'block', width: '100%', padding: '0.75rem 0.5rem', marginTop: '0.25rem', boxSizing: 'border-box', minHeight: '44px' }}
          >
            <option value="male">{'Male'}</option>
            <option value="female">{'Female'}</option>
            <option value="other">{'Other'}</option>
          </select>
          {errors.gender && <p style={{ color: 'red', fontSize: '0.875rem' }}>{errors.gender.message}</p>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="fitnessGoal">{'Fitness Goal'}</label>
          <select
            id="fitnessGoal"
            {...register('fitnessGoal')}
            style={{ display: 'block', width: '100%', padding: '0.75rem 0.5rem', marginTop: '0.25rem', boxSizing: 'border-box', minHeight: '44px' }}
          >
            <option value="lose_weight">{'Lose Weight'}</option>
            <option value="maintain">{'Maintain Weight'}</option>
            <option value="gain_weight">{'Gain Weight'}</option>
          </select>
          {errors.fitnessGoal && <p style={{ color: 'red', fontSize: '0.875rem' }}>{errors.fitnessGoal.message}</p>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="activityLevel">{'Activity Level'}</label>
          <select
            id="activityLevel"
            {...register('activityLevel')}
            style={{ display: 'block', width: '100%', padding: '0.75rem 0.5rem', marginTop: '0.25rem', boxSizing: 'border-box', minHeight: '44px' }}
          >
            <option value="sedentary">{'Sedentary (Rarely exercise, desk job)'}</option>
            <option value="light">{'Light (Exercise 1-3x/week)'}</option>
            <option value="moderate">{'Moderate (Exercise 3-5x/week)'}</option>
            <option value="very_active">{'Very Active (Exercise 6-7x/week)'}</option>
            <option value="extra_active">{'Extra Active (Daily intense exercise)'}</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="calorieRate">{'Weight Change Rate'}</label>
          <select
            id="calorieRate"
            {...register('calorieRate')}
            style={{ display: 'block', width: '100%', padding: '0.75rem 0.5rem', marginTop: '0.25rem', boxSizing: 'border-box', minHeight: '44px' }}
          >
            <option value="low">{'0.25 kg/week (Gentle)'}</option>
            <option value="medium">{'0.5 kg/week (Recommended)'}</option>
            <option value="high">{'1 kg/week (Extreme)'}</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{ width: '100%', padding: '0.75rem 1rem', marginBottom: '1rem', minHeight: '44px', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
        >
          {isSubmitting ? 'Loading...' : (isUpdate ? 'Update Profile' : 'Save Profile')}
        </button>
      </form>

      {bmiResult && (
        <BmiResult bmi={bmiResult.bmi} bmiCategory={bmiResult.bmiCategory} />
      )}

      {tdeeResult && tdeeResult.tdee && (
        <TdeeResult
          tdee={tdeeResult.tdee}
          tdeeRange={tdeeResult.tdeeRange}
          calorieTarget={tdeeResult.calorieTarget}
          activityLevel={tdeeResult.activityLevel}
          fitnessGoal={tdeeResult.fitnessGoal}
        />
      )}
    </div>
  );
}
