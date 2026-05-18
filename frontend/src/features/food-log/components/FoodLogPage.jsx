import { useState, useEffect } from 'react';
import { getDailySummary, getDailyLogs, getLogHistory, getRecentFoods, logFood } from '../api/foodLogApi.js';
import CalorieSummary from './CalorieSummary.jsx';
import FoodSearch from './FoodSearch.jsx';
import CustomFoodForm from './CustomFoodForm.jsx';
import FoodLogTable from './FoodLogTable.jsx';
import CalorieHistory from './CalorieHistory.jsx';
import { calculatePreviewCalories } from './previewCalories.js';
import { t } from '../../../shared/i18n/translations.js';

export default function FoodLogPage() {
  const [summary, setSummary] = useState(null);
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

  const today = new Date().toISOString().split('T')[0];

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [summaryRes, logsRes, historyRes, recentRes] = await Promise.all([
          getDailySummary(today),
          getDailyLogs(today),
          getLogHistory(7),
          getRecentFoods(),
        ]);
        setSummary(summaryRes.data);
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

  async function refreshData() {
    try {
      const [summaryRes, logsRes, historyRes, recentRes] = await Promise.all([
        getDailySummary(today),
        getDailyLogs(today),
        getLogHistory(7),
        getRecentFoods(),
      ]);
      setSummary(summaryRes.data);
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
    // Derive per-100g from total calories and last portion (CR-01 fix)
    const per100g = food.last_portion_grams
      ? Math.round((food.calories * 100) / food.last_portion_grams)
      : food.calories;
    setSelectedFood({ id: food.food_id, name: food.name, calories_per_100g: per100g });
    setPortion(String(food.last_portion_grams || 100));
    setError('');
    setSuccessMsg('');
  };

  const handleLogFood = async () => {
    if (!selectedFood) {
      setError('Select a food first');
      return;
    }
    if (!portion || parseInt(portion, 10) < 1 || parseInt(portion, 10) > 5000) {
      setError('Portion must be between 1-5000 grams');
      return;
    }

    try {
      setError('');
      setSuccessMsg('');

      if (selectedFood.id) {
        // Seeded food — server calculates calories
        await logFood({
          foodId: selectedFood.id,
          portionGrams: parseInt(portion, 10),
          logDate: today,
          mealType,
        });
      } else {
        // Custom one-off — calculate total calories for the portion (CR-02 fix)
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

      setSuccessMsg(t('foodLog.foodLogged'));
      setSelectedFood(null);
      setPortion('');
      await refreshData();
    } catch (err) {
      setError(err.message || t('foodLog.logError'));
    }
  };

  const handleCustomFoodSuccess = async () => {
    setShowCustomForm(false);
    await refreshData();
  };

  if (loading) {
    return <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>{t('auth.loading')}</div>;
  }

  const previewCalories = calculatePreviewCalories(selectedFood?.calories_per_100g, portion);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      <h2>{t('foodLog.title')}</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMsg && <p style={{ color: '#16a34a' }}>{successMsg}</p>}

      {/* Calorie Summary Bar (D-36) */}
      {summary && (
        <CalorieSummary
          totalConsumed={summary.totalConsumed}
          calorieTarget={summary.calorieTarget}
          remaining={summary.remaining}
          isExtremeDeficit={summary.isExtremeDeficit}
        />
      )}

      {/* Food Search (D-35) */}
      <FoodSearch
        onFoodSelect={handleFoodSelect}
        onToggleCustomForm={() => setShowCustomForm(!showCustomForm)}
      />

      {/* Custom Food Form (D-37) */}
      {showCustomForm && (
        <CustomFoodForm
          onSuccess={handleCustomFoodSuccess}
          onCancel={() => setShowCustomForm(false)}
        />
      )}

      {/* Portion + Meal Type + Log Button */}
      {selectedFood && (
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
          background: '#fafafa',
        }}>
          <p style={{ margin: '0 0 0.75rem 0', fontWeight: 'bold' }}>
            {selectedFood.name}
            {selectedFood.calories_per_100g && (
              <span style={{ fontWeight: 'normal', color: '#666' }}>
                {' '}— {selectedFood.calories_per_100g} kcal/100g
              </span>
            )}
          </p>

          <div style={{ marginBottom: '0.75rem' }}>
            <label htmlFor="portion">{t('foodLog.portion')}</label>
            <input
              id="portion"
              type="number"
              value={portion}
              onChange={(e) => setPortion(e.target.value)}
              min="1"
              max="5000"
              style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem', boxSizing: 'border-box' }}
            />
          </div>

          {previewCalories !== null && (
            <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: '#666' }}>
              {parseInt(portion, 10)}g = {previewCalories} kcal
            </p>
          )}

          <div style={{ marginBottom: '0.75rem' }}>
            <label htmlFor="mealType">{t('foodLog.mealType')}</label>
            <select
              id="mealType"
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem', boxSizing: 'border-box' }}
            >
              <option value="breakfast">{t('foodLog.sarapan')}</option>
              <option value="lunch">{t('foodLog.makanSiang')}</option>
              <option value="dinner">{t('foodLog.makanMalam')}</option>
              <option value="snack">{t('foodLog.camilan')}</option>
            </select>
          </div>

          <button
            onClick={handleLogFood}
            style={{ width: '100%', padding: '0.75rem 1rem', cursor: 'pointer', minHeight: '44px' }}
          >
            {t('foodLog.logFood')}
          </button>
        </div>
      )}

      {/* Today's Log + Quick Add */}
      <FoodLogTable logs={logs} recentFoods={recentFoods} onQuickAdd={handleQuickAdd} />

      {/* Calorie History */}
      <CalorieHistory history={history} />
    </div>
  );
}
