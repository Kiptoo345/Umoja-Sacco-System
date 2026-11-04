import { useEffect, useState } from 'react';
import { apiFetch } from '../../api';

const money = (v) => `KES ${Number(v).toLocaleString()}`;

export default function Reports() {
  const [s, setS] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/reports/summary').then(setS).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!s) return <p>Loading...</p>;

  const cards = [
    ['Active members', s.active_members],
    ['Total savings', money(s.total_savings)],
    ['Verified deposits', money(s.total_verified_deposits)],
    ['Deposits awaiting verification', s.deposits_awaiting_verification],
    ['Active loans', s.active_loans],
    ['Outstanding loan balance', money(s.outstanding_loans)],
  ];

  return (
    <>
      <h2>Reports</h2>
      <div className="cards">
        {cards.map(([label, value]) => (
          <div className="stat" key={label}>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
          </div>
        ))}
      </div>
    </>
  );
}