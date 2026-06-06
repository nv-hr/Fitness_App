import { useState, useEffect } from 'react';
import { format } from 'date-fns';
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

  const today = format(new Date(), 'yyyy-MM-dd');

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
          <h1 className="font-display font-extrabold text-3xl tracking-tight" style={{ color: '#fff' }}>
            Daily Food Log
          </h1>
          <p className="text-[#666] text-sm mt-1 leading-relaxed">
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
      <div style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }} className="p-1 rounded-2xl flex max-w-md">
        <button
          onClick={() => setActiveTab('plan')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'plan'
              ? 'bg-[#2d2d2d] text-red-400 shadow-sm'
              : 'text-[#555] hover:text-[#aaa]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          AI Planned Nutrition
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'log'
              ? 'bg-[#2d2d2d] text-red-400 shadow-sm'
              : 'text-[#555] hover:text-[#aaa]'
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
        <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-2xl border border-[#2a2a2a] shadow-lux">
          <h2 className="font-display font-bold text-lg text-white border-b border-[#2a2a2a] pb-3 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-red-600 rounded-full inline-block"></span>
            Log New Meals
          </h2>
          <FoodLogForm />
        </div>
      )}
    </div>
  );
}
