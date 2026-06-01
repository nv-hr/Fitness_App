import { useState, useEffect } from 'react';
import { getDailySummary } from '../api/foodLogApi.js';
import CalorieSummary from './CalorieSummary.jsx';
import FoodLogForm from './FoodLogForm.jsx';
import MealCalendarSection from './MealCalendarSection.jsx';
import { Calendar, Apple, Loader2 } from 'lucide-react';

export default function FoodLogPage() {
  const [activeTab, setActiveTab] = useState('plan');
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function loadSummary() {
      try {
        setSummaryLoading(true);
        const res = await getDailySummary(today);
        setSummary(res.data);
      } catch {
        // Silently fail
      } finally {
        setSummaryLoading(false);
      }
    }
    loadSummary();
  }, [today, refreshTrigger]);

  useEffect(() => {
    const handleUpdate = () => {
      setRefreshTrigger((prev) => prev + 1);
    };
    window.addEventListener('health-system-update', handleUpdate);
    return () => {
      window.removeEventListener('health-system-update', handleUpdate);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header section with page title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-slate-850 tracking-tight text-slate-800">
            Food & Diet Journal
          </h1>
          <p className="text-slate-500 text-sm mt-1 leading-relaxed">
            Log your actual calorie intake or access an AI curated meal plan personalized to your biometrics.
          </p>
        </div>
      </div>

      {/* Embedded Summary Widget */}
      {!summaryLoading && summary ? (
        <CalorieSummary
          totalConsumed={summary.totalConsumed}
          calorieTarget={summary.calorieTarget}
          remaining={summary.remaining}
          isExtremeDeficit={summary.isExtremeDeficit}
        />
      ) : (
        <div className="h-28 bg-slate-150 rounded-2xl animate-pulse bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Connecting daily calorie log...
        </div>
      )}

      {/* Tactile Segmented Sliding Navigation Bar */}
      <div className="bg-slate-100/80 backdrop-blur-xs p-1 rounded-2xl flex max-w-md border border-slate-200/20">
        <button
          onClick={() => setActiveTab('plan')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'plan'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          AI Planned Nutrition
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'log'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Apple className="w-4 h-4" />
          Log Food Intakes
        </button>
      </div>

      {/* Main Core Form Display Area */}
      {activeTab === 'plan' && (
        <MealCalendarSection />
      )}

      {activeTab === 'log' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/50 shadow-lux">
          <h2 className="font-display font-bold text-lg text-slate-800 border-b border-slate-100 pb-3 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-emerald-500 rounded-full inline-block"></span>
            Log New Meals
          </h2>
          <FoodLogForm />
        </div>
      )}
    </div>
  );
}
