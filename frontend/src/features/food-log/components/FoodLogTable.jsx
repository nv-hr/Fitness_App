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
      <div className="text-center py-10 px-4 rounded-xl border border-dashed" style={{ borderColor: '#2a2a2a', background: '#141414' }}>
        <AlertCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#444' }} />
        <p className="text-sm font-semibold" style={{ color: '#555' }}>Your food log for today is empty.</p>
        <p className="text-xs mt-1" style={{ color: '#444' }}>Use the search box above to add foods you have eaten recently!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Log Card list */}
      {logs.length > 0 && (
        <div className="p-5 rounded-xl border space-y-4" style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}>
          <h3 className="font-display font-bold text-sm uppercase tracking-widest flex items-center gap-1.5 border-b pb-2.5" style={{ color: '#888', borderColor: '#2a2a2a' }}>
            <span className="w-1.5 h-3.5 bg-red-600 rounded-full inline-block"></span>
            Today's Logs
          </h3>

          <div className="space-y-4">
            {mealTypeOrder.map((mealType) => {
              const entries = grouped[mealType];
              if (!entries || entries.length === 0) return null;
              const MealIcon = mealIconLabels[mealType] || Utensils;

              return (
                <div key={mealType} className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#555' }}>
                    <MealIcon className="w-3.5 h-3.5" style={{ color: '#666' }} />
                    {mealTypeLabels[mealType]}
                  </h4>
                  <div className="rounded-xl border px-3 py-1" style={{ background: '#141414', borderColor: '#242424' }}>
                    {entries.map((log) => (
                      <div
                        key={log.id}
                        className="flex justify-between items-center py-2.5 text-sm border-b last:border-0" style={{ borderColor: '#222' }}
                      >
                        <span className="font-semibold" style={{ color: '#d4d4d8' }}>{log.food_name || log.custom_food_name}</span>
                        <span className="text-xs font-bold font-mono" style={{ color: '#888' }}>
                          {log.portion_grams}g <span style={{ color: '#444' }}>•</span> {log.calories} kcal
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Today's logged total energy calorie summary bar */}
          <div className="border-t pt-4 flex justify-between items-center rounded-xl px-4 py-3.5 mt-2 shadow-inner" style={{ borderColor: '#2a2a2a', background: '#0d0d0d' }}>
            <span className="font-display font-bold text-sm flex items-center gap-1.5 text-white">
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
        <div className="p-5 rounded-xl border space-y-3" style={{ background: '#141414', borderColor: '#242424' }}>
          <h4 className="font-display font-bold text-xs uppercase tracking-widest flex items-center gap-1.5" style={{ color: '#555' }}>
            <Sparkles className="w-4 h-4 text-red-600 animate-spin" style={{ animationDuration: '3s' }} />
            Quick Add
          </h4>
          <p className="text-[11px] leading-relaxed" style={{ color: '#444' }}>
            Your recently logged foods. Click on the items below to log again with the same portion.
          </p>

          <div className="flex flex-wrap gap-2.5 mt-2">
            {recentFoods.map((food, idx) => (
              <button
                key={`${food.name}-${idx}`}
                onClick={() => onQuickAdd && onQuickAdd(food)}
                className="group relative flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 text-left"
                style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#999' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#b91c1c'; e.currentTarget.style.color = '#f87171'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#999'; }}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 font-semibold">
                    <Plus className="w-3.5 h-3.5 text-red-500 group-hover:scale-110 transition-transform" />
                    <span>{food.name}</span>
                  </div>
                  {food.last_portion_grams && (
                    <span className="block text-[10px] font-medium font-mono" style={{ color: '#555' }}>
                      Last portion: {food.last_portion_grams}g • {food.calories} kcal
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
