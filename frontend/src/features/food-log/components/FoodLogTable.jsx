import { t } from '../../../shared/i18n/translations.js';

const mealTypeLabels = {
  sarapan: t('foodLog.sarapan'),
  makan_siang: t('foodLog.makanSiang'),
  makan_malam: t('foodLog.makanMalam'),
  camilan: t('foodLog.camilan'),
};

const mealTypeOrder = ['sarapan', 'makan_siang', 'makan_malam', 'camilan'];

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
      <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
        {t('foodLog.noLogsToday')}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>{t('foodLog.todaysLog')}</h3>

      {mealTypeOrder.map((mealType) => {
        const entries = grouped[mealType];
        if (!entries || entries.length === 0) return null;

        return (
          <div key={mealType} style={{ marginBottom: '0.75rem' }}>
            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', color: '#666' }}>
              {mealTypeLabels[mealType]}
            </h4>
            {entries.map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.375rem 0',
                  borderBottom: '1px solid #f3f4f6',
                  fontSize: '0.875rem',
                }}
              >
                <span>{log.food_name || log.custom_food_name}</span>
                <span style={{ color: '#666' }}>
                  {log.portion_grams}g — {log.calories} kcal
                </span>
              </div>
            ))}
          </div>
        );
      })}

      {/* Total */}
      <div style={{
        borderTop: '2px solid #e5e7eb',
        paddingTop: '0.5rem',
        fontWeight: 'bold',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>Total</span>
        <span>{totalCalories} kcal</span>
      </div>

      {/* Quick-add section */}
      {recentFoods && recentFoods.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#666' }}>
            {t('foodLog.quickAdd')}
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {recentFoods.map((food, idx) => (
              <button
                key={`${food.name}-${idx}`}
                onClick={() => onQuickAdd && onQuickAdd(food)}
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: '#fff',
                }}
              >
                {food.name}
                {food.last_portion_grams && (
                  <span style={{ fontSize: '0.65rem', color: '#888' }}> — last: {food.last_portion_grams}g</span>
                )}
                {' '}({food.calories} kcal)
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
