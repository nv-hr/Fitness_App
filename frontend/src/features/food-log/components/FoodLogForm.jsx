import { useState, useEffect } from 'react';
import { getDailyLogs, getLogHistory, getRecentFoods, logFood } from '../api/foodLogApi.js';
import FoodSearch from './FoodSearch.jsx';
import CustomFoodForm from './CustomFoodForm.jsx';
import FoodLogTable from './FoodLogTable.jsx';
import CalorieHistory from './CalorieHistory.jsx';
import { calculatePreviewCalories } from './previewCalories.js';

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

  const today = new Date().toISOString().split('T')[0];

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

      setSuccessMsg('Food logged successfully');
      setSelectedFood(null);
      setPortion('');
      await refreshData();
    } catch (err) {
      setError(err.message || 'Failed to log food');
    }
  };

  const handleCustomFoodSuccess = async () => {
    setShowCustomForm(false);
    await refreshData();
  };

  if (loading) {
    return <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>{'Loading...'}</div>;
  }

  const previewCalories = calculatePreviewCalories(selectedFood?.calories_per_100g, portion);

  return (
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMsg && <p style={{ color: '#16a34a' }}>{successMsg}</p>}

      <FoodSearch
        onFoodSelect={handleFoodSelect}
        onToggleCustomForm={() => setShowCustomForm(!showCustomForm)}
      />

      {showCustomForm && (
        <CustomFoodForm
          onSuccess={handleCustomFoodSuccess}
          onCancel={() => setShowCustomForm(false)}
        />
      )}

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
            <label htmlFor="portion">{'Portion (grams)'}</label>
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
            <label htmlFor="mealType">{'Meal Type'}</label>
            <select
              id="mealType"
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem', boxSizing: 'border-box' }}
            >
              <option value="breakfast">{'Breakfast'}</option>
              <option value="lunch">{'Lunch'}</option>
              <option value="dinner">{'Dinner'}</option>
              <option value="snack">{'Snack'}</option>
            </select>
          </div>

          <button
            onClick={handleLogFood}
            style={{ width: '100%', padding: '0.75rem 1rem', cursor: 'pointer', minHeight: '44px' }}
          >
            {'Log Food'}
          </button>
        </div>
      )}

      <FoodLogTable logs={logs} recentFoods={recentFoods} onQuickAdd={handleQuickAdd} />

      <CalorieHistory history={history} />
    </div>
  );
}