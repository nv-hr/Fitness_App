import { useState, useEffect } from 'react';
import { searchFoods } from '../api/foodLogApi.js';
import { Search, Loader2, Plus, Sparkles, AlertCircle } from 'lucide-react';

const categoryLabels = {
  proteins: 'Protein 💪',
  carbs: 'Carbohydrates 🌾',
  vegetables: 'Vegetables 🥦',
  fruits: 'Fruits 🍎',
  dairy: 'Dairy 🥛',
  fats: 'Healthy Fats 🥑',
  drinks: 'Beverages 💧',
  other: 'Other 🍽️',
};

export default function FoodSearch({ onFoodSelect, onToggleCustomForm }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await searchFoods(query);
        setResults(response.data || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-3">
      <label htmlFor="food_search_input" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
        Search Food Database
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          id="food_search_input"
          type="text"
          placeholder="Type food name (e.g. Rice, Boiled Egg, chicken breast...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="block w-full pl-10 pr-3.5 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-455 focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-100 focus:bg-white transition-all font-medium"
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
          </div>
        )}
      </div>

      {/* Query Status Indicators */}
      {query.length >= 2 && !loading && results.length === 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 font-medium">
          <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>Food not found. Would you like to add it to your custom database?</span>
        </div>
      )}

      {/* Suggestion Dropdown List */}
      {results.length > 0 && (
        <div className="max-h-60 overflow-y-auto border border-slate-200/80 rounded-xl mt-1.5 divide-y divide-slate-100 bg-white shadow-lux">
          {results.map((food) => (
            <div
              key={food.id}
              onClick={() => {
                onFoodSelect(food);
                setQuery('');
              }}
              className="px-4 py-3 text-sm flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors group select-none"
            >
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-700 block group-hover:text-emerald-600 transition-colors">
                  {food.name}
                </span>
                {food.category && (
                  <span className="inline-block text-[10px] bg-slate-100 text-slate-550 border border-slate-200/40 px-1.5 py-0.5 rounded-md font-semibold mt-1">
                    {categoryLabels[food.category] || food.category}
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-550 font-mono text-slate-650">
                  {food.calories_per_100g} <span className="text-[10px] font-sans font-medium text-slate-400 font-mono">kcal/100g</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trigger Custom Form Button */}
      <button
        onClick={onToggleCustomForm}
        className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2.5 px-4 bg-slate-100 hover:bg-slate-200/80 active:scale-98 transition-all font-bold text-xs text-slate-700 rounded-xl cursor-pointer"
      >
        <Plus className="w-4 h-4 text-emerald-500" />
        Add Custom Food
      </button>
    </div>
  );
}
