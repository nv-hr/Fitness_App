import ActivityCard from './ActivityCard.jsx';

export default function ActivityPool({ activities, onLogClick, isLogging }) {
  return (
    <div style={{ marginTop: '2rem' }}>
      <h3 style={{ marginBottom: '0.5rem' }}>
        {'All Activities'}
      </h3>
      <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
        {activities.length} {'Total activities'}
      </p>
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onLogClick={onLogClick}
            isLogging={isLogging?.id === activity.id}
          />
        ))}
      </div>
    </div>
  );
}
