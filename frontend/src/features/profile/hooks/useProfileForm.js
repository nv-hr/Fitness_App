import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createProfile, getProfile, updateProfile } from '../api/profileApi.js';

const schema = z.object({
  weightKg: z.coerce.number().min(2, 'Weight must be at least 2 kg').max(300, 'Weight can be at most 300 kg'),
  heightCm: z.coerce.number().min(50, 'Height must be at least 50 cm').max(250, 'Height can be at most 250 cm'),
  age: z.coerce.number().min(5, 'Age must be at least 5 years').max(120, 'Age can be at most 120 years'),
  gender: z.enum(['male', 'female', 'other'], { message: 'Gender is required' }),
  fitnessGoal: z.enum(['lose_weight', 'maintain', 'gain_weight'], { message: 'Fitness goal is required' }),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'very_active', 'extra_active']).optional(),
  calorieRate: z.enum(['low', 'medium', 'high']).optional(),
  targetWeightKg: z.coerce.number().min(2, 'Target weight must be at least 2 kg').max(300, 'Target weight can be at most 300 kg').optional(),
  targetDate: z.string().optional(),
});

export function useProfileForm(onSaveSuccess) {
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
  const [success, setSuccess] = useState('');
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
        if (profile.target_weight_kg) {
          setValue('targetWeightKg', profile.target_weight_kg);
        }
        if (profile.target_date) {
          setValue('targetDate', profile.target_date);
        }
        setBmiResult({ bmi: response.data.bmi, bmiCategory: response.data.bmiCategory });
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
      setSuccess('');
      const response = existingProfile
        ? await updateProfile(data)
        : await createProfile(data);

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
      if (!existingProfile) {
        setExistingProfile(response.data.profile);
      }
      setSuccess('Health profile successfully saved and analyzed!');
      window.dispatchEvent(new CustomEvent('health-system-update'));
      if (onSaveSuccess) {
        // Wait briefly so they can read the success message
        setTimeout(() => {
          onSaveSuccess(response.data.profile);
        }, 800);
      }
    } catch (err) {
      setError(err.message || 'Failed to save profile');
    }
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    errors,
    isSubmitting,
    bmiResult,
    tdeeResult,
    error,
    success,
    loading,
    isUpdate: !!existingProfile,
  };
}
