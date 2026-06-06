import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getDailyLogs, getLogHistory, getRecentFoods, logFood } from '../api/foodLogApi.js';
import FoodSearch from './FoodSearch.jsx';
import CustomFoodForm from './CustomFoodForm.jsx';
import FoodLogTable from './FoodLogTable.jsx';
import CalorieHistory from './CalorieHistory.jsx';
import { calculatePreviewCalories } from './previewCalories.js';
import { CheckCircle2, ShieldAlert, Coffee, Utensils, Moon, Cookie, Scale, Plus, Sparkles, Loader2 } from 'lucide-react';

export default function FoodLogForm() {
  const [logs, setLogs] = useState([]);
  const [history, setHistory] = useState([]);
  const [recentFoods, setRecentFoods] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [portion, setPortion] = useState('');
  const [mealType, setMealType] = useState('breakfast');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    async function loadData() {
      try {
        const [logsRes, historyRes, recentRes] = await Promise.all([
          getDailyLogs(today),
          getLogHistory(7),
          getRecentFoods(),
        ]);
        setLogs(logsRes.data || []);
        setHistory(historyRes.data || []);
        setRecentFoods(recentRes.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [today]);

  useEffect(() => {
    const handleUpdate = () => {
      refreshData();
    };
    window.addEventListener('health-system-update', handleUpdate);
    return () => {
      window.removeEventListener('health-system-update', handleUpdate);
    };
  }, [today]);

  async function refreshData() {
    try {
      const [logsRes, historyRes, recentRes] = await Promise.all([
        getDailyLogs(today),
        getLogHistory(7),
        getRecentFoods(),
      ]);
      setLogs(logsRes.data || []);
      setHistory(historyRes.data || []);
      setRecentFoods(recentRes.data || []);
    } catch {
      // Silently fail — user can refresh
    }
  }

  const handleFoodSelect = (food) => {
    setSelectedFood(food);
    setPortion('100');
    setError('');
    setSuccessMsg('');
  };

  const handleQuickAdd = (food) => {
    const per100g = food.last_portion_grams !== undefined && food.last_portion_grams !== null
      ? Math.round((food.calories * 100) / food.last_portion_grams)
      : food.calories;
    setSelectedFood({ id: food.food_id, name: food.name, calories_per_100g: per100g });
    setPortion(String(food.last_portion_grams || 100));
    setError('');
    setSuccessMsg('');
  };

  const handleLogFood = async () => {
    if (!selectedFood) {
      setError('Please select a food first');
      return;
    }
    if (!portion || parseInt(portion, 10) < 1 || parseInt(portion, 10) > 5000) {
      setError('Portion must be between 1 and 5000 grams');
      return;
    }

    try {
      setError('');
      setSuccessMsg('');

      if (selectedFood.id) {
        await logFood({
          foodId: selectedFood.id,
          portionGrams: parseInt(portion, 10),
          logDate: today,
          mealType,
        });
      } else {
        const portionGrams = parseInt(portion, 10);
        const totalCalories = calculatePreviewCalories(selectedFood.calories_per_100g, portionGrams);
        await logFood({
          customFoodName: selectedFood.name,
          calories: totalCalories,
          portionGrams,
          logDate: today,
          mealType,
        });
      }

      setSuccessMsg(`Food intake logged: ${selectedFood.name}`);
      setSelectedFood(null);
      setPortion('');
      await refreshData();
      window.dispatchEvent(new CustomEvent('health-system-update'));
    } catch (err) {
      setError(err.message || 'Failed to save food log');
    }
  };

  const handleCustomFoodSuccess = async () => {
    setShowCustomForm(false);
    await refreshData();
    window.dispatchEvent(new CustomEvent('health-system-update'));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-xs font-semibold animate-pulse">Accessing food log...</p>
      </div>
    );
  }

  const previewCalories = calculatePreviewCalories(selectedFood?.calories_per_100g, portion);

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex gap-2.5 p-3.5 rounded-xl text-sm items-center" style={{ background: 'rgba(153,27,27,0.25)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
          <ShieldAlert className="w-5 h-5 flex-shrink-0" style={{ color: '#f87171' }} />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex gap-2.5 p-3.5 rounded-xl text-sm items-center" style={{ background: 'rgba(6,78,59,0.25)', border: '1px solid rgba(52,211,153,0.3)', color: '#6ee7b7' }}>
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#34d399' }} />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      <FoodSearch
        onFoodSelect={handleFoodSelect}
        onToggleCustomForm={() => setShowCustomForm(!showCustomForm)}
      />

      {showCustomForm && (
        <div className="p-5 rounded-2xl border shadow-sm" style={{ background: '#151515', borderColor: '#2a2a2a' }}>
          <h3 className="font-display font-semibold text-sm text-white mb-4 flex items-center gap-1.5 border-b pb-2" style={{ borderColor: '#2a2a2a' }}>
            <Plus className="w-4 h-4 text-red-500" />
            Add New Custom Food
          </h3>
          <CustomFoodForm
            onSuccess={handleCustomFoodSuccess}
            onCancel={() => setShowCustomForm(false)}
          />
        </div>
      )}

      {/* Editor/Confirmation sub-panel when a search item is chosen */}
      {selectedFood && (
        <div className="p-5 rounded-2xl border relative overflow-hidden space-y-4" style={{ background: '#161616', borderColor: '#2a2a2a' }}>
          <div className="absolute top-0 right-0 p-8 pointer-events-none" style={{ color: 'rgba(185,28,28,0.06)' }}>
            <Sparkles className="w-16 h-16" />
          </div>

          <div className="relative z-10">
            <h3 className="text-base font-bold text-white flex items-center justify-between">
              <span>{selectedFood.name}</span>
              {selectedFood.calories_per_100g && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md font-mono" style={{ background: 'rgba(185,28,28,0.15)', border: '1px solid rgba(185,28,28,0.25)', color: '#f87171' }}>
                  {selectedFood.calories_per_100g} kcal / 100g
                </span>
              )}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Portion grams */}
            <div>
              <label htmlFor="portion" className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#666' }}>
                Portion Eaten (grams)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: '#555' }}>
                  <Scale className="w-4 h-4" />
                </div>
                <input
                  id="portion"
                  type="number"
                  value={portion}
                  onChange={(e) => setPortion(e.target.value)}
                  min="1"
                  max="5000"
                  placeholder="e.g. 150"
                  className="block w-full pl-9 pr-3 py-2 text-sm rounded-lg font-mono focus:outline-none transition-all"
                  style={{ background: '#222', border: '1px solid #333', color: '#fff' }}
                />
              </div>
            </div>

            {/* Meal type selection */}
            <div>
              <label htmlFor="mealType" className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#666' }}>
                Meal Category
              </label>
              <select
                id="mealType"
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="block w-full px-3 py-2 text-sm rounded-lg focus:outline-none transition-all cursor-pointer"
                style={{ background: '#222', border: '1px solid #333', color: '#fff' }}
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
          </div>

          {/* Calorie preview */}
          {previewCalories !== null && (
            <div className="flex justify-between items-center px-3 py-2 rounded-lg" style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}>
              <span className="text-xs font-semibold" style={{ color: '#666' }}>Estimated Calories:</span>
              <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded" style={{ background: 'rgba(180,83,9,0.2)', border: '1px solid rgba(217,119,6,0.3)', color: '#fbbf24' }}>
                {parseInt(portion, 10 || 0)}g = ~{previewCalories} kcal
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setSelectedFood(null)}
              className="flex-1 py-2 px-4 rounded-xl text-xs font-semibold cursor-pointer text-center transition-all"
              style={{ border: '1px solid #333', color: '#888', background: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#222'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              Cancel
            </button>
            <button
              onClick={handleLogFood}
              className="flex-2 flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-sm"
              style={{ background: '#b91c1c' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#b91c1c'; }}
            >
              Log Intake
            </button>
          </div>
        </div>
      )}

      <div className="border-t pt-6" style={{ borderColor: '#222' }}>
        <FoodLogTable logs={logs} recentFoods={recentFoods} onQuickAdd={handleQuickAdd} />
      </div>

      <div className="border-t pt-6" style={{ borderColor: '#222' }}>
        <CalorieHistory history={history} />
      </div>
    </div>
  );
}
