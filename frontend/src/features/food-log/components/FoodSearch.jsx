import { useState, useEffect } from 'react';
import { searchFoods } from '../api/foodLogApi.js';
import { t } from '../../../shared/i18n/translations.js';

const categoryLabels = {
  makanan_pokok: t('foodLog.categories.makanan_pokok'),
  lauk: t('foodLog.categories.lauk'),
  sayur: t('foodLog.categories.sayur'),
  buah: t('foodLog.categories.buah'),
  minuman: t('foodLog.categories.minuman'),
  snack: t('foodLog.categories.snack'),
  lainnya: t('foodLog.categories.lainnya'),
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
    <div style={{ marginBottom: '1rem' }}>
      <input
        type="text"
        placeholder={t('foodLog.searchPlaceholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '0.75rem 0.5rem',
          boxSizing: 'border-box',
          fontSize: '1rem',
          minHeight: '44px',
        }}
      />

      {loading && <div style={{ padding: '0.5rem', color: '#666' }}>{t('auth.loading')}</div>}

      {query.length >= 2 && !loading && results.length === 0 && (
        <div style={{ padding: '0.5rem', color: '#666' }}>{t('foodLog.noResults')}</div>
      )}

      {results.length > 0 && (
        <div style={{
          maxHeight: '200px',
          overflowY: 'auto',
          border: '1px solid #e5e7eb',
          borderRadius: '4px',
          marginTop: '0.25rem',
        }}>
          {results.map((food) => (
            <div
              key={food.id}
              onClick={() => onFoodSelect(food)}
              style={{
                padding: '0.75rem 0.5rem',
                minHeight: '44px',
                cursor: 'pointer',
                borderBottom: '1px solid #f3f4f6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span>{food.name}</span>
              <span style={{ color: '#666', fontSize: '0.875rem' }}>
                {food.calories_per_100g} kkal/100g
                {food.category && <span style={{ marginLeft: '0.5rem', color: '#9ca3af' }}>({categoryLabels[food.category] || food.category})</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onToggleCustomForm}
        style={{
          marginTop: '0.5rem',
          padding: '0.75rem 1rem',
          fontSize: '0.875rem',
          cursor: 'pointer',
          minHeight: '44px',
        }}
      >
        + {t('foodLog.addCustomFood')}
      </button>
    </div>
  );
}
