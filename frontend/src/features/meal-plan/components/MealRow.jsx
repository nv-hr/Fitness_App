export default function MealRow({ item }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color: item.logged ? '#16a34a' : '#d1d5db', fontSize: '1rem' }}>
          {item.logged ? '✓' : '○'}
        </span>
        <span style={{ fontWeight: 500 }}>{item.food_name}</span>
      </div>
      <span style={{ whiteSpace: 'nowrap', marginLeft: '0.5rem', color: '#666' }}>
        {item.portion_grams}g · {item.calories} kcal
      </span>
    </div>
  );
}
