import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { getDaily, getLogHistory, getRecentFoods, logFood, deleteFoodLog } from '../api/foodLogApi.js';
import { calculatePreviewCalories } from '../utils/previewCalories.js';

export function useFoodLog() {
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
  const [submitting, setSubmitting] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  const loadData = useCallback(async () => {
    try {
      const [dailyRes, historyRes, recentRes] = await Promise.all([
        getDaily(today),
        getLogHistory(7),
        getRecentFoods(),
      ]);
      setLogs(dailyRes.data?.logs || []);
      setHistory(historyRes.data || []);
      setRecentFoods(recentRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshDailyLogs = async () => {
    try {
      const res = await getDaily(today);
      setLogs(res.data?.logs || []);
    } catch {
      // Silently fail
    }
  };

  const refreshRecentFoods = async () => {
    try {
      const res = await getRecentFoods();
      setRecentFoods(res.data || []);
    } catch {
      // Silently fail
    }
  };

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
    if (submitting) return;
    if (!selectedFood) {
      setError('Please select a food first');
      return;
    }
    if (!portion || parseInt(portion, 10) < 1 || parseInt(portion, 10) > 5000) {
      setError('Portion must be between 1 and 5000 grams');
      return;
    }

    try {
      setSubmitting(true);
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
      await refreshDailyLogs();
      await refreshRecentFoods();
      window.dispatchEvent(new CustomEvent('health-system-update', { detail: { type: 'food-log' } }));
    } catch (err) {
      setError(err.message || 'Failed to save food log');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLog = async (logId) => {
    try {
      setError('');
      setSuccessMsg('');
      await deleteFoodLog(logId);
      setSuccessMsg('Food entry removed.');
      await refreshDailyLogs();
      window.dispatchEvent(new CustomEvent('health-system-update', { detail: { type: 'food-log' } }));
    } catch (err) {
      setError(err.message || 'Failed to delete food entry');
    }
  };

  const handleCustomFoodSuccess = async () => {
    setShowCustomForm(false);
    await refreshDailyLogs();
    await refreshRecentFoods();
    window.dispatchEvent(new CustomEvent('health-system-update', { detail: { type: 'food-log' } }));
  };

  return {
    logs,
    history,
    recentFoods,
    selectedFood,
    setSelectedFood,
    portion,
    setPortion,
    mealType,
    setMealType,
    showCustomForm,
    setShowCustomForm,
    error,
    successMsg,
    loading,
    submitting,
    handleFoodSelect,
    handleQuickAdd,
    handleLogFood,
    handleDeleteLog,
    handleCustomFoodSuccess,
  };
}
