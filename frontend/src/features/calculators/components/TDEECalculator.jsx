import { useState, useEffect } from 'react';
import { Flame, Sparkles, Activity, Clock, ShieldAlert, Target, Heart } from 'lucide-react';
import { getProfile } from '../../profile/api/profileApi.js';

const activityMap = {
  'sedentary': '1.2',
  'light': '1.375',
  'moderate': '1.55',
  'very_active': '1.725',
  'extra_active': '1.9',
};

const mapActivityToMultiplier = (level) => {
  return activityMap[level] || '1.2';
};

/**
 * TDEECalculator component calculates Total Daily Energy Expenditure (TDEE) and
 * Basal Metabolic Rate (BMR) using Mifflin-St Jeor formula.
 * Includes calorie target summaries for weight loss, maintenance, and gain.
 * On mount, it attempts to load profile settings from the current user.
 * 
 * @returns {JSX.Element} The TDEE Calculator page layout.
 */
export default function TDEECalculator() {
  const [weight, setWeight] = useState('70');
  const [height, setHeight] = useState('170');
  const [age, setAge] = useState('30');
  const [gender, setGender] = useState('male');
  const [activity, setActivity] = useState('1.55');
  const [calculatedResults, setCalculatedResults] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const response = await getProfile();
        if (response?.data?.profile) {
          const p = response.data.profile;
          if (p.weight_kg) setWeight(String(p.weight_kg));
          if (p.height_cm) setHeight(String(p.height_cm));
          if (p.age) setAge(String(p.age));
          if (p.gender) setGender(p.gender);
          if (p.activity_level) {
            const mappedMult = mapActivityToMultiplier(p.activity_level);
            setActivity(mappedMult);
            
            // Auto calculate on load if we have valid profile values
            const w = parseFloat(p.weight_kg);
            const h = parseFloat(p.height_cm);
            const a = parseFloat(p.age);
            const multiplier = parseFloat(mappedMult);
            if (w > 0 && h > 0 && a > 0) {
              let bmrVal = 0;
              if (p.gender === 'female') {
                bmrVal = 10 * w + 6.25 * h - 5 * a - 161;
              } else {
                bmrVal = 10 * w + 6.25 * h - 5 * a + 5;
              }
              setCalculatedResults({
                bmr: bmrVal,
                tdee: bmrVal * multiplier,
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to load user profile metrics:", err);
      } finally {
        setLoadingProfile(false);
      }
    }
    loadUserProfile();
  }, []);

  const handleCalculate = (e) => {
    if (e) e.preventDefault();
    const w = parseFloat(weight) || 0;
    const h = parseFloat(height) || 0;
    const a = parseFloat(age) || 0;
    const multiplier = parseFloat(activity) || 1.2;

    if (w > 0 && h > 0 && a > 0) {
      let bmrVal = 0;
      if (gender === 'male') {
        bmrVal = 10 * w + 6.25 * h - 5 * a + 5;
      } else {
        bmrVal = 10 * w + 6.25 * h - 5 * a - 161;
      }
      setCalculatedResults({
        bmr: bmrVal,
        tdee: bmrVal * multiplier,
      });
    }
  };

  const activityLabels = {
    '1.2': 'Sedentary (Little or no exercise)',
    '1.375': 'Light (1-3 days/week)',
    '1.55': 'Moderate (3-5 days/week)',
    '1.725': 'Very Active (6-7 days/week)',
    '1.9': 'Extra Active (Intense exercise / Physical job)',
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div>
        <h1 className="font-display font-extrabold text-3xl tracking-tight" style={{ color: '#fff' }}>
          TDEE Calculator
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Calculate your Total Daily Energy Expenditure and personalized nutrition goals
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Panel: Your Information */}
        <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#2d2d2d] shadow-lux flex flex-col justify-between min-h-[420px]">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-500">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-white">Your Information</h3>
                <p className="text-xs text-slate-400">Enter your details for accurate calculations</p>
              </div>
            </div>

            <form onSubmit={handleCalculate} className="space-y-4">
              {/* Gender Section */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Gender
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      gender === 'male'
                        ? 'bg-red-950/40 border-red-500 text-red-400 font-semibold'
                        : 'border-[#2d2d2d] bg-[#1e1e1e] text-slate-400 hover:text-white'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      gender === 'female'
                        ? 'bg-red-950/40 border-red-500 text-red-400 font-semibold'
                        : 'border-[#2d2d2d] bg-[#1e1e1e] text-slate-400 hover:text-white'
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>

              {/* Age, Height, Weight inputs */}
              <div>
                <label htmlFor="tdee-age" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Age (years)
                </label>
                <input
                  id="tdee-age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="30"
                  className="block w-full px-4 py-2.5 rounded-xl border border-[#2d2d2d] bg-[#1e1e1e] text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono text-sm"
                />
              </div>

              <div>
                <label htmlFor="tdee-height" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Height (cm)
                </label>
                <input
                  id="tdee-height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="170"
                  className="block w-full px-4 py-2.5 rounded-xl border border-[#2d2d2d] bg-[#1e1e1e] text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono text-sm"
                />
              </div>

              <div>
                <label htmlFor="tdee-weight" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Weight (kg)
                </label>
                <input
                  id="tdee-weight"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="70"
                  className="block w-full px-4 py-2.5 rounded-xl border border-[#2d2d2d] bg-[#1e1e1e] text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono text-sm"
                />
              </div>

              {/* Activity Level */}
              <div>
                <label htmlFor="tdee-activity" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Activity Level
                </label>
                <select
                  id="tdee-activity"
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  className="block w-full px-4 py-2.5 rounded-xl border border-[#2d2d2d] bg-[#1e1e1e] text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all cursor-pointer text-sm"
                >
                  <option value="1.2">{activityLabels['1.2']}</option>
                  <option value="1.375">{activityLabels['1.375']}</option>
                  <option value="1.55">{activityLabels['1.55']}</option>
                  <option value="1.725">{activityLabels['1.725']}</option>
                  <option value="1.9">{activityLabels['1.9']}</option>
                </select>
              </div>

              {/* Submit Button inside left card */}
              <button
                type="submit"
                className="w-full mt-4 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-red-700 hover:bg-red-800 active:scale-[0.98] transition-all cursor-pointer shadow-sm text-center"
              >
                Calculate TDEE
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel: Daily Calorie Needs */}
        <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#2d2d2d] shadow-lux min-h-[420px] flex flex-col justify-between">
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-500">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-white">Your Daily Calorie Needs</h3>
                <p className="text-xs text-slate-400">Based on your activity level</p>
              </div>
            </div>

            {calculatedResults ? (
              <div className="space-y-4 mt-4 animate-fade-in flex-1 flex flex-col justify-center">
                {/* Core Outputs */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="py-4 bg-[#121212] rounded-xl border border-[#2d2d2d]">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Basal Metabolic Rate</p>
                    <p className="text-2xl font-display font-black text-white mt-0.5 font-mono">
                      {Math.round(calculatedResults.bmr)} <span className="text-[11px] font-sans font-medium text-slate-400">kcal</span>
                    </p>
                  </div>
                  <div className="py-4 bg-[#121212] rounded-xl border border-[#2d2d2d]">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">TDEE Budget</p>
                    <p className="text-2xl font-display font-black text-red-400 mt-0.5 font-mono">
                      {Math.round(calculatedResults.tdee)} <span className="text-[11px] font-sans font-medium text-slate-400">kcal</span>
                    </p>
                  </div>
                </div>

                {/* Scenarios */}
                <div className="space-y-2 pt-2 border-t border-[#2d2d2d]">
                  <span className="text-xs text-white uppercase tracking-widest font-bold block mb-2 border-b border-[#2d2d2d] pb-2">Target Scenarios:</span>
                  
                  {/* Loss */}
                  <div className="flex justify-between items-center bg-[#121212] px-4 py-2.5 rounded-xl border border-[#2d2d2d]">
                    <div>
                      <p className="text-xs font-bold text-white">Weight Loss</p>
                      <p className="text-[10px] text-slate-600">-500 kcal deficit</p>
                    </div>
                    <p className="text-sm font-black font-mono" style={{ color: '#4ade80' }}>
                      {Math.max(1200, Math.round(calculatedResults.tdee - 500))} kcal
                    </p>
                  </div>

                  {/* Maintain */}
                  <div className="flex justify-between items-center bg-[#121212] px-4 py-2.5 rounded-xl border border-[#2d2d2d]">
                    <div>
                      <p className="text-xs font-bold text-white">Maintenance</p>
                      <p className="text-[10px] text-slate-600">Keep current weight</p>
                    </div>
                    <p className="text-sm font-black font-mono text-white">
                      {Math.round(calculatedResults.tdee)} kcal
                    </p>
                  </div>

                  {/* Gain */}
                  <div className="flex justify-between items-center bg-[#121212] px-4 py-2.5 rounded-xl border border-[#2d2d2d]">
                    <div>
                      <p className="text-xs font-bold text-white">Muscle Gain</p>
                      <p className="text-[10px] text-slate-600">+300 kcal surplus</p>
                    </div>
                    <p className="text-sm font-black font-mono" style={{ color: '#f87171' }}>
                      {Math.round(calculatedResults.tdee + 300)} kcal
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-12">
                <Target className="w-16 h-16 text-slate-700 mb-4 stroke-[1.2]" />
                <p className="text-sm text-slate-400 text-center font-medium max-w-[240px]">
                  Enter your information to calculate your TDEE
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

