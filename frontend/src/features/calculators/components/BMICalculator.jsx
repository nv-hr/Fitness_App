import { useState, useEffect } from 'react';
import { Scale, Heart, ShieldAlert, Sparkles, User, Calendar, Calculator } from 'lucide-react';
import { getProfile } from '../../profile/api/profileApi.js';

/**
 * BMICalculator component allows users to input weight and height in Metric or Imperial
 * units and receive Body Mass Index (BMI) calculations with age/gender-adjusted
 * category guidance.
 *
 * @returns {JSX.Element} The BMI Calculator page layout.
 */
export default function BMICalculator() {
  const [unitSystem, setUnitSystem] = useState('metric');
  const [weight, setWeight] = useState('70');
  const [heightCm, setHeightCm] = useState('170');
  const [heightFt, setHeightFt] = useState('5');
  const [heightIn, setHeightIn] = useState('7');
  const [age, setAge] = useState('25');
  const [gender, setGender] = useState('male');
  const [calculatedResults, setCalculatedResults] = useState(null);

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const response = await getProfile();
        if (response?.data?.profile) {
          const p = response.data.profile;
          if (p.weight_kg) setWeight(String(p.weight_kg));
          if (p.height_cm) setHeightCm(String(p.height_cm));
          if (p.age) setAge(String(p.age));
          if (p.gender) setGender(p.gender);

          // Auto calculate on mount using profile metrics (Metric system initially)
          const w = parseFloat(p.weight_kg);
          const h = parseFloat(p.height_cm);
          if (w > 0 && h > 0) {
            setCalculatedResults({
              bmi: w / ((h / 100) * (h / 100)),
              age: p.age || 25,
              gender: p.gender || 'male',
            });
          }
        }
      } catch (err) {
        console.error("Failed to load user profile in BMI:", err);
      }
    }
    loadUserProfile();
  }, []);

  const handleUnitSystemChange = (system) => {
    if (system === 'imperial' && unitSystem === 'metric') {
      const wKg = parseFloat(weight) || 0;
      const hCm = parseFloat(heightCm) || 0;
      if (wKg > 0) {
        setWeight(Math.round(wKg * 2.20462).toString());
      }
      if (hCm > 0) {
        const totalInches = hCm / 2.54;
        const ft = Math.floor(totalInches / 12);
        const inch = Math.round(totalInches % 12);
        setHeightFt(ft.toString());
        setHeightIn(inch.toString());
      }
    } else if (system === 'metric' && unitSystem === 'imperial') {
      const wLbs = parseFloat(weight) || 0;
      const hFt = parseFloat(heightFt) || 0;
      const hIn = parseFloat(heightIn) || 0;
      if (wLbs > 0) {
        setWeight(Math.round(wLbs / 2.20462).toString());
      }
      const totalInches = (hFt * 12) + hIn;
      if (totalInches > 0) {
        setHeightCm(Math.round(totalInches * 2.54).toString());
      }
    }
    setUnitSystem(system);
  };

  const handleCalculate = (e) => {
    if (e) e.preventDefault();
    let bmiVal = 0;
    const ageVal = parseInt(age, 10) || 25;
    const genderVal = gender || 'male';

    if (unitSystem === 'metric') {
      const w = parseFloat(weight) || 0;
      const h = parseFloat(heightCm) || 0;
      if (w > 0 && h > 0) {
        bmiVal = w / ((h / 100) * (h / 100));
      }
    } else {
      const w = parseFloat(weight) || 0;
      const hFt = parseFloat(heightFt) || 0;
      const hIn = parseFloat(heightIn) || 0;
      const totalInches = (hFt * 12) + hIn;
      if (w > 0 && totalInches > 0) {
        bmiVal = (w / (totalInches * totalInches)) * 703;
      }
    }

    if (bmiVal > 0) {
      setCalculatedResults({
        bmi: bmiVal,
        age: ageVal,
        gender: genderVal,
      });
    }
  };

  const getBmiStatus = (val, userAge, userGender) => {
    if (val <= 0) return { label: 'Enter metrics', color: 'text-slate-400', border: 'border-slate-800' };

    const normalUpper = userAge >= 65 ? 27 : 25;
    const genderLabel = userGender === 'female' ? 'women' : 'men';

    if (val < 18.5) {
      return {
        label: 'Underweight',
        color: 'text-sky-400',
        bg: 'bg-sky-950/30',
        border: 'border-sky-900/40',
        desc: `Your BMI suggests you are below the healthy weight range for ${genderLabel} aged ${userAge || '—'}. Consider consulting a nutritionist to plan a balanced calorie surplus.`,
      };
    }
    if (val < normalUpper) {
      return {
        label: 'Normal Weight',
        color: 'text-emerald-400',
        bg: 'bg-emerald-950/30',
        border: 'border-emerald-900/40',
        desc: `Great job! Your BMI falls within the healthy range for ${genderLabel} aged ${userAge || '—'}. Maintain your activity level and balanced diet.`,
      };
    }
    if (val < 30) {
      return {
        label: 'Overweight',
        color: 'text-amber-400',
        bg: 'bg-amber-950/30',
        border: 'border-amber-900/40',
        desc: `Your BMI is slightly above the healthy range for ${genderLabel} aged ${userAge || '—'}. Moderate cardio and a slight calorie deficit can help.`,
      };
    }
    return {
      label: 'Obese',
      color: 'text-red-400',
      bg: 'bg-red-950/30',
      border: 'border-red-900/40',
      desc: `Your BMI falls into the obese category for ${genderLabel} aged ${userAge || '—'}. We suggest consulting a doctor or fitness professional for a safe plan.`,
    };
  };

  const status = calculatedResults ? getBmiStatus(calculatedResults.bmi, calculatedResults.age, calculatedResults.gender) : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div>
        <h1 className="font-display font-extrabold text-3xl tracking-tight" style={{ color: '#fff' }}>
          BMI Calculator
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Calculate your Body Mass Index to understand your health status
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Panel: Calculate BMI inputs */}
        <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#2d2d2d] shadow-lux flex flex-col justify-between min-h-[420px]">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-500">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-white">Calculate BMI</h3>
                <p className="text-xs text-slate-400">Enter your measurements below</p>
              </div>
            </div>

            <form onSubmit={handleCalculate} className="space-y-4">
              {/* Unit System selection */}
              <div>
                <label htmlFor="bmi-unit" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Unit System
                </label>
                <select
                  id="bmi-unit"
                  value={unitSystem}
                  onChange={(e) => handleUnitSystemChange(e.target.value)}
                  className="block w-full px-4 py-2.5 rounded-xl border border-[#2d2d2d] bg-[#1e1e1e] text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all cursor-pointer text-sm"
                >
                  <option value="metric">Metric (cm, kg)</option>
                  <option value="imperial">Imperial (in, lbs)</option>
                </select>
              </div>

              {/* Height input fields */}
              {unitSystem === 'metric' ? (
                <div>
                  <label htmlFor="bmi-height" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Height (cm)
                  </label>
                  <input
                    id="bmi-height"
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="170"
                    className="block w-full px-4 py-2.5 rounded-xl border border-[#2d2d2d] bg-[#1e1e1e] text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono text-sm"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Height
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={heightFt}
                        onChange={(e) => setHeightFt(e.target.value)}
                        placeholder="5"
                        className="block w-full px-4 py-2.5 rounded-xl border border-[#2d2d2d] bg-[#1e1e1e] text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono text-sm"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">ft</span>
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        value={heightIn}
                        onChange={(e) => setHeightIn(e.target.value)}
                        placeholder="7"
                        className="block w-full px-4 py-2.5 rounded-xl border border-[#2d2d2d] bg-[#1e1e1e] text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono text-sm"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">in</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Weight input fields */}
              <div>
                <label htmlFor="bmi-weight" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Weight ({unitSystem === 'metric' ? 'kg' : 'lbs'})
                </label>
                <input
                  id="bmi-weight"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder={unitSystem === 'metric' ? '70' : '150'}
                  className="block w-full px-4 py-2.5 rounded-xl border border-[#2d2d2d] bg-[#1e1e1e] text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono text-sm"
                />
              </div>

              {/* Calculate Button */}
              <button
                type="submit"
                className="w-full mt-4 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-red-700 hover:bg-red-800 active:scale-[0.98] transition-all cursor-pointer shadow-sm text-center"
              >
                Calculate BMI
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel: Your Results */}
        <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#2d2d2d] shadow-lux min-h-[420px] flex flex-col justify-between">
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-500">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-white">Your Results</h3>
                <p className="text-xs text-slate-400">BMI calculation and category</p>
              </div>
            </div>

            {calculatedResults && status ? (
              <div className="space-y-5 mt-4 animate-fade-in flex-1 flex flex-col justify-center">
                <div className="text-center p-6 bg-slate-900 rounded-xl border border-slate-700 relative overflow-hidden" style={{ background: '#1a1a1a' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
                <p className="text-sm font-semibold text-slate-400 mb-2 relative z-10">Your BMI Is</p>
                <div className="font-display font-bold text-5xl text-emerald-400 tracking-tight relative z-10">
                  {calculatedResults.bmi.toFixed(1)}
                </div>
                  <span className={`inline-block mt-2 px-3.5 py-1 rounded-full text-xs font-bold ${status.bg} ${status.color} border ${status.border}`}>
                    {status.label}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    {calculatedResults.gender === 'female' ? 'Female' : 'Male'}, {calculatedResults.age > 0 ? `${calculatedResults.age} years old` : '—'}
                  </p>
                </div>

                <div className={`p-4 rounded-xl border ${status.bg} ${status.border} text-xs leading-relaxed`}>
                  <p className={`font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5 text-white mb-2 pb-1 border-b ${status.border}`}>
                    <Heart className={`w-4 h-4 ${status.color}`} />
                    Health Guidance
                  </p>
                  <p className="text-white font-medium">
                    {status.desc}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-12">
                <Calculator className="w-16 h-16 text-slate-700 mb-4 stroke-[1.2]" />
                <p className="text-sm text-slate-400 text-center font-medium max-w-[240px]">
                  Enter your measurements to see your BMI
                </p>
              </div>
            )}

            {calculatedResults && (
              <div className="border-t border-[#2d2d2d] pt-4 mt-2">
                <span className="text-[10px] text-slate-500 block uppercase tracking-widest font-semibold">
                  Standard Ranges:
                </span>
                <div className="grid grid-cols-4 gap-1 text-[9px] font-bold text-center mt-2 font-mono">
                  <div className="bg-sky-950/20 text-sky-400 py-1 rounded border border-sky-950/40">&lt;18.5</div>
                  <div className="bg-emerald-950/20 text-emerald-400 py-1 rounded border border-emerald-950/40">18.5-25</div>
                  <div className="bg-amber-950/20 text-amber-400 py-1 rounded border border-amber-950/40">25-30</div>
                  <div className="bg-red-950/20 text-red-400 py-1 rounded border border-red-950/40">30+</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
