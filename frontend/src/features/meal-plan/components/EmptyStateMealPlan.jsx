export default function EmptyStateMealPlan({ onGenerate, isGenerating }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem', fontWeight: 700 }}>
        {'No Meal Plan Yet'}
      </h3>
      <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
        {'Generate a personalized weekly meal plan based on your calorie target and available ingredients.'}
      </p>
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        style={{
          width: '100%', maxWidth: '300px', padding: '0.75rem 1rem',
          cursor: isGenerating ? 'not-allowed' : 'pointer', opacity: isGenerating ? 0.6 : 1,
          background: '#16a34a', border: 'none', borderRadius: '4px',
          color: '#fff', fontWeight: 'bold', fontSize: '0.875rem', minHeight: '44px',
        }}
      >
        {isGenerating ? 'Generating your meal plan...' : 'Generate My Meal Plan'}
      </button>
    </div>
  );
}
