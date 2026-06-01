import { useState, useEffect } from 'react';
import { getWeightHistory, deleteWeightEntry } from '../api/weightApi.js';

export default function WeightHistoryTable({ refreshKey }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getWeightHistory();
      setEntries(response.data.entries || []);
    } catch (err) {
      setError(err.message || 'Failed to load weight history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [refreshKey]);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteWeightEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete entry');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem' }}>
        <h3 style={{ margin: '0 0 0.75rem 0' }}>Weight History</h3>
        <div style={{ padding: '1rem', textAlign: 'center', color: '#999' }}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem' }}>
        <h3 style={{ margin: '0 0 0.75rem 0' }}>Weight History</h3>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem' }}>
        <h3 style={{ margin: '0 0 0.75rem 0' }}>Weight History</h3>
        <p style={{ color: '#666', fontStyle: 'italic' }}>No weight entries yet. Log your first weight above.</p>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem' }}>
      <h3 style={{ margin: '0 0 0.75rem 0' }}>Weight History</h3>
      {error && <p style={{ color: 'red', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{error}</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
            <th style={{ textAlign: 'left', padding: '0.5rem', fontSize: '0.875rem', color: '#666' }}>Date</th>
            <th style={{ textAlign: 'left', padding: '0.5rem', fontSize: '0.875rem', color: '#666' }}>Weight</th>
            <th style={{ textAlign: 'left', padding: '0.5rem', fontSize: '0.875rem', color: '#666' }}>Source</th>
            <th style={{ textAlign: 'right', padding: '0.5rem', fontSize: '0.875rem', color: '#666' }}></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '0.5rem', fontSize: '0.875rem' }}>{entry.logged_date}</td>
              <td style={{ padding: '0.5rem', fontSize: '0.875rem' }}>{parseFloat(entry.weight_kg).toFixed(1)} kg</td>
              <td style={{ padding: '0.5rem' }}>
                <span
                  style={{
                    display: 'inline-block',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    background: entry.source === 'auto' ? '#e2e8f0' : '#d1fae5',
                    color: entry.source === 'auto' ? '#475569' : '#065f46',
                  }}
                >
                  {entry.source === 'auto' ? 'Auto' : 'Manual'}
                </span>
              </td>
              <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                <button
                  onClick={() => handleDelete(entry.id)}
                  disabled={deletingId === entry.id}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc2626',
                    cursor: deletingId === entry.id ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    minHeight: '44px',
                    padding: '0.25rem 0.5rem',
                  }}
                >
                  {deletingId === entry.id ? 'Deleting...' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
