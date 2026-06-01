import { Sparkles, ArrowRight, Zap, Coffee, Utensils, Moon, Cookie, Plus, AlertCircle } from 'lucide-react';

const mealTypeLabels = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const mealIconLabels = {
  breakfast: Coffee,
  lunch: Utensils,
  dinner: Moon,
  snack: Cookie,
};

const mealTypeOrder = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function FoodLogTable({ logs, recentFoods, onQuickAdd }) {
  // Group logs by meal_type
  const grouped = {};
  for (const mealType of mealTypeOrder) {
    grouped[mealType] = [];
  }
  for (const log of logs) {
    const mt = log.meal_type;
    if (!grouped[mt]) grouped[mt] = [];
    grouped[mt].push(log);
  }

  const totalCalories = logs.reduce((sum, log) => sum + (log.calories || 0), 0);

  if (logs.length === 0 && (!recentFoods || recentFoods.length === 0)) {
    return (
      <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400">
        <AlertCircle className="w-8 h-8 text-slate-350 mx-auto mb-2" />
        <p className="text-sm font-semibold">Your food log for today is empty.</p>
        <p className="text-xs mt-1">Use the search box above to add foods you have eaten recently!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Log Card list */}
      {logs.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-slate-205 border-slate-200/50 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-sm text-slate-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 pb-2.5">
            <span className="w-1.5 h-3.5 bg-emerald-500 rounded-full inline-block"></span>
            Today's Logs
          </h3>

          <div className="space-y-4">
            {mealTypeOrder.map((mealType) => {
              const entries = grouped[mealType];
              if (!entries || entries.length === 0) return null;
              const MealIcon = mealIconLabels[mealType] || Utensils;

              return (
                <div key={mealType} className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MealIcon className="w-3.5 h-3.5 text-slate-500" />
                    {mealTypeLabels[mealType]}
                  </h4>
                  <div className="divide-y divide-slate-100 bg-slate-50/40 rounded-xl border border-slate-100 px-3 py-1">
                    {entries.map((log) => (
                      <div
                        key={log.id}
                        className="flex justify-between items-center py-2.5 text-sm"
                      >
                        <span className="font-semibold text-slate-600">{log.food_name || log.custom_food_name}</span>
                        <span className="text-xs font-bold text-slate-500 font-mono">
                          {log.portion_grams}g <span className="text-slate-350 font-sans">•</span> {log.calories} kcal
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Today's logged total energy calorie summary bar */}
          <div className="border-t border-slate-200/80 pt-4 flex justify-between items-center bg-slate-900 text-white rounded-xl px-4 py-3.5 mt-2 shadow-inner">
            <span className="font-display font-bold text-sm flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
              Daily Total
            </span>
            <span className="font-display font-black text-lg text-amber-300 font-mono">
              {totalCalories} kcal
            </span>
          </div>
        </div>
      )}

      {/* Quick Add Recent Panel */}
      {recentFoods && recentFoods.length > 0 && (
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 shadow-xs space-y-3">
          <h4 className="font-display font-bold text-xs text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-500 animate-spin" style={{ animationDuration: '3s' }} />
            Quick Add
          </h4>
          <p className="text-[11px] text-slate-450 text-slate-400 leading-relaxed">
            Your recently logged foods. Click on the items below to log again with the same portion.
          </p>

          <div className="flex flex-wrap gap-2.5 mt-2">
            {recentFoods.map((food, idx) => (
              <button
                key={`${food.name}-${idx}`}
                onClick={() => onQuickAdd && onQuickAdd(food)}
                className="group relative flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-650 bg-white border border-slate-250/90 hover:border-emerald-250 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 text-left border-slate-200"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 font-semibold text-slate-800">
                    <Plus className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
                    <span>{food.name}</span>
                  </div>
                  {food.last_portion_grams && (
                    <span className="block text-[10px] font-medium text-slate-400 font-mono font-sans">
                      Last portion: {food.last_portion_grams}g <span className="text-slate-300">•</span> {food.calories} kcal
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
