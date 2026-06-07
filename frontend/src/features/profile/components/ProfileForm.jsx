import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createProfile, getProfile, updateProfile } from '../api/profileApi.js';
import BmiResult from './BmiResult.jsx';
import TdeeResult from './TdeeResult.jsx';
import { Scale, Ruler, Calendar, User, Target, Zap, Loader2, ShieldCheck, ShieldAlert, Award } from 'lucide-react';

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

export default function ProfileForm({ onSaveSuccess, isOverlay = false }) {
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="mt-4 text-sm text-slate-500 animate-pulse">Connecting biometrics...</p>
      </div>
    );
  }

  const isUpdate = !!existingProfile;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {!isOverlay && (
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight" style={{ color: '#fff' }}>
            Biometrics & TDEE Profile
          </h1>
          <p className="text-slate-500 text-sm mt-1 leading-relaxed">
            Measure BMI, calculate TDEE, and customize calorie targets according to your activity level.
          </p>
        </div>
      )}

      {success && (
        <div className="flex gap-2.5 p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 text-sm items-center shadow-xs">
          <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-500" />
          <span className="font-medium">{success}</span>
        </div>
      )}

      {error && (
        <div className="flex gap-2.5 p-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 text-sm items-center shadow-xs">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Grid Layout: Left form editor, Right health biometrics preview cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Editor Card Panel */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/50 shadow-lux">
          <h2 className="font-display font-bold text-lg text-slate-800 border-b border-slate-100 pb-3 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-emerald-500 rounded-full inline-block"></span>
            Daily Body Parameters
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Weight input */}
              <div>
                <label htmlFor="weightKg" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Current Weight (kg)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Scale className="w-4 h-4" />
                  </div>
                  <input
                    id="weightKg"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 68.5"
                    {...register('weightKg')}
                    className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-100 focus:bg-white transition-all"
                  />
                </div>
                {errors.weightKg && (
                  <p className="text-rose-600 text-xs mt-1 font-medium">{errors.weightKg.message}</p>
                )}
              </div>

              {/* Height input */}
              <div>
                <label htmlFor="heightCm" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Height (cm)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Ruler className="w-4 h-4" />
                  </div>
                  <input
                    id="heightCm"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 170"
                    {...register('heightCm')}
                    className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-100 focus:bg-white transition-all"
                  />
                </div>
                {errors.heightCm && (
                  <p className="text-rose-600 text-xs mt-1 font-medium">{errors.heightCm.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Age input */}
              <div>
                <label htmlFor="age" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Your Age (years)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    id="age"
                    type="number"
                    placeholder="e.g. 24"
                    {...register('age')}
                    className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-100 focus:bg-white transition-all"
                  />
                </div>
                {errors.age && (
                  <p className="text-rose-600 text-xs mt-1 font-medium">{errors.age.message}</p>
                )}
              </div>

              {/* Gender input */}
              <div>
                <label htmlFor="gender" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Gender
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <select
                    id="gender"
                    {...register('gender')}
                    className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-100 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other / Hormone-dependent</option>
                  </select>
                </div>
                {errors.gender && (
                  <p className="text-rose-600 text-xs mt-1 font-medium">{errors.gender.message}</p>
                )}
              </div>
            </div>

            {/* Goal selection */}
            <div>
              <label htmlFor="fitnessGoal" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Primary Fitness Goal
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Target className="w-4 h-4" />
                </div>
                <select
                  id="fitnessGoal"
                  {...register('fitnessGoal')}
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-100 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="lose_weight">Lose Weight (Deficit)</option>
                  <option value="maintain">Maintain Weight (Maintenance)</option>
                  <option value="gain_weight">Gain Weight (Surplus)</option>
                </select>
              </div>
              {errors.fitnessGoal && (
                <p className="text-rose-600 text-xs mt-1 font-medium">{errors.fitnessGoal.message}</p>
              )}
            </div>

            {/* Activity Level */}
            <div>
              <label htmlFor="activityLevel" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Physical Activity Level
              </label>
              <select
                id="activityLevel"
                {...register('activityLevel')}
                className="block w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-100 focus:bg-white transition-all cursor-pointer"
              >
                <option value="sedentary">Sedentary (Little or no exercise / desk job)</option>
                <option value="light">Lightly Active (Light exercise 1-3 times/week)</option>
                <option value="moderate">Moderately Active (Active exercise 3-5 times/week)</option>
                <option value="very_active">Very Active (Hard exercise 6-7 times/week)</option>
                <option value="extra_active">Extra Active (Athlete, double intensive training)</option>
              </select>
            </div>

            {/* Calorie Rate */}
            <div>
              <label htmlFor="calorieRate" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Weight Change Pace
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Zap className="w-4 h-4" />
                </div>
                <select
                  id="calorieRate"
                  {...register('calorieRate')}
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-100 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="low">Slow & Steady (0.25 kg / week)</option>
                  <option value="medium">Healthy & Recommended (0.5 kg / week)</option>
                  <option value="high">Aggressive (1 kg / week - Extreme)</option>
                </select>
              </div>
            </div>

            {/* Goal Weight Subcard Panel */}
            <div className="bg-slate-50/70 p-4.5 rounded-xl border border-slate-200/50 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-500" /> Target Goal Settings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Target Weight */}
                <div>
                  <label htmlFor="targetWeightKg" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Target Weight (kg)
                  </label>
                  <input
                    id="targetWeightKg"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 62.0"
                    {...register('targetWeightKg')}
                    className="block w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                  />
                  {errors.targetWeightKg && (
                    <p className="text-rose-600 text-xs mt-1 font-medium">{errors.targetWeightKg.message}</p>
                  )}
                </div>

                {/* Target Date */}
                <div>
                  <label htmlFor="targetDate" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Target Date
                  </label>
                  <input
                    id="targetDate"
                    type="date"
                    min={format(new Date(), 'yyyy-MM-dd')}
                    {...register('targetDate')}
                    className="block w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all cursor-pointer"
                  />
                  {errors.targetDate && (
                    <p className="text-rose-600 text-xs mt-1 font-medium">{errors.targetDate.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold bg-red-700 hover:bg-red-800 active:scale-[0.98] transition-all cursor-pointer shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed disabled:active:scale-100"
              style={{ color: '#fff' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Saving parameters...
                </>
              ) : (
                <>{isUpdate ? 'Save & Update Profile' : 'Calculate & Create Profile'}</>
              )}
            </button>
          </form>
        </div>

        {/* Live Analysis Display Side Hub */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div className="p-6 sm:p-7 rounded-2xl border border-[#2d2d2d] shadow-elevated relative overflow-hidden" style={{ background: '#121212' }}>
            <div className="absolute right-0 top-0 p-8 text-[#222] pointer-events-none">
              <Award className="w-36 h-36" />
            </div>
            <div className="relative z-10 space-y-2">
              <h2 className="font-display font-bold text-lg tracking-tight flex items-center gap-2" style={{ color: '#fff' }}>
                Biometric Evaluator
              </h2>
              <p className="text-xs text-slate-400">
                The parameters below are calculated automatically based on the Mifflin-St Jeor biometric formula.
              </p>
            </div>
          </div>

          {bmiResult ? (
            <BmiResult bmi={bmiResult.bmi} bmiCategory={bmiResult.bmiCategory} />
          ) : (
            <div className="p-6 bg-slate-100/60 rounded-2xl border border-slate-200/40 text-center text-slate-400 text-xs font-semibold">
              Enter your weight & height to view your BMI classification.
            </div>
          )}

          {tdeeResult && tdeeResult.tdee ? (
            <TdeeResult
              tdee={tdeeResult.tdee}
              tdeeRange={tdeeResult.tdeeRange}
              calorieTarget={tdeeResult.calorieTarget}
              activityLevel={tdeeResult.activityLevel}
              fitnessGoal={tdeeResult.fitnessGoal}
              calorieRate={tdeeResult.calorieRate}
            />
          ) : (
            <div className="p-6 bg-slate-100/60 rounded-2xl border border-slate-200/40 text-center text-slate-400 text-xs font-semibold">
              Daily energy needs (TDEE) will be calculated once parameters are filled.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
